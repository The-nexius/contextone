// Context One - ChatGPT MAIN World Script
// Intercepts fetch calls and injects context

(function() {
  'use strict';

  let pendingContext = null;

  // Listen for context from content script
  window.addEventListener('context-one-inject', (e) => {
    pendingContext = e.detail.context;
    console.log('Context One (MAIN): Context received for ChatGPT');
  });

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;

    // Check if this is ChatGPT's API call
    if (url && typeof url === 'string' && (
      url.includes('chat.openai.com') ||
      url.includes('chatgpt.com') ||
      url.includes('/backend-api/conversation') ||
      url.includes('/api/conversation')
    )) {
      if (pendingContext && options && options.body) {
        try {
          const body = typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body;

          // Inject context as system message
          if (body.messages) {
            body.messages.unshift({
              role: 'system',
              content: `Relevant context from previous conversations:\n\n${pendingContext}`
            });
          }

          options.body = JSON.stringify(body);
          console.log('Context One (MAIN): Injected context into ChatGPT request');
          pendingContext = null;
        } catch (e) {
          console.error('Context One (MAIN): Error injecting context:', e);
        }
      }
    }

    return originalFetch.apply(this, args);
  };

  console.log('Context One (MAIN): ChatGPT interceptor loaded');
})();
