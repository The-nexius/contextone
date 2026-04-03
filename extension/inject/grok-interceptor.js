// Context One - Grok MAIN world interceptor
// NOTE: MAIN world cannot access chrome.* APIs - must use window events
(function() {
  if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
  window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
  console.log('Context One: MAIN world fetch patched for Grok');

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] ? { ...args[1] } : {};

    if (url.includes('grok.com') || url.includes('x.com/i/grok') || url.includes('api.x.ai')) {
      console.log('🔍 Context One: Grok API:', url);

      // Ask isolated world for context via window events
      const context = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏱️ Context One: Timeout waiting for context');
          resolve(null);
        }, 800);

        window.addEventListener('CONTEXT_ONE_RESPONSE', (e) => {
          clearTimeout(timeout);
          console.log('📨 Context One: Got context from isolated world');
          resolve(e.detail?.context || null);
        }, { once: true });

        window.dispatchEvent(new CustomEvent('CONTEXT_ONE_REQUEST', {
          detail: { url }
        }));
      });

      if (context && options.body) {
        try {
          const body = JSON.parse(options.body);
          if (body.messages && Array.isArray(body.messages)) {
            body.messages.unshift({
              role: 'user',
              content: 'Context from my other AI conversations: ' + context
            });
            options.body = JSON.stringify(body);
            console.log('✅ Context One: Injected successfully');
          }
        } catch(e) {
          console.log('❌ Inject error:', e.message);
        }
      }
    }

    return originalFetch.apply(this, [args[0], options]);
  };
})();