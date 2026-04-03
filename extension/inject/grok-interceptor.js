// Context One - Grok MAIN world interceptor
// NOTE: MAIN world cannot access chrome.* APIs - must use window events
(function() {
  if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
  window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
  console.log('Context One: MAIN world fetch patched for Grok');

  // ============================================
  // HELPER: Parse body to string
  // ============================================
  async function getBodyAsString(body) {
    if (!body) return null;
    
    if (typeof body === 'string') {
      return body;
    }
    
    if (body instanceof ArrayBuffer || body instanceof Blob) {
      const text = await new Response(body).text();
      return text;
    }
    
    if (body instanceof Request) {
      const text = await body.clone().text();
      return text;
    }
    
    if (body instanceof ReadableStream) {
      console.log('⚠️ Context One: Body is ReadableStream, cannot modify');
      return null;
    }
    
    try {
      return JSON.stringify(body);
    } catch (e) {
      console.log('⚠️ Context One: Cannot stringify body:', e.message);
      return null;
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] ? { ...args[1] } : {};

    // More precise URL filter
    const isGrokAPI = /grok\.com\/rest\/app-chat/.test(url);
    
    if (isGrokAPI) {
      console.log('🔍 Context One: Grok API:', url);
      console.log('  Body type:', typeof options.body, options.body?.constructor?.name || '');

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
          const bodyStr = await getBodyAsString(options.body);
          
          if (!bodyStr) {
            console.log('⚠️ Context One: Could not read body as string');
            return originalFetch.apply(this, args);
          }
          
          console.log('  Body preview:', bodyStr.substring(0, 200));
          
          const body = JSON.parse(bodyStr);
          if (body.messages && Array.isArray(body.messages)) {
            body.messages.unshift({
              role: 'user',
              content: 'Context from my other AI conversations: ' + context
            });
            options.body = JSON.stringify(body);
            console.log('✅ Context One: Injected successfully');
            console.log('  Modified body:', options.body.substring(0, 200));
          }
        } catch(e) {
          console.log('❌ Inject error:', e.message);
        }
      }
    }

    return originalFetch.apply(this, [args[0], options]);
  };
})();