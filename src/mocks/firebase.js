// Firebase mock for web
const app = {
  initializeApp: () => {},
  getApps: () => [],
};

const messaging = () => ({
  getToken: async () => 'mock-token',
  onMessage: () => () => {},
  onNotificationOpenedApp: () => () => {},
  getInitialNotification: async () => null,
  requestPermission: async () => 1,
  hasPermission: async () => true,
  subscribeToTopic: async () => {},
  unsubscribeFromTopic: async () => {},
});

export default app;
export { messaging };
