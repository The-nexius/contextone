// Context One - Grok Content Script (MV3)
// Captures messages and injects context via MAIN world script

(function() {
  'use strict';

  const TOOL = 'grok';
  let conversationId = null;
  let lastMessage = '';
  let pendingContext = null;

  // Initialize
  function init() {
    console.log('Context One: Initializing Grok integration (MV3)');

    // Inject MAIN world script
    injectMainScript();

    // Get conversation ID from URL
    updateConversationId();

    // Watch for navigation changes
    observeNavigation();

    // Attach to input
    attachToInput();

    // Add status badge
    addStatusBadge();

    // Listen for context from MAIN world
    window.addEventListener('context-one-context-ready', (e) => {
      console.log('Context One: Context ready for injection');
    });
  }

  // Inject script into MAIN world
  function injectMainScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/grok-inject.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
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
        attachToInput();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Attach to input field
  function attachToInput() {
    const textarea = document.querySelector('textarea') ||
                     document.querySelector('[contenteditable="true"]');

    if (textarea && !textarea.dataset.contextOneAttached) {
      // Track input changes
      textarea.addEventListener('input', () => {
        lastMessage = textarea.value || textarea.textContent || '';
      });

      // Handle Enter key
      textarea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          const msg = lastMessage.trim();
          if (msg.length >= 2) {
            await handleSend(msg);
          }
        }
      });

      textarea.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Grok input');
    }

    // Also attach to send button
    const sendButton = document.querySelector('button[data-testid="send-button"]') ||
                       document.querySelector('button[aria-label="Send"]');

    if (sendButton && !sendButton.dataset.contextOneAttached) {
      sendButton.addEventListener('click', async () => {
        const msg = lastMessage.trim();
        if (msg.length >= 2) {
          await handleSend(msg);
        }
      });
      sendButton.dataset.contextOneAttached = 'true';
    }
  }

  // Handle message send
  async function handleSend(message) {
    console.log('Context One: Capturing message for Grok');

    // Capture user message
    chrome.runtime.sendMessage({
      type: 'CAPTURE_MESSAGE',
      conversationId: conversationId,
      role: 'user',
      content: message,
      tool: TOOL
    });

    // Get context for injection
    const contextResponse = await chrome.runtime.sendMessage({
      type: 'GET_CONTEXT',
      message: message,
      tool: TOOL
    });

    if (contextResponse && contextResponse.context_text) {
      console.log('Context One: Got context, sending to MAIN world');
      pendingContext = contextResponse.context_text;

      // Send to MAIN world via CustomEvent
      window.dispatchEvent(new CustomEvent('context-one-inject', {
        detail: { context: contextResponse.context_text }
      }));
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
