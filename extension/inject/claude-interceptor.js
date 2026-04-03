// Context One - Claude MAIN world interceptor
(function() {
  if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
  window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
  console.log('Context One: MAIN world fetch patched for Claude');
  
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] ? { ...args[1] } : {};
    
    if (url.includes('/completion') || url.includes('/append') || url.includes('claude.ai/api')) {
      console.log('🔍 Context One: Claude API:', url);
      
      // Request context from background via chrome.runtime (works from MAIN world)
      let context = null;
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GET_CONTEXT_DIRECT',
          tool: 'claude'
        });
        if (response && response.context) {
          context = response.context;
          console.log('Context One: Got context from background:', context.substring(0, 50));
        }
      } catch(e) {
        console.log('Context One: Direct context fetch error:', e.message);
      }
      
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