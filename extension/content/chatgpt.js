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
  
  // Poll for input changes (ChatGPT uses contenteditable div, not textarea)
  function pollForInput() {
    setInterval(() => {
      // Primary: ProseMirror contenteditable div
      const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') || 
                        document.querySelector('#prompt-textarea') ||
                        document.querySelector('[contenteditable="true"][role="textbox"]');
      if (promptDiv) {
        const currentVal = promptDiv.textContent?.trim() || promptDiv.innerText?.trim();
        if (currentVal && currentVal !== lastMessage) {
          lastMessage = currentVal;
          console.log('Context One: Polled message:', currentVal.substring(0, 30));
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
    console.log('Context One: attachToSendButton called for ChatGPT');
    
    // Multiple selectors for send button
    const sendButton = document.querySelector('button[data-testid="send-button"]') ||
                       document.querySelector('button[aria-label="Send"]') ||
                       document.querySelector('form.stretch button[type="submit"]');
    
    if (sendButton && !sendButton.dataset.contextOneAttached) {
      // Use capture phase to get message before React clears it
      sendButton.addEventListener('click', () => {
        const msg = getMessageFromDOM();
        if (msg) {
          console.log('Context One: Captured message from click:', msg.substring(0, 50));
          captureMessage(msg);
        }
      }, true); // capture phase
      sendButton.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to ChatGPT send button (capture phase)');
    }
    
    // ChatGPT uses contenteditable div (ProseMirror), not textarea
    const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') ||
                      document.querySelector('#prompt-textarea') ||
                      document.querySelector('[contenteditable="true"][role="textbox"]');
    
    if (promptDiv && !promptDiv.dataset.contextOneAttached) {
      // Capture on input event immediately
      promptDiv.addEventListener('input', () => {
        const text = promptDiv.textContent?.trim() || promptDiv.innerText?.trim();
        if (text) {
          lastMessage = text;
        }
      });
      
      // Capture phase for Enter key
      promptDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const msg = getMessageFromDOM();
          if (msg) {
            console.log('Context One: Captured message from Enter:', msg.substring(0, 50));
            captureMessage(msg);
          }
        }
      }, true); // capture phase
      promptDiv.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to ChatGPT prompt div (capture phase)');
    }
  }
  
  // Get message from DOM (ChatGPT uses ProseMirror contenteditable div)
  function getMessageFromDOM() {
    // Primary: ProseMirror contenteditable div
    const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') ||
                      document.querySelector('#prompt-textarea') ||
                      document.querySelector('[contenteditable="true"][role="textbox"]');
    
    const promptText = promptDiv?.textContent?.trim() || promptDiv?.innerText?.trim() || '';
    
    // Use polled lastMessage as fallback
    let msg = promptText || lastMessage;
    
    if (!msg || msg.length < 2) {
      console.log('Context One: No message found in DOM');
      return null;
    }
    return msg;
  }
  
  // Handle message send
  async function handleSend() {
    // Get message directly from DOM (ChatGPT uses ProseMirror)
    const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') ||
                      document.querySelector('#prompt-textarea') ||
                      document.querySelector('[contenteditable="true"][role="textbox"]');
    let userMessage = promptDiv?.textContent?.trim() || promptDiv?.innerText?.trim() || lastMessage;
    
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
    console.log('Context One: Capturing user message for ChatGPT:', userMessage.substring(0, 50));
    
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
      
      // ChatGPT uses ProseMirror contenteditable div
      const promptDiv = document.querySelector('#prompt-textarea.ProseMirror') ||
                        document.querySelector('#prompt-textarea') ||
                        document.querySelector('[contenteditable="true"][role="textbox"]');
      if (promptDiv) {
        const contextPrefix = `[Context from previous messages: ${contextResponse.context}]\n\n`;
        // For contenteditable, we need to set textContent or innerText
        promptDiv.textContent = contextPrefix + userMessage;
        lastMessage = promptDiv.textContent;
        console.log('Context One: Context prepended to prompt div');
      }
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
      console.log('Context One: Context found, will inject');
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