'use client';

import { useEffect } from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, ...data } = event.data;
            
            switch (type) {
              case 'ORDER_SYNCED':
                console.log('Order synced:', data);
                break;
              case 'SYNC_COMPLETE':
                console.log('All orders synced');
                break;
              case 'GET_AUTH_TOKEN':
                const token = localStorage.getItem('token');
                event.ports[0].postMessage({ token });
                break;
            }
          });

          if ('periodicSync' in registration) {
            registration.periodicSync.register('sync-inventory', {
              minInterval: 24 * 60 * 60 * 1000
            });
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}