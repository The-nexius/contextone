// Context One - Claude MAIN World Script
// Intercepts fetch calls and injects context

(function() {
  'use strict';

  let pendingContext = null;

  // Listen for context from content script
  window.addEventListener('context-one-inject', (e) => {
    pendingContext = e.detail.context;
    console.log('Context One (MAIN): Context received for Claude');
  });

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;

    // Check if this is Claude's API call
    if (url && typeof url === 'string' && (
      url.includes('claude.ai') ||
      url.includes('anthropic.com') ||
      url.includes('/api/append_message') ||
      url.includes('/api/complete')
    )) {
      if (pendingContext && options && options.body) {
        try {
          const body = typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body;

          // Inject context into system prompt
          if (body.system) {
            body.system += `\n\nRelevant context from previous conversations:\n${pendingContext}`;
          } else {
            body.system = `Relevant context from previous conversations:\n\n${pendingContext}`;
          }

          options.body = JSON.stringify(body);
          console.log('Context One (MAIN): Injected context into Claude request');
          pendingContext = null;
        } catch (e) {
          console.error('Context One (MAIN): Error injecting context:', e);
        }
      }
    }

    return originalFetch.apply(this, args);
  };

  console.log('Context One (MAIN): Claude interceptor loaded');
})();
