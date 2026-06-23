import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { AppConstants } from '../../constants/AppConstants';

const ENTITLEMENT_ID = 'premium';

class PurchaseService {
  async configure(): Promise<void> {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    const apiKey =
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '';
    await Purchases.configure({ apiKey });
  }

  async getOfferings(): Promise<PurchasesPackage[]> {
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) return [];
      return offerings.current.availablePackages;
    } catch (e) {
      console.warn('Failed to fetch offerings:', e);
      return [];
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this._hasActivePremium(customerInfo);
    } catch (e: any) {
      if (e.userCancelled) return false;
      throw new Error('Purchase failed. Please try again.');
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return this._hasActivePremium(customerInfo);
    } catch {
      throw new Error('Failed to restore purchases.');
    }
  }

  async checkPremiumStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this._hasActivePremium(customerInfo);
    } catch {
      return false;
    }
  }

  async loginUser(userId: string): Promise<void> {
    await Purchases.logIn(userId).catch(() => {});
  }

  async logoutUser(): Promise<void> {
    await Purchases.logOut().catch(() => {});
  }

  private _hasActivePremium(customerInfo: CustomerInfo): boolean {
    return (
      customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
    );
  }
}

export const purchaseService = new PurchaseService();
