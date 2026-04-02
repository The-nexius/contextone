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
      
      // Check if this is a Claude API call
      if (url.includes('claude.ai/api') || url.includes('anthropic.com')) {
        console.log('Context One: Intercepted Claude API call');
        
        // Context injection disabled - causes UI to show system prompt
        // To re-enable, inject context here but it will show in Claude's UI
        if (pendingContext) {
          console.log('Context One: Context available but injection disabled (shows in UI)');
          // Don't inject - keeps context hidden
          pendingContext = null;
        }
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('Context One: Fetch interception set up');
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
        sendButton.addEventListener('click', handleSend);
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
    console.log("Context One: handleSend called, lastMessage:", lastMessage), lastMessage:', lastMessage);
    
    // Get message directly from DOM (most reliable)
    const inputDiv = document.querySelector('[contenteditable="true"]');
    let userMessage = inputDiv?.textContent?.trim() || lastMessage;
    
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