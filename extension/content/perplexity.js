// Context One - Perplexity Content Script
// Injects context via fetch interception and captures conversations

(function() {
  'use strict';
  
  console.log('Context One: Perplexity content script loaded');
  
  const TOOL = 'perplexity';
  let conversationId = null;
  let isInitialized = false;
  let lastMessage = '';
  let pendingContext = null;
  let lastCapturedMessage = '';
  let lastCapturedTime = 0;
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing Perplexity integration');
    
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
      
      // Check if this is a Perplexity API call
      if (url.includes('perplexity.ai') || url.includes('/api/') || url.includes('/search')) {
        console.log('Context One: Intercepted Perplexity API call', url);
        
        // If we have pending context, inject it into the request
        if (pendingContext) {
          try {
            const body = options.body ? JSON.parse(options.body) : {};
            
            // Inject context as system message
            if (body.messages && Array.isArray(body.messages)) {
              body.messages.unshift({
                role: 'system',
                content: pendingContext
              });
            } else if (body.prompt) {
              body.prompt = pendingContext + '\n\n' + body.prompt;
            } else if (body.model) {
              // Handle different API formats
              body.messages = body.messages || [];
              body.messages.unshift({
                role: 'system',
                content: pendingContext
              });
            }
            
            options.body = JSON.stringify(body);
            console.log('Context One: Injected context into Perplexity API request');
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
    
    console.log('Context One: Perplexity fetch interception set up');
    
    // Also intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      console.log('Context One: 🔍 Perplexity XHR call to:', url);
      
      if (url && (url.includes('perplexity.ai') || url.includes('/search') || url.includes('/ask'))) {
        console.log('Context One: ✅ Intercepted Perplexity XHR call');
        
        const originalSend = this.send;
        const self = this;
        
        this.send = function(body) {
          if (pendingContext) {
            try {
              const parsed = body ? JSON.parse(body) : {};
              if (parsed.messages && Array.isArray(parsed.messages)) {
                parsed.messages.unshift({ role: 'user', content: pendingContext });
                console.log('Context One: ✅ Injected context into Perplexity XHR');
                body = JSON.stringify(parsed);
              }
            } catch (e) {
              console.log('Context One: ❌ Perplexity XHR inject error:', e.message);
            }
            pendingContext = null;
          }
          return originalSend.call(self, body);
        };
      }
      
      return originalXHR.apply(this, arguments);
    };
    
    console.log('Context One: Perplexity XHR interception set up');
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
        console.log('Context One: Perplexity message updated:', lastMessage.substring(0, 30));
        
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
      }
    } catch (e) {
      console.log('Context One: Error pre-fetching context:', e.message);
    }
  }
  
  // Update conversation ID from URL
  function updateConversationId() {
    const match = window.location.href.match(/\/search\/([a-zA-Z0-9-]+)/);
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
    // Perplexity uses various selectors - try many options
    const sendButton = 
      document.querySelector('button[data-testid="submit-button"]') || 
      document.querySelector('button[aria-label="Submit"]') ||
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('button[type="submit"]') ||
      document.querySelector('.submit-btn') ||
      document.querySelector('main button svg')?.closest('button') ||
      document.querySelector('textarea')?.closest('div')?.querySelector('button');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      sendButton.addEventListener('click', handleSend);
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Perplexity send button', sendButton);
    } else {
      console.log('Context One: Send button not found, will retry...');
    }
    
    // Also watch for Enter key in textarea
    const textarea = document.querySelector('textarea[placeholder*="Ask"]') || 
                     document.querySelector('textarea');
    if (textarea && !textarea.dataset.contextOneAttached) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          console.log('Context One: Enter key detected');
          setTimeout(() => handleSend(), 100);
        }
      });
      textarea.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to textarea Enter key');
    }
    
    // Also watch for contenteditable div
    const inputDiv = document.querySelector('[contenteditable="true"]');
    if (inputDiv && !inputDiv.dataset.contextOneAttached) {
      inputDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          console.log('Context One: Enter key detected in contenteditable');
          setTimeout(() => handleSend(), 100);
        }
      });
      inputDiv.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to contenteditable Enter key');
    }
  }
  
  // Handle message send
  async function handleSend() {
    console.log('Context One: handleSend triggered');
    
    // Get message from various sources
    const textarea = document.querySelector('textarea');
    const inputDiv = document.querySelector('[contenteditable="true"]');
    
    let userMessage = textarea?.value?.trim() || 
                      inputDiv?.textContent?.trim() || 
                      lastMessage;
    
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
    
    console.log('Context One: Capturing user message for Perplexity:', userMessage.substring(0, 50));
    
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
    badge.innerHTML = '● Context One';
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