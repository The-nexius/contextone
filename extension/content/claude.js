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
  
  // ============================================
  // INJECT MAIN WORLD INTERCEPTOR (FALLBACK)
  // ============================================
  function injectMainWorldInterceptor() {
    if (window.__CONTEXT_ONE_INJECTOR_LOADED__) return;
    window.__CONTEXT_ONE_INJECTOR_LOADED__ = true;
    
    // Create script element to inject interceptor into MAIN world
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject/claude-interceptor.js');
    script.onload = function() {
      console.log('Context One: Claude MAIN world interceptor loaded');
      script.remove();
    };
    script.onerror = function(e) {
      console.log('Context One: Failed to load claude-interceptor, trying generic:', e);
      // Fallback to generic interceptor
      const fallback = document.createElement('script');
      fallback.src = chrome.runtime.getURL('inject/interceptor.js');
      fallback.onload = function() {
        console.log('Context One: Generic interceptor loaded as fallback');
        fallback.remove();
      };
      (document.head || document.documentElement).appendChild(fallback);
    };
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Sync context to MAIN world
  function syncContextToMainWorld(context) {
    if (window.__CONTEXT_ONE_SET_CONTEXT__) {
      window.__CONTEXT_ONE_SET_CONTEXT__(context, TOOL);
    }
  }
  
  // ============================================
  // REQUEST MAIN WORLD INJECTION FROM BACKGROUND
  // ============================================
  (function requestMainWorldInjection() {
    if (window.__CONTEXT_ONE_INJECTION_REQUESTED__) return;
    window.__CONTEXT_ONE_INJECTION_REQUESTED__ = true;
    
    // Try background first
    chrome.runtime.sendMessage({
      type: 'INJECT_MAIN_WORLD',
      tool: TOOL
    }).then(() => {
      console.log('Context One: Requested MAIN world injection');
    }).catch(e => {
      console.log('Context One: Injection request failed:', e.message);
    });
    
    // Also try direct injection as fallback (works without chrome.runtime APIs)
    // Use setTimeout to ensure page has loaded enough
    setTimeout(() => {
      injectMainWorldInterceptor();
    }, 1000);
    
    // Listen for context requests from MAIN world interceptor
    // Fetch directly from storage - no waiting for DOM!
    window.addEventListener('CONTEXT_ONE_REQUEST', async (e) => {
      console.log('Context One: 📨 Isolated world received request');
      
      try {
        // Get messages directly from storage - no API call needed
        const result = await chrome.storage.local.get(['messages', 'activeProject']);
        const allMessages = result.messages || [];
        const activeProject = result.activeProject || null;
        
        // Filter by project if set
        let projectMessages = allMessages;
        if (activeProject) {
          projectMessages = allMessages.filter(m => m.projectId === activeProject);
        }
        
        // Get recent messages
        const recentMessages = projectMessages.slice(-5);
        
        if (recentMessages.length > 0) {
          const context = recentMessages
            .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
            .join('\n\n');
          
          console.log('Context One: 📤 Dispatching response:', context.substring(0, 80));
          
          window.dispatchEvent(new CustomEvent('CONTEXT_ONE_RESPONSE', {
            detail: { context }
          }));
        } else {
          console.log('Context One: No messages in storage');
          window.dispatchEvent(new CustomEvent('CONTEXT_ONE_RESPONSE', {
            detail: { context: null }
          }));
        }
      } catch(err) {
        console.log('Context One: Storage error:', err.message);
        window.dispatchEvent(new CustomEvent('CONTEXT_ONE_RESPONSE', {
          detail: { context: null }
        }));
      }
    });
  })();
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing Claude integration');
    
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
        sendButton.addEventListener('click', async (e) => {
          console.log('Context One: 🖱️ Send button clicked!');
          
          // Get message from input
          const inputDiv = document.querySelector('[contenteditable="true"]');
          const userMessage = inputDiv?.textContent?.trim() || '';
          
          if (userMessage) {
            // Fetch context SYNCHRONOUSLY before API call
            try {
              const contextResponse = await chrome.runtime.sendMessage({
                type: 'GET_CONTEXT',
                message: userMessage,
                projectId: null,
                tool: TOOL
              });
              
              if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
                // Write to DOM IMMEDIATELY before API call
                let contextEl = document.getElementById('__context_one_data__');
                if (!contextEl) {
                  contextEl = document.createElement('div');
                  contextEl.id = '__context_one_data__';
                  contextEl.style.display = 'none';
                  document.body.appendChild(contextEl);
                }
                contextEl.textContent = contextResponse.context;
                console.log('Context One: ⚡ Context written to DOM BEFORE API call');
              }
            } catch(e) {
              console.log('Context One: Context fetch error:', e.message);
            }
          }
          
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
        
        textarea.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            console.log('Context One: ⌨️ Enter key pressed!');
            
            // Get message from input
            const inputDiv = document.querySelector('[contenteditable="true"]');
            const userMessage = inputDiv?.textContent?.trim() || '';
            
            if (userMessage) {
              // Fetch context SYNCHRONOUSLY before API call
              try {
                const contextResponse = await chrome.runtime.sendMessage({
                  type: 'GET_CONTEXT',
                  message: userMessage,
                  projectId: null,
                  tool: TOOL
                });
                
                if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
                  let contextEl = document.getElementById('__context_one_data__');
                  if (!contextEl) {
                    contextEl = document.createElement('div');
                    contextEl.id = '__context_one_data__';
                    contextEl.style.display = 'none';
                    document.body.appendChild(contextEl);
                  }
                  contextEl.textContent = contextResponse.context;
                  console.log('Context One: ⚡ Context written to DOM BEFORE API call');
                }
              } catch(err) {
                console.log('Context One: Context fetch error:', err.message);
              }
            }
            
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
      
      // Sync to MAIN world for interceptor
      syncContextToMainWorld(contextResponse.context);
      
      // Write to DOM for MAIN world interceptor to read
      let contextEl = document.getElementById('__context_one_data__');
      if (!contextEl) {
        contextEl = document.createElement('div');
        contextEl.id = '__context_one_data__';
        contextEl.style.display = 'none';
        document.body.appendChild(contextEl);
      }
      contextEl.textContent = contextResponse.context;
      console.log('Context One: Context written to DOM for MAIN world');
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