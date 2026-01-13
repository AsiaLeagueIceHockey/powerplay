self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Power Play';
    const options = {
      body: data.body || 'New notification',
      icon: '/icon-192.png', // Ensure this exists or use favicon
      badge: '/badge.png',   // Optional
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
