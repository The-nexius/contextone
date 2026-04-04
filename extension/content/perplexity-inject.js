// Context One - Perplexity MAIN World Script
// Intercepts fetch calls and injects context

(function() {
  'use strict';

  let pendingContext = null;

  // Listen for context from content script
  window.addEventListener('context-one-inject', (e) => {
    pendingContext = e.detail.context;
    console.log('Context One (MAIN): Context received for Perplexity');
  });

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;

    // Check if this is Perplexity's API call
    if (url && typeof url === 'string' && (
      url.includes('perplexity.ai') ||
      url.includes('/api/ask') ||
      url.includes('/api/query')
    )) {
      if (pendingContext && options && options.body) {
        try {
          const body = typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body;

          // Inject context into query or messages
          if (body.query) {
            body.query = `Context: ${pendingContext}\n\n${body.query}`;
          } else if (body.messages) {
            body.messages.unshift({
              role: 'system',
              content: `Relevant context from previous conversations:\n\n${pendingContext}`
            });
          } else if (body.prompt) {
            body.prompt = `Context: ${pendingContext}\n\n${body.prompt}`;
          }

          options.body = JSON.stringify(body);
          console.log('Context One (MAIN): Injected context into Perplexity request');
          pendingContext = null;
        } catch (e) {
          console.error('Context One (MAIN): Error injecting context:', e);
        }
      }
    }

    return originalFetch.apply(this, args);
  };

  console.log('Context One (MAIN): Perplexity interceptor loaded');
})();
