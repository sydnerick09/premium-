// Web stub — RevenueCat is not available on web
class PurchaseServiceWeb {
  async configure(_apiKey?: string) {}
  async getOfferings() { return null; }
  async purchasePackage(_pkg: any): Promise<boolean> {
    alert('In-app purchases are not available in web preview. Use the Android app for real purchases.');
    return false;
  }
  async restorePurchases(): Promise<boolean> { return false; }
  async checkPremiumStatus(): Promise<boolean> { return false; }
  async loginUser(_userId: string) {}
  async logoutUser() {}
}

export const purchaseService = new PurchaseServiceWeb();
