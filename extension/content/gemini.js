// Context One - Gemini Content Script
// Injects context via fetch interception and captures conversations

(function() {
  'use strict';
  
  console.log('Context One: Gemini content script loaded');
  
  const TOOL = 'gemini';
  let conversationId = null;
  let isInitialized = false;
  let lastMessage = '';
  let pendingContext = null;
  let lastCapturedMessage = '';  // For deduplication
  let lastCapturedTime = 0;
  
  // ============================================
  // INJECT MAIN WORLD INTERCEPTOR (FALLBACK)
  // ============================================
  function injectMainWorldInterceptor() {
    if (window.__CONTEXT_ONE_INJECTOR_LOADED__) return;
    window.__CONTEXT_ONE_INJECTOR_LOADED__ = true;
    
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject/interceptor.js');
    script.onload = function() {
      console.log('Context One: MAIN world interceptor loaded (fallback)');
      script.remove();
    };
    script.onerror = function(e) {
      console.log('Context One: Failed to load interceptor:', e);
      window.__CONTEXT_ONE_INJECTOR_LOADED__ = false;
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
    
    chrome.runtime.sendMessage({
      type: 'INJECT_MAIN_WORLD',
      tool: TOOL
    }).then(() => {
      console.log('Context One: Requested MAIN world injection');
    }).catch(e => {
      console.log('Context One: Injection request failed:', e.message);
    });
    
    // Also try direct injection as fallback
    setTimeout(() => {
      injectMainWorldInterceptor();
    }, 1000);
    
    // Listen for context requests from MAIN world interceptor
    // Fetch directly from storage - no waiting for DOM!
    window.addEventListener('CONTEXT_ONE_REQUEST', async (e) => {
      console.log('Context One: 📨 Isolated world received request');
      
      try {
        const result = await chrome.storage.local.get(['messages', 'activeProject']);
        const allMessages = result.messages || [];
        const activeProject = result.activeProject || null;
        
        let projectMessages = allMessages;
        if (activeProject) {
          projectMessages = allMessages.filter(m => m.projectId === activeProject);
        }
        
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
    
    console.log('Context One: Initializing Gemini integration');
    
    // Set up fetch interception for API calls
    setupFetchInterception();
    
    // Get conversation ID from URL
    updateConversationId();
    
    // Watch for navigation changes
    observeNavigation();
    
    // Attach to send button (retry multiple times)
    attachToSendButton();
    setTimeout(attachToSendButton, 1000);
    setTimeout(attachToSendButton, 3000);
    setTimeout(attachToSendButton, 5000);
    
    // Add status badge
    addStatusBadge();
    
    // Poll for input changes
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
      console.log('Context One: 🔍 Gemini Fetch call to:', url);
      
      // Check if this is a Gemini API call
      if (url.includes('generativelanguage.googleapis.com') || url.includes('gemini.google.com')) {
        console.log('Context One: Intercepted Gemini API call', url);
        
        // If we have pending context, inject it into the request
        if (pendingContext) {
          try {
            const body = options.body ? JSON.parse(options.body) : {};
            
            // Inject context into contents (Gemini format)
            if (body.contents && Array.isArray(body.contents)) {
              // Add context as a system instruction
              body.systemInstruction = {
                role: 'system',
                parts: [{ text: pendingContext }]
              };
            } else if (body.model) {
              // Handle different API formats
              body.systemInstruction = {
                role: 'system',
                parts: [{ text: pendingContext }]
              };
            }
            
            options.body = JSON.stringify(body);
            console.log('Context One: Injected context into Gemini API request');
          } catch (e) {
            console.log('Context One: Error injecting context:', e.message);
          }
          
          // Clear pending context after use
          pendingContext = null;
        } else {
          console.log('Context One: No pending context to inject');
        }
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('Context One: Gemini fetch interception set up');
    
    // Also intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      console.log('Context One: 🔍 Gemini XHR call to:', url);
      
      if (url && (url.includes('generativelanguage.googleapis.com') || url.includes('gemini.google.com'))) {
        console.log('Context One: ✅ Intercepted Gemini XHR call');
        
        const originalSend = this.send;
        const self = this;
        
        this.send = function(body) {
          if (pendingContext) {
            try {
              const parsed = body ? JSON.parse(body) : {};
              if (parsed.contents && Array.isArray(parsed.contents)) {
                parsed.contents.unshift({ role: 'user', parts: [{ text: pendingContext }] });
                console.log('Context One: ✅ Injected context into Gemini XHR');
                body = JSON.stringify(parsed);
              }
            } catch (e) {
              console.log('Context One: ❌ Gemini XHR inject error:', e.message);
            }
            pendingContext = null;
          }
          return originalSend.call(self, body);
        };
      }
      
      return originalXHR.apply(this, arguments);
    };
    
    console.log('Context One: Gemini XHR interception set up');
  }
  
  // Poll for input changes - also pre-fetch context (with debounce)
  function pollForInput() {
    let contextFetchedForMessage = '';
    let debounceTimer = null;
    
    setInterval(() => {
      const inputDiv = document.querySelector('[contenteditable="true"]');
      let currentVal = '';
      
      if (inputDiv) {
        currentVal = inputDiv.textContent?.trim();
      }
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const textareaVal = textarea.value?.trim();
        if (textareaVal && textareaVal.length > currentVal.length) {
          currentVal = textareaVal;
        }
      }
      
      if (currentVal && currentVal !== lastMessage) {
        lastMessage = currentVal;
        console.log('Context One: Gemini message updated:', lastMessage.substring(0, 30));
        
        // PRE-FETCH CONTEXT: If message is long enough and different from what we fetched for
        if (currentVal.length > 10 && currentVal !== contextFetchedForMessage) {
          // Clear any pending debounce timer
          if (debounceTimer) clearTimeout(debounceTimer);
          
          // Debounce: wait 500ms after user stops typing before fetching
          debounceTimer = setTimeout(() => {
            contextFetchedForMessage = currentVal;
            console.log('Context One: Pre-fetching context for:', currentVal.substring(0, 30));
            prefetchContext(currentVal);
          }, 500);
        }
      }
    }, 200);
  }
  
  // Pre-fetch context while user is typing - ensures it's ready when they send
  async function prefetchContext(userMessage) {
    try {
      const contextResponse = await safeSendMessage({
        type: 'GET_CONTEXT',
        message: userMessage,
        projectId: null,
        tool: TOOL
      });
      
      if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
        pendingContext = contextResponse.context;
        console.log('Context One: Pre-fetched context ready for injection');
        
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
    } catch (e) {
      console.log('Context One: Error pre-fetching context:', e.message);
    }
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
    // Gemini uses various selectors - try many options
    const sendButton = 
      document.querySelector('button[aria-label="Send message"]') || 
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('button[aria-label="Submit"]') ||
      document.querySelector('.send-button') ||
      document.querySelector('main button svg')?.closest('button') ||
      document.querySelector('textarea')?.closest('div')?.querySelector('button');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      sendButton.addEventListener('click', async (e) => {
        // Get message from input
        const textarea = document.querySelector('textarea');
        const inputDiv = document.querySelector('[contenteditable="true"]');
        const userMessage = textarea?.value?.trim() || inputDiv?.textContent?.trim() || '';
        
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
        
        handleSend();
      });
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Gemini send button', sendButton);
    } else {
      console.log('Context One: Gemini send button not found, will retry...');
    }
    
    // Also watch for Enter key in textarea
    const textarea = document.querySelector('textarea') || 
                     document.querySelector('rich-textarea div[contenteditable="true"]') ||
                     document.querySelector('[contenteditable="true"]');
    if (textarea && !textarea.dataset.contextOneAttached) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          console.log('Context One: Enter key detected in Gemini');
          setTimeout(() => handleSend(), 100);
        }
      });
      textarea.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Gemini textarea Enter key');
    }
  }
  
  // Handle message send
  async function handleSend() {
    console.log('Context One: handleSend triggered for Gemini');
    
    // Get message from various sources
    const textarea = document.querySelector('textarea');
    const inputDiv = document.querySelector('[contenteditable="true"]');
    let userMessage = textarea?.value?.trim() || inputDiv?.textContent?.trim() || lastMessage;
    
    if (!userMessage || userMessage.length < 2) {
      console.log('Context One: No message found to capture');
      return;
    }
    
    await captureMessage(userMessage);
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
    
    console.log('Context One: Capturing user message for Gemini:', userMessage.substring(0, 50));
    
    // Get context for injection FIRST
    const contextResponse = await safeSendMessage({
      type: 'GET_CONTEXT',
      message: userMessage,
      projectId: null,
      tool: TOOL
    });
    
    // Store context for fetch interception
    if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
      pendingContext = contextResponse.context;
      console.log('Context One: Context stored for API injection');
      
      // Sync to MAIN world for interceptor
      syncContextToMainWorld(contextResponse.context);
    }
    
    // Capture user message
    await safeSendMessage({
      type: 'CAPTURE_MESSAGE',
      conversationId: conversationId,
      role: 'user',
      content: userMessage,
      tool: TOOL
    });
    
    if (contextResponse && contextResponse.context) {
      console.log('Context One: Context captured for injection');
    }
  }
  
  // Add floating status badge
  function addStatusBadge() {
    if (document.getElementById('context-one-badge')) return;
    
    const target = document.body || document.documentElement;
    if (!target) {
      console.log('Context One: No body found, retrying...');
      setTimeout(addStatusBadge, 500);
      return;
    }
    
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
    
    target.appendChild(badge);
    console.log('Context One: Badge added');
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