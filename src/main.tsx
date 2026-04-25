import {StrictMode} from 'react';
import ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill for findDOMNode as it was removed in React 19 but is still used by react-quill
if (!(ReactDOM as any).findDOMNode) {
  (ReactDOM as any).findDOMNode = (container: any) => {
    if (container instanceof Element) {
      return container;
    }
    return null;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
