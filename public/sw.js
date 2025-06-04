// Service Worker for background voice message handling
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'VOICE_MESSAGE') {
    const { title, body, audioData } = event.data;
    
    // Show notification
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { audioData },
      actions: [
        { action: 'play', title: 'Play Message' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'play') {
    // Handle audio playback in background
    const audioData = event.notification.data.audioData;
    
    // Open the app or focus existing window
    event.waitUntil(
      clients.matchAll().then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Keep the service worker alive for background audio processing
self.addEventListener('fetch', event => {
  // Handle fetch events to keep service worker active
});
