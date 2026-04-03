// Context One - Gemini MAIN world interceptor
(function() {
  if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
  window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
  console.log('Context One: MAIN world fetch patched for Gemini');
  
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] || {};
    
    if (url.includes('generativelanguage.googleapis.com') || url.includes('gemini.google.com')) {
      console.log('🔍 Context One: Gemini API:', url);
      
      const contextEl = document.getElementById('__context_one_data__');
      if (contextEl && contextEl.textContent && options.body) {
        try {
          const body = JSON.parse(options.body);
          if (body.contents && Array.isArray(body.contents)) {
            body.contents.unshift({ role: 'user', parts: [{ text: '[Context]: ' + contextEl.textContent }] });
            options.body = JSON.stringify(body);
            console.log('✅ Context One: Injected context');
          }
        } catch(e) { console.log('❌ Context One:', e.message); }
      }
    }
    return originalFetch.apply(this, args);
  };
})();