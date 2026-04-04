// Context One - Grok MAIN World Script
// Intercepts fetch calls and injects context
// This runs in MAIN world (page context) to access fetch

(function() {
  'use strict';

  let pendingContext = null;

  // Listen for context from content script
  window.addEventListener('context-one-inject', (e) => {
    pendingContext = e.detail.context;
    console.log('Context One (MAIN): Context received, will inject on next fetch');
  });

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;

    // Check if this is Grok's API call
    if (url && typeof url === 'string' && (
      url.includes('grok.com/api') ||
      url.includes('x.ai/api') ||
      url.includes('/chat') ||
      url.includes('/conversation')
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
          } else if (body.prompt || body.query) {
            // Handle different API formats
            body.prompt = `Context: ${pendingContext}\n\n${body.prompt || ''}`;
            body.query = `Context: ${pendingContext}\n\n${body.query || ''}`;
          }

          options.body = JSON.stringify(body);
          console.log('Context One (MAIN): Injected context into Grok request');

          // Clear pending context
          pendingContext = null;
        } catch (e) {
          console.error('Context One (MAIN): Error injecting context:', e);
        }
      }
    }

    return originalFetch.apply(this, args);
  };

  // Also intercept XHR for older APIs
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._contextOneUrl = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this._contextOneUrl && pendingContext) {
      if (this._contextOneUrl.includes('grok.com/api') ||
          this._contextOneUrl.includes('x.ai/api')) {
        try {
          const bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
          if (bodyObj.messages) {
            bodyObj.messages.unshift({
              role: 'system',
              content: `Relevant context from previous conversations:\n\n${pendingContext}`
            });
            body = JSON.stringify(bodyObj);
            console.log('Context One (MAIN): Injected context via XHR');
            pendingContext = null;
          }
        } catch (e) {
          console.error('Context One (MAIN): XHR injection error:', e);
        }
      }
    }
    return originalXHRSend.apply(this, [body]);
  };

  console.log('Context One (MAIN): Grok interceptor loaded');
})();
