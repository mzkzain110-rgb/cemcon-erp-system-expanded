import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && !(window as any).__cemconFetchPatched) {
  try {
    const rawFetch = window.fetch;
    if (typeof rawFetch === 'function') {
      const originalFetch = rawFetch.bind(window);
      const wrappedFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const isSameOriginApi =
          urlStr.startsWith('/api') ||
          urlStr.startsWith(`${window.location.origin}/api`);

        if (!isSameOriginApi) {
          return originalFetch(input, init);
        }

        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        );
        try {
          const activeCompanyId = window.localStorage.getItem('cemcon_company_id');
          const activeUserId = window.localStorage.getItem('cemcon_user_id');

          if (activeCompanyId && !headers.has('x-company-id')) {
            headers.set('x-company-id', activeCompanyId);
          }
          if (activeUserId && !headers.has('x-user-id')) {
            headers.set('x-user-id', activeUserId);
          }
        } catch {
          // Ignore storage access errors in restricted contexts; cookies carry session context
        }

        return originalFetch(input, {
          ...init,
          headers,
          cache: init?.cache ?? 'no-store',
        });
      };

      const ownDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
      const protoDesc =
        typeof Window !== 'undefined' && Window.prototype
          ? Object.getOwnPropertyDescriptor(Window.prototype, 'fetch')
          : undefined;
      const targetDesc = ownDesc ?? protoDesc;

      if (!targetDesc || targetDesc.writable) {
        window.fetch = wrappedFetch;
        (window as any).__cemconFetchPatched = true;
      } else if (ownDesc ? ownDesc.configurable : true) {
        Object.defineProperty(window, 'fetch', {
          value: wrappedFetch,
          writable: true,
          configurable: true,
          enumerable: ownDesc?.enumerable ?? true,
        });
        (window as any).__cemconFetchPatched = true;
      }
    }
  } catch (err) {
    console.warn('Fetch interceptor could not be attached:', err);
  }
}

createRoot(document.getElementById('root')!).render(<App />);

