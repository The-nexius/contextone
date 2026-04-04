// Context One - Gemini MAIN World Script
// Intercepts fetch calls and injects context

(function() {
  'use strict';

  let pendingContext = null;

  // Listen for context from content script
  window.addEventListener('context-one-inject', (e) => {
    pendingContext = e.detail.context;
    console.log('Context One (MAIN): Context received for Gemini');
  });

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;

    // Check if this is Gemini's API call
    if (url && typeof url === 'string' && (
      url.includes('gemini.google.com') ||
      url.includes('generativelanguage.googleapis.com') ||
      url.includes('/v1beta/') ||
      url.includes('/generateContent')
    )) {
      if (pendingContext && options && options.body) {
        try {
          const body = typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body;

          // Inject context as system instruction
          if (body.systemInstruction) {
            body.systemInstruction.parts.unshift({
              text: `Relevant context from previous conversations:\n\n${pendingContext}`
            });
          } else {
            body.systemInstruction = {
              parts: [{
                text: `Relevant context from previous conversations:\n\n${pendingContext}`
              }]
            };
          }

          options.body = JSON.stringify(body);
          console.log('Context One (MAIN): Injected context into Gemini request');
          pendingContext = null;
        } catch (e) {
          console.error('Context One (MAIN): Error injecting context:', e);
        }
      }
    }

    return originalFetch.apply(this, args);
  };

  console.log('Context One (MAIN): Gemini interceptor loaded');
})();
