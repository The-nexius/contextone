// Context One - ChatGPT Content Script
// Injects context via fetch interception and captures conversations

(function() {
  'use strict';
  
  console.log('Context One: ChatGPT content script loaded');
  
  const TOOL = 'chatgpt';
  let conversationId = null;
  let isInitialized = false;
  let lastMessage = '';
  let pendingContext = null;
  let lastCapturedMessage = '';
  let lastCapturedTime = 0;
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing ChatGPT integration');
    
    // Set up fetch interception for API calls
    setupFetchInterception();
    
    // Get conversation ID from URL
    updateConversationId();
    
    // Watch for navigation changes
    observeNavigation();
    
    // Attach to send button (with retries)
    attachToSendButton();
    setTimeout(attachToSendButton, 1000);
    setTimeout(attachToSendButton, 3000);
    setTimeout(attachToSendButton, 5000);
    
    // Aggressive polling every 2 seconds
    setInterval(attachToSendButton, 2000);
    
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
      
      // Check if this is a ChatGPT/OpenAI API call
      if (url.includes('chatgpt.com') || url.includes('openai.com') || url.includes('/api/') || url.includes('/conversation')) {
        console.log('Context One: Intercepted ChatGPT API call', url);
        
        // If we have pending context, inject it into the request
        if (pendingContext) {
          try {
            const body = options.body ? JSON.parse(options.body) : {};
            
            // Inject context into messages array (as system message)
            if (body.messages && Array.isArray(body.messages)) {
              // Add context as a system message at the beginning
              body.messages.unshift({
                role: 'system',
                content: pendingContext
              });
            } else if (body.model) {
              // Handle different API formats
              body.messages = body.messages || [];
              body.messages.unshift({
                role: 'system',
                content: pendingContext
              });
            }
            
            options.body = JSON.stringify(body);
            console.log('Context One: Injected context into ChatGPT API request');
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
    
    console.log('Context One: ChatGPT fetch interception set up');
  }
  
  // Update conversation ID from URL
  function updateConversationId() {
    const match = window.location.href.match(/t\/([a-zA-Z0-9-]+)/);
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
    console.log('Context One: attachToSendButton called for ChatGPT');
    
    // ChatGPT uses various selectors - try many options
    const sendButton = 
      document.querySelector('button[data-testid="send-button"]') ||
      document.querySelector('button[aria-label="Send message"]') ||
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('button[aria-label="Submit"]') ||
      document.querySelector('#prompt-textarea + button') ||
      document.querySelector('[data-testid="root"] button') ||
      document.querySelector('form button[type="submit"]') ||
      document.querySelector('main button') ||
      document.querySelector('form button') ||
      document.querySelector('button.rounded-lg') ||
      document.querySelector('button:has(svg)');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      // Use capture phase like Grok does
      sendButton.addEventListener('click', () => {
        const msg = getMessageFromDOM();
        if (msg) {
          console.log('Context One: Captured ChatGPT message from click:', msg.substring(0, 50));
          captureMessage(msg);
        }
      }, true);
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to ChatGPT send button (capture phase)', sendButton);
    } else if (!sendButton) {
      console.log('Context One: ChatGPT send button not found, will retry...');
    }
    
    // Also watch for Enter key in ProseMirror div
    const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') || 
                      document.querySelector('[contenteditable="true"][role="textbox"]') ||
                      document.querySelector('[contenteditable="true"]');
    if (promptDiv && !promptDiv.dataset.contextOneAttached) {
      promptDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          console.log('Context One: Enter key detected in ChatGPT');
          setTimeout(() => {
            const msg = getMessageFromDOM();
            if (msg) {
              console.log('Context One: Captured ChatGPT message from Enter:', msg.substring(0, 50));
              captureMessage(msg);
            }
          }, 100);
        }
      }, true);
      promptDiv.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to ChatGPT textarea Enter key (capture phase)');
    }
    
    // AGGRESSIVE: Also listen for any click near the bottom of the page (where send button usually is)
    document.addEventListener('click', (e) => {
      const target = e.target;
      // Check if click is near the bottom of the page (likely send button area)
      if (window.innerHeight - target.getBoundingClientRect().top < 200) {
        const msg = getMessageFromDOM();
        if (msg && msg.length > 2) {
          console.log('Context One: Captured ChatGPT message from bottom click');
          captureMessage(msg);
        }
      }
    }, true);
    
    // Log what we found
    console.log('Context One: ChatGPT elements found:', {
      sendButton: !!sendButton,
      promptDiv: !!promptDiv
    });
  }
  
  // Get message from DOM (before it's cleared)
  function getMessageFromDOM() {
    // Try multiple sources
    const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') || 
                      document.querySelector('[contenteditable="true"][role="textbox"]') ||
                      document.querySelector('[contenteditable="true"]');
    
    const textarea = document.querySelector('textarea');
    
    const promptDivText = promptDiv?.textContent?.trim() || '';
    const textareaVal = textarea?.value?.trim() || '';
    
    // Prefer the longer one
    let msg = '';
    if (promptDivText.length > textareaVal.length && promptDivText.length > 1) {
      msg = promptDivText;
    } else if (textareaVal.length > 1) {
      msg = textareaVal;
    } else {
      msg = lastMessage;
    }
    
    if (!msg || msg.length < 2) {
      console.log('Context One: No message found in ChatGPT DOM');
      return null;
    }
    
    return msg;
  }
  
  // Poll for input changes - also detect when input is CLEARED (means message was sent)
  function pollForInput() {
    let lastKnownValue = '';
    
    setInterval(() => {
      const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') || 
                        document.querySelector('[contenteditable="true"][role="textbox"]') ||
                        document.querySelector('[contenteditable="true"]');
      if (promptDiv) {
        const currentVal = promptDiv.textContent?.trim();
        
        // If we had a message and now it's empty - message was sent!
        if (lastKnownValue && lastKnownValue.length > 2 && currentVal === '') {
          console.log('Context One: ChatGPT input was cleared - message sent!:', lastKnownValue.substring(0, 50));
          captureMessage(lastKnownValue);
          lastKnownValue = '';
        }
        // If value changed, update last known
        else if (currentVal && currentVal !== lastKnownValue) {
          lastKnownValue = currentVal;
          lastMessage = currentVal;
          console.log('Context One: ChatGPT message updated:', lastMessage.substring(0, 30));
        }
      }
    }, 100);
  }
  
  // Handle message send
  async function handleSend() {
    console.log('Context One: handleSend called for ChatGPT');
    
    const msg = getMessageFromDOM();
    if (msg) {
      await captureMessage(msg);
    }
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
    
    console.log('Context One: Capturing user message for ChatGPT:', userMessage.substring(0, 50));
    
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
    
    // Store context for fetch interception
    if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
      pendingContext = contextResponse.context;
      console.log('Context One: Context stored for API injection');
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
    
    document.body.appendChild(badge);
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