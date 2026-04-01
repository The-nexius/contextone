// Context One - Claude Content Script
// Injects context and captures conversations

(function() {
  'use strict';
  
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
  
  // Poll for input changes
  function pollForInput() {
    setInterval(() => {
      const textarea = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
      if (textarea) {
        const currentVal = textarea.value || textarea.innerText;
        if (currentVal && currentVal !== lastMessage) {
          lastMessage = currentVal;
        }
      }
    }, 1000);
  }
  
  // Handle message send
  async function handleSend() {
    // Find the input - try multiple methods
    let userMessage = '';
    
    // Try contenteditable first (Claude's main input)
    const inputDiv = document.querySelector('[contenteditable="true"]');
    if (inputDiv) {
      userMessage = inputDiv.textContent?.trim() || '';
    }
    
    // Try textarea
    if (!userMessage) {
      const textarea = document.querySelector('textarea');
      userMessage = textarea?.value?.trim() || '';
    }
    
    // Use lastMessage from polling as fallback
    if (!userMessage && lastMessage) {
      userMessage = lastMessage.trim();
    }
    
    if (!userMessage || userMessage.length < 2) {
      console.log('Context One: No message found to capture');
      return;
    }
    
    console.log('Context One: Capturing user message for Claude:', userMessage.substring(0, 50));
    
    // Capture user message
    chrome.runtime.sendMessage({
      type: 'CAPTURE_MESSAGE',
      conversationId: conversationId,
      role: 'user',
      content: userMessage,
      tool: TOOL
    });
    
    // Get context for injection
    const contextResponse = await chrome.runtime.sendMessage({
      type: 'GET_CONTEXT',
      message: userMessage,
      projectId: null,
      tool: TOOL
    });
    
    console.log('Context One: Got context response:', contextResponse);
    
    if (contextResponse && contextResponse.context) {
      console.log('Context One: Context found, will inject');
      // Store for service worker to pick up
      chrome.storage.session.set({
        pendingContext: contextResponse.context,
        pendingTool: TOOL
      });
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