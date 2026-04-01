// Context One - Gemini Content Script
// Injects context and captures conversations

(function() {
  'use strict';
  
  const TOOL = 'gemini';
  let conversationId = null;
  let isInitialized = false;
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing Gemini integration');
    
    // Get conversation ID from URL
    updateConversationId();
    
    // Watch for navigation changes
    observeNavigation();
    
    // Attach to send button
    attachToSendButton();
    
    // Add status badge
    addStatusBadge();
    
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
    // Gemini uses various selectors
    const sendButton = document.querySelector('button[aria-label="Send message"]') || 
                       document.querySelector('.send-button') ||
                       document.querySelector('button[aria-label="Submit"]');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      sendButton.addEventListener('click', handleSend);
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Gemini send button');
    }
    
    // Also watch for Enter key in textarea
    const textarea = document.querySelector('textarea') || 
                     document.querySelector('rich-textarea div[contenteditable="true"]');
    if (textarea && !textarea.dataset.contextOneAttached) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          setTimeout(() => handleSend(), 100);
        }
      });
      textarea.dataset.contextOneAttached = 'true';
    }
  }
  
  // Handle message send
  async function handleSend() {
    // Find the input
    const textarea = document.querySelector('textarea') || 
                     document.querySelector('rich-textarea div[contenteditable="true"]');
    const userMessage = textarea?.value?.trim() || textarea?.textContent?.trim();
    
    if (!userMessage || userMessage.length < 2) return;
    
    console.log('Context One: Capturing user message for Gemini');
    
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
    
    if (contextResponse && contextResponse.context) {
      console.log('Context One: Context found, will inject');
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