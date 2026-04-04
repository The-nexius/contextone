// Context One - Gemini Content Script (MV3)
// Captures messages and injects context via MAIN world script

(function() {
  'use strict';

  const TOOL = 'gemini';
  let lastMessage = '';

  // Initialize
  function init() {
    console.log('Context One: Initializing Gemini integration (MV3)');

    // Inject MAIN world script
    injectMainScript();

    // Attach to input
    attachToInput();

    // Add status badge
    addStatusBadge();
  }

  // Inject script into MAIN world
  function injectMainScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/gemini-inject.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  // Attach to input field
  function attachToInput() {
    // Gemini uses a rich text editor
    const editor = document.querySelector('div.ql-editor[contenteditable="true"]') ||
                   document.querySelector('[data-testid="composer-text-input"]') ||
                   document.querySelector('textarea');

    if (editor && !editor.dataset.contextOneAttached) {
      // Track input changes
      editor.addEventListener('input', () => {
        lastMessage = editor.value || editor.textContent || '';
      });

      // Handle Enter key
      editor.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          const msg = lastMessage.trim();
          if (msg.length >= 2) {
            await handleSend(msg);
          }
        }
      });

      editor.dataset.contextOneAttached = 'true';
      console.log('Context One: Attached to Gemini input');
    }

    // Also attach to send button
    const sendButton = document.querySelector('button[aria-label="Send"]') ||
                       document.querySelector('[data-testid="send-button"]');

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
    console.log('Context One: Capturing message for Gemini');

    // Capture user message
    chrome.runtime.sendMessage({
      type: 'CAPTURE_MESSAGE',
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

  // Re-attach on navigation (SPA)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(attachToInput, 500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
