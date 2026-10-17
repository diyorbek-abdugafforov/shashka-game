import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TelegramProvider } from './providers/TelegramProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { QueryProvider } from './providers/QueryProvider';
import { SocketProvider } from './providers/SocketProvider';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TelegramProvider>
      <ThemeProvider>
        <QueryProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </QueryProvider>
      </ThemeProvider>
    </TelegramProvider>
  </React.StrictMode>,
);
