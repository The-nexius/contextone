// Context One - Perplexity MAIN world interceptor
(function() {
  if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
  window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
  console.log('Context One: MAIN world fetch patched for Perplexity');
  
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] ? { ...args[1] } : {};
    
    if (url.includes('perplexity.ai') || url.includes('/search') || url.includes('/ask')) {
      console.log('🔍 Context One: Perplexity API:', url);
      
      const context = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 500);
        
        window.addEventListener('CONTEXT_ONE_RESPONSE', (e) => {
          clearTimeout(timeout);
          resolve(e.detail.context);
        }, { once: true });
        
        window.dispatchEvent(new CustomEvent('CONTEXT_ONE_REQUEST', {
          detail: { url, tool: 'perplexity' }
        }));
      });
      
      if (context && options.body) {
        try {
          const body = JSON.parse(options.body);
          if (body.messages && Array.isArray(body.messages)) {
            body.messages.unshift({ role: 'user', content: '[Context from other AI conversations]: ' + context });
            options.body = JSON.stringify(body);
            console.log('✅ Context One: Injected context');
          }
        } catch(e) { console.log('❌ Context One:', e.message); }
      }
    }
    return originalFetch.apply(this, [args[0], options]);
  };
})();