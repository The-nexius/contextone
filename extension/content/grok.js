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
    console.log('Context One: attachToSendButton called for Grok');
    
    // Grok uses various selectors - try many options
    const sendButton = 
      document.querySelector('button[data-testid="send-button"]') || 
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('button[aria-label="Submit"]') ||
      document.querySelector('.send-btn') ||
      document.querySelector('[role="button"][aria-label*="Send"]') ||
      // Try finding button with SVG icon (arrow)
      document.querySelector('main button svg')?.closest('button') ||
      // Try all buttons in main
      document.querySelector('main button') ||
      // Try finding button near textarea
      document.querySelector('textarea')?.closest('div')?.querySelector('button');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      // Use mousedown to capture BEFORE click sends
      sendButton.addEventListener('mousedown', () => {
        captureBeforeSend();
      });
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Grok send button', sendButton);
    } else if (!sendButton) {
      console.log('Context One: Grok send button not found, will retry...');
    }
    
    // Also watch for Enter key in textarea - capture BEFORE send
    const textarea = document.querySelector('textarea') || 
                     document.querySelector('[contenteditable="true"]');
    if (textarea && !textarea.dataset.contextOneAttached) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          console.log('Context One: Enter key detected in Grok');
          captureBeforeSend();
        }
      });
      textarea.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Grok textarea Enter key');
    }
    
    // Also watch for contenteditable div
    const inputDiv = document.querySelector('[contenteditable="true"]');
    if (inputDiv && !inputDiv.dataset.contextOneAttached) {
      inputDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          console.log('Context One: Enter key detected in Grok contenteditable');
          captureBeforeSend();
        }
      });
      inputDiv.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Grok contenteditable Enter key');
    }
    
    // Log what we found
    console.log('Context One: Grok elements found:', {
      sendButton: !!sendButton,
      textarea: !!textarea,
      inputDiv: !!inputDiv
    });
  }
  
  // Capture message BEFORE it's sent
  function captureBeforeSend() {
    const textarea = document.querySelector('textarea');
    const inputDiv = document.querySelector('[contenteditable="true"]');
    
    let userMessage = textarea?.value?.trim() || 
                      inputDiv?.textContent?.trim() || 
                      lastMessage;
    
    console.log('Context One: captureBeforeSend - message:', userMessage?.substring(0, 50));
    
    if (userMessage && userMessage.length >= 2) {
      captureMessage(userMessage);
    } else {
      console.log('Context One: No message found to capture before send');
    }
  }
  
  // Handle message send
  async function handleSend() {
    console.log('Context One: handleSend triggered for Grok');
    
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
  
  // Always show badge (fallback with retries)
  setTimeout(addStatusBadge, 2000);
  setTimeout(addStatusBadge, 4000);
  setTimeout(addStatusBadge, 6000);
})();