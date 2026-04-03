// Context One - Claude Content Script
// Injects context via fetch interception and captures conversations

(function() {
  'use strict';
  
  console.log('Context One: Claude content script loaded');
  
  const TOOL = 'claude';
  let conversationId = null;
  let isInitialized = false;
  let lastMessage = '';
  let pendingApiCall = null;
  
  // Store for context to inject
  let pendingContext = null;
  let lastCapturedMessage = '';
  let lastCapturedTime = 0;
  
  // Inject MAIN world interceptor (inline to avoid chrome.runtime.getURL from ISOLATED world)
  function injectMainWorldInterceptor() {
    if (window.__CONTEXT_ONE_INTERCEPTOR__) return;
    
    // Inline interceptor code - runs in MAIN world
    const interceptorCode = `
      (function() {
        'use strict';
        if (window.__CONTEXT_ONE_INTERCEPTOR__) return;
        window.__CONTEXT_ONE_INTERCEPTOR__ = true;
        console.log('Context One: MAIN world interceptor loaded');
        
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          const options = args[1] || {};
          console.log('🔍 Context One: Fetch call to:', url);
          
          const isClaudeAPI = url.includes('claude.ai') || url.includes('anthropic.com') || url.includes('/api/');
          const isChatGPTAPI = url.includes('chatgpt.com') || url.includes('openai.com') || url.includes('/backend-api');
          const isGeminiAPI = url.includes('generativelanguage.googleapis.com') || url.includes('gemini.google.com');
          
          if (isClaudeAPI || isChatGPTAPI || isGeminiAPI) {
            console.log('✅ Context One: Intercepted AI API call');
            const context = window.__CONTEXT_ONE_DATA__ || null;
            if (context && options.body) {
              try {
                const body = JSON.parse(options.body);
                if (body.messages && Array.isArray(body.messages)) {
                  body.messages.unshift({ role: 'user', content: context });
                  options.body = JSON.stringify(body);
                  console.log('✅ Context One: Injected context');
                }
              } catch (e) { console.log('❌ Context One: inject error', e.message); }
            }
          }
          return originalFetch.apply(this, args);
        };
        
        window.__CONTEXT_ONE_SET_CONTEXT__ = function(data) {
          window.__CONTEXT_ONE_DATA__ = data;
          console.log('✅ Context One: Context updated in MAIN world');
        };
        console.log('Context One: MAIN world interceptor initialized');
      })();
    `;
    
    const script = document.createElement('script');
    script.textContent = interceptorCode;
    script.onload = () => {
      console.log('Context One: MAIN world interceptor injected');
    };
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing Claude integration');
    
    // Inject MAIN world interceptor FIRST
    injectMainWorldInterceptor();
    
    // Set up fetch interception for API calls
    setupFetchInterception();
    
    // Get conversation ID from URL
    updateConversationId();
    
    // Watch for navigation changes
    observeNavigation();
    
    // Attach to send button
    attachToSendButton();
    setInterval(attachToSendButton, 2000);
    
    // Add status badge
    addStatusBadge();
    
    // Also poll for input changes
    pollForInput();
    
    isInitialized = true;
  }
  
  // Set up fetch interception to inject context into API calls
  function setupFetchInterception() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const url = args[0];
      const options = args[1] || {};
      
      // Debug: log all fetch calls
      console.log('Context One: 🔍 Fetch call to:', url);
      
      // Check if this is a Claude API call - be more permissive
      const isClaudeCall = url.includes('claude.ai') || 
                          url.includes('anthropic.com') ||
                          url.includes('/api/') ||
                          url.includes('/conversation') ||
                          url.includes('completion');
      
      if (isClaudeCall) {
        console.log('Context One: ✅ Intercepted Claude API call');
        
        // Try to inject context
        if (pendingContext) {
          try {
            const body = options.body ? JSON.parse(options.body) : {};
            console.log('Context One: 📦 Request body keys:', Object.keys(body));
            
            // Inject as first user message (hidden from UI)
            if (body.messages && Array.isArray(body.messages)) {
              // Add context as a user message at the beginning
              body.messages.unshift({
                role: 'user',
                content: pendingContext
              });
              console.log('Context One: ✅ Injected context into body.messages');
            }
            
            options.body = JSON.stringify(body);
            console.log('Context One: ✅ Context injection complete');
          } catch (e) {
            console.log('Context One: ❌ Error injecting context:', e.message);
          }
          
          pendingContext = null;
        }
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('Context One: Fetch interception set up');
    
    // Also intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      console.log('Context One: 🔍 XHR call to:', url);
      
      // Check if this is a Claude API call
      if (url && (url.includes('claude.ai') || url.includes('/api/') || url.includes('/conversation'))) {
        console.log('Context One: ✅ Intercepted Claude XHR call');
        
        // Store the original send function
        const originalSend = this.send;
        const self = this;
        
        this.send = function(body) {
          console.log('Context One: 📤 XHR send called');
          
          if (pendingContext) {
            try {
              const parsed = body ? JSON.parse(body) : {};
              console.log('Context One: 📦 XHR body keys:', Object.keys(parsed));
              
              if (parsed.messages && Array.isArray(parsed.messages)) {
                parsed.messages.unshift({
                  role: 'user',
                  content: pendingContext
                });
                console.log('Context One: ✅ Injected context into XHR body');
                body = JSON.stringify(parsed);
              }
            } catch (e) {
              console.log('Context One: ❌ XHR inject error:', e.message);
            }
            pendingContext = null;
          }
          
          return originalSend.call(self, body);
        };
      }
      
      return originalXHR.apply(this, arguments);
    };
    
    console.log('Context One: XHR interception set up');
  }
  
  // Update conversation ID from URL
  function updateConversationId() {
    const match = window.location.href.match(/\/chat\/([a-zA-Z0-9-]+)/);
    if (match) {
      conversationId = match[1];
    }
  }
  
  // Observe URL changes (SPA)
  function observeNavigation() {
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        updateConversationId();
        attachToSendButton();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Find and attach to send button
  function attachToSendButton() {
    // Try multiple selectors for Claude
    const selectors = [
      '[data-testid="send-button"]',
      'button[aria-label="Send"]',
      'button[aria-label="Submit"]',
      '.btn-primary',
      'button[type="submit"]',
      'form button',
      'button.rounded-lg',
      'button:has(svg)'
    ];
    
    for (const sel of selectors) {
      const sendButton = document.querySelector(sel);
      if (sendButton && !sendButton.dataset.contextOneAttached) {
        sendButton.addEventListener('click', (e) => {
          console.log('Context One: 🖱️ Send button clicked!');
          handleSend();
        });
        sendButton.dataset.contextOneAttached = 'true';
        console.log('Context One: Attached to Claude send button via', sel);
      }
    }
    
    // Also watch for Enter key in textarea
    const textareas = document.querySelectorAll('textarea, [contenteditable="true"]');
    textareas.forEach(textarea => {
      if (!textarea.dataset.contextOneAttached) {
        // Capture on input event immediately
        textarea.addEventListener('input', () => {
          const val = textarea.value || textarea.textContent;
          if (val && val.trim()) {
            lastMessage = val.trim();
          }
        });
        
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            console.log('Context One: ⌨️ Enter key pressed!');
            // Capture immediately before send
            setTimeout(() => handleSend(), 0);
          }
        });
        textarea.dataset.contextOneAttached = 'true';
      }
    });
  }
  
  // Poll for input changes - more frequently
  function pollForInput() {
    setInterval(() => {
      // Try contenteditable first
      const inputDiv = document.querySelector('[contenteditable="true"]');
      if (inputDiv) {
        const currentVal = inputDiv.textContent?.trim();
        if (currentVal && currentVal !== lastMessage) {
          lastMessage = currentVal;
          console.log('Context One: Message updated:', lastMessage.substring(0, 30));
        }
      }
      
      // Also try textarea
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const currentVal = textarea.value?.trim();
        if (currentVal && currentVal !== lastMessage) {
          lastMessage = currentVal;
          console.log('Context One: Message updated:', lastMessage.substring(0, 30));
        }
      }
    }, 100);
  }
  
  // Handle message send
  async function handleSend() {
    console.log("Context One: 🔔 handleSend called, lastMessage:", lastMessage);
    
    // Get message directly from DOM (most reliable)
    const inputDiv = document.querySelector('[contenteditable="true"]');
    let userMessage = inputDiv?.textContent?.trim() || lastMessage;
    
    console.log("Context One: 📝 userMessage to capture:", userMessage);
    
    if (!userMessage || userMessage.length < 2) {
      console.log('Context One: ❌ No message found to capture');
      return;
    }
    
    console.log('Context One: 📤 Calling captureMessage for:', userMessage.substring(0, 30));
    await captureMessage(userMessage);
    console.log('Context One: ✅ captureMessage returned');
  }
  
  // Safe message sender with context validation
  async function safeSendMessage(msg) {
    if (!chrome.runtime?.id) {
      console.log('Context One: Extension context invalidated, skipping...');
      return null;
    }
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch (err) {
      console.log('Context One: Message send error:', err.message);
      return null;
    }
  }

  async function captureMessage(userMessage) {
    // Deduplication: skip if same message captured in last 2 seconds
    const now = Date.now();
    if (userMessage === lastCapturedMessage && now - lastCapturedTime < 2000) {
      console.log('Context One: Skipping duplicate capture');
      return;
    }
    lastCapturedMessage = userMessage;
    lastCapturedTime = now;
    
    console.log('Context One: Capturing user message for Claude:', userMessage.substring(0, 50));
    
    // Get context for injection FIRST
    let contextResponse = null;
    try {
      contextResponse = await safeSendMessage({
        type: 'GET_CONTEXT',
        message: userMessage,
        projectId: null,
        tool: TOOL
      });
    } catch (e) {
      console.log('Context One: Error getting context:', e.message);
    }
    
    console.log('Context One: Got context response:', contextResponse);
    
    // Store context for fetch interception (this will inject into API call)
    if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
      pendingContext = contextResponse.context;
      console.log('Context One: Context stored for API injection');
      
      // Sync to MAIN world interceptor
      if (window.__CONTEXT_ONE_SET_CONTEXT__) {
        window.__CONTEXT_ONE_SET_CONTEXT__(contextResponse.context);
      }
    }
    
    // Capture user message
    try {
      await safeSendMessage({
        type: 'CAPTURE_MESSAGE',
        conversationId: conversationId,
        role: 'user',
        content: userMessage,
        tool: TOOL
      });
    } catch (e) {
      console.log('Context One: Error capturing message:', e.message);
    }
    
    if (contextResponse && contextResponse.context) {
      console.log('Context One: Context captured for injection');
    }
  }
  
  // Add floating status badge
  function addStatusBadge() {
    if (document.getElementById('context-one-badge')) return;
    
    const badge = document.createElement('div');
    badge.id = 'context-one-badge';
    badge.textContent = '● Context One';
    badge.title = 'Context One - Unified AI Memory';
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #00d4ff;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 9999;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
      transition: all 0.3s ease;
    `;
    
    badge.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    });
    
    document.body.appendChild(badge);
    
    // Also add debug info
    console.log('Context One: Badge added. lastMessage:', lastMessage);
  }
  
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Re-initialize on navigation
  window.addEventListener('popstate', init);
  
  // Always show badge (fallback with retries)
  setTimeout(addStatusBadge, 2000);
  setTimeout(addStatusBadge, 4000);
  setTimeout(addStatusBadge, 6000);
})();