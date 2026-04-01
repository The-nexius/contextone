// Context One - ChatGPT Content Script
// Injects context and captures conversations

(function() {
  'use strict';
  
  console.log('Context One: ChatGPT content script loaded');
  
  const TOOL = 'chatgpt';
  let conversationId = null;
  let isInitialized = false;
  let lastMessage = '';
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing ChatGPT integration');
    
    // Get conversation ID from URL
    updateConversationId();
    
    // Watch for navigation changes
    observeNavigation();
    
    // Attach to send button
    attachToSendButton();
    
    // Add status badge
    addStatusBadge();
    
    // Poll for input changes
    pollForInput();
    
    isInitialized = true;
  }
  
  // Poll for input changes
  function pollForInput() {
    setInterval(() => {
      const textarea = document.querySelector('textarea[id="prompt-textarea"]');
      if (textarea) {
        const currentVal = textarea.value?.trim();
        if (currentVal && currentVal !== lastMessage) {
          lastMessage = currentVal;
        }
      }
    }, 200);
  }
  
  // Update conversation ID from URL
  function updateConversationId() {
    const match = window.location.href.match(/\/c\/([a-zA-Z0-9-]+)/);
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
    const sendButton = document.querySelector('button[data-testid="send-button"]');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      sendButton.addEventListener('click', handleSend);
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to ChatGPT send button');
    }
    
    // Also watch for Enter key in textarea
    const textarea = document.querySelector('textarea[id="prompt-textarea"]');
    if (textarea && !textarea.dataset.contextOneAttached) {
      // Capture on input event immediately
      textarea.addEventListener('input', () => {
        if (textarea.value && textarea.value.trim()) {
          lastMessage = textarea.value.trim();
        }
      });
      
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          setTimeout(() => handleSend(), 0);
        }
      });
      textarea.dataset.contextOneAttached = 'true';
    }
  }
  
  // Handle message send
  async function handleSend() {
    // Get message directly from DOM (most reliable)
    const textarea = document.querySelector('textarea[id="prompt-textarea"]');
    let userMessage = textarea?.value?.trim() || lastMessage;
    
    if (!userMessage || userMessage.length < 2) {
      console.log('Context One: No message found to capture');
      return;
    }
    
    await captureMessage(userMessage);
  }
  
  async function captureMessage(userMessage) {
    console.log('Context One: Capturing user message for ChatGPT:', userMessage.substring(0, 50));
    
    try {
      // Get context for injection FIRST
      const contextResponse = await chrome.runtime.sendMessage({
        type: 'GET_CONTEXT',
        message: userMessage,
        projectId: null,
        tool: TOOL
      });
      
      // Inject context into input field BEFORE sending
      if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
        console.log('Context One: Injecting context into message');
        
        const textarea = document.querySelector('textarea[id="prompt-textarea"]');
        if (textarea) {
          const contextPrefix = `\n[Context from previous messages: ${contextResponse.context}]\n\n`;
          textarea.value = contextPrefix + userMessage;
          lastMessage = textarea.value;
        }
      }
      
      // Capture user message
      chrome.runtime.sendMessage({
        type: 'CAPTURE_MESSAGE',
        conversationId: conversationId,
        role: 'user',
        content: userMessage,
        tool: TOOL
      });
      
      if (contextResponse && contextResponse.context) {
        console.log('Context One: Context found, will inject');
        // Store for service worker to pick up
        try {
          chrome.storage.session.set({
            pendingContext: contextResponse.context,
            pendingTool: TOOL
          });
        } catch (e) {}
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