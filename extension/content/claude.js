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
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            setTimeout(() => handleSend(), 100);
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
        }
      }
      
      // Also try textarea
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const currentVal = textarea.value?.trim();
        if (currentVal && currentVal !== lastMessage) {
          lastMessage = currentVal;
        }
      }
    }, 200);
  }
  
  // Handle message send
  async function handleSend() {
    console.log('Context One: handleSend called, lastMessage:', lastMessage);
    
    // Capture message BEFORE it gets cleared - use lastMessage from polling
    const userMessage = lastMessage;
    
    if (!userMessage || userMessage.length < 2) {
      console.log('Context One: No message found to capture, lastMessage:', lastMessage);
      // Try to get message directly from DOM
      const inputDiv = document.querySelector('[contenteditable="true"]');
      const directMessage = inputDiv?.textContent?.trim();
      console.log('Context One: Direct from DOM:', directMessage);
      if (directMessage && directMessage.length >= 2) {
        console.log('Context One: Using direct DOM message');
        await captureMessage(directMessage);
        return;
      }
      return;
    }
    
    await captureMessage(userMessage);
  }
  
  async function captureMessage(userMessage) {
    console.log('Context One: Capturing user message for Claude:', userMessage.substring(0, 50));
    
    try {
      // Get context for injection FIRST
      const contextResponse = await chrome.runtime.sendMessage({
        type: 'GET_CONTEXT',
        message: userMessage,
        projectId: null,
        tool: TOOL
      });
      
      console.log('Context One: Got context response:', contextResponse);
      
      // Inject context into input field BEFORE sending
      if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
        console.log('Context One: Injecting context into message');
        
        const inputDiv = document.querySelector('[contenteditable="true"]');
        if (inputDiv) {
          // Prepend context to the message
          const contextPrefix = `\n[Context from previous messages: ${contextResponse.context}]\n\n`;
          inputDiv.textContent = contextPrefix + userMessage;
          
          // Update lastMessage so we capture the modified version
          lastMessage = inputDiv.textContent;
        }
      }
      
      // Capture user message (with injected context)
      chrome.runtime.sendMessage({
        type: 'CAPTURE_MESSAGE',
        conversationId: conversationId,
        role: 'user',
        content: userMessage,
        tool: TOOL
      });
      
      // Store for service worker to pick up
      try {
        chrome.storage.session.set({
          pendingContext: contextResponse.context,
          pendingTool: TOOL
        });
      } catch (e) {
        console.log('Context One: Storage error (ignorable):', e.message);
      }
    } catch (err) {
      console.log('Context One: Error (extension may have reloaded):', err.message);
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
})();