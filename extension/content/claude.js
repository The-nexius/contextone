// Context One - Claude Content Script
// Injects context and captures conversations

(function() {
  'use strict';
  
  console.log('Context One: Claude content script loaded');
  
  const TOOL = 'claude';
  let conversationId = null;
  let isInitialized = false;
  let lastMessage = '';
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing Claude integration');
    
    // Get conversation ID from URL
    updateConversationId();
    
    // Watch for navigation changes
    observeNavigation();
    
    // Attach to send button
    attachToSendButton();
    
    // Add status badge
    addStatusBadge();
    
    // Also poll for input changes
    pollForInput();
    
    // Log current state
    console.log('Context One: init complete. Input elements:', 
      document.querySelectorAll('textarea, [contenteditable]').length);
    
    // Fallback: listen for any click near send area
    document.addEventListener('click', (e) => {
      const target = e.target;
      // Check if clicked near where send button would be
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        console.log('Context One: Button clicked:', target);
      }
    });
    
    isInitialized = true;
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
      'form button'
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
    console.log('Context One: handleSend called, lastMessage:', lastMessage);
    
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
    
    // Inject context into input field BEFORE sending
    if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
      console.log('Context One: Injecting context into message');
      
      const inputDiv = document.querySelector('[contenteditable="true"]');
      if (inputDiv) {
        // Prepend context to the message
        const contextPrefix = `[Context from previous messages: ${contextResponse.context}]\n\n`;
        inputDiv.textContent = contextPrefix + userMessage;
        
        // Update lastMessage so we capture the modified version
        lastMessage = inputDiv.textContent;
        console.log('Context One: Context prepended to input');
      }
    }
    
    // Capture user message (with injected context)
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