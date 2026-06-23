// Stub for react-native-purchases (RevenueCat) on web
const Purchases = {
  configure: () => {},
  getOfferings: async () => ({ current: null }),
  purchasePackage: async () => { throw new Error('Purchases not available on web'); },
  restorePurchases: async () => ({ activeSubscriptions: [] }),
  getCustomerInfo: async () => ({ entitlements: { active: {} } }),
  logIn: async () => {},
  logOut: async () => {},
  setDebugLogsEnabled: () => {},
};

module.exports = { default: Purchases, ...Purchases };
