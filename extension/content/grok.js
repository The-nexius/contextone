// Context One - Grok Content Script
// Injects context and captures conversations

(function() {
  'use strict';
  
  console.log('Context One: Grok content script loaded');
  
  const TOOL = 'grok';
  let conversationId = null;
  let isInitialized = false;
  let lastMessage = '';
  
  // Initialize
  function init() {
    if (isInitialized) return;
    
    console.log('Context One: Initializing Grok integration');
    
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
      const inputDiv = document.querySelector('[contenteditable="true"]');
      if (inputDiv) {
        const currentVal = inputDiv.textContent?.trim();
        if (currentVal && currentVal !== lastMessage) {
          lastMessage = currentVal;
        }
      }
      const textarea = document.querySelector('textarea');
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
    // Grok uses various selectors
    const sendButton = document.querySelector('button[data-testid="send-button"]') || 
                       document.querySelector('button[aria-label="Send"]') ||
                       document.querySelector('.send-btn') ||
                       document.querySelector('[role="button"][aria-label*="Send"]');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      sendButton.addEventListener('click', handleSend);
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Grok send button');
    }
    
    // Also watch for Enter key in textarea
    const textarea = document.querySelector('textarea') || 
                     document.querySelector('[contenteditable="true"]');
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
    // Get message directly from DOM (most reliable)
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
    console.log('Context One: Capturing user message for Grok:', userMessage.substring(0, 50));
    
    // Get context for injection FIRST
    const contextResponse = await safeSendMessage({
      type: 'GET_CONTEXT',
      message: userMessage,
      projectId: null,
      tool: TOOL
    });
    
    // Inject context into input field BEFORE sending
    if (contextResponse && contextResponse.context && contextResponse.context_items_injected > 0) {
      console.log('Context One: Injecting context into message');
      
      const inputDiv = document.querySelector('[contenteditable="true"]');
      if (inputDiv) {
        const contextPrefix = `[Context from previous messages: ${contextResponse.context}]\n\n`;
        inputDiv.textContent = contextPrefix + userMessage;
        lastMessage = inputDiv.textContent;
        console.log('Context One: Context prepended to input');
      }
    }
    
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
  
  // Always show badge (fallback)
  setTimeout(addStatusBadge, 2000);
})();