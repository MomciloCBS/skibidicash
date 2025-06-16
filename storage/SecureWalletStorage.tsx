import AsyncStorage from "@react-native-async-storage/async-storage";
import { BitcoinAccount } from "../types/account/BitcoinAccount";

export class AccountStorage {
  private static readonly ACCOUNTS_KEY = 'skibidi_accounts';
  private static readonly ACTIVE_ACCOUNT_KEY = 'skibidi_active_account';
  private static readonly ONBOARDED_KEY = 'skibidi_onboarded';

  static async saveAccounts(accounts: BitcoinAccount[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Failed to save accounts:', error);
      throw error;
    }
  }

  static async loadAccounts(): Promise<BitcoinAccount[]> {
    try {
      const accountsJson = await AsyncStorage.getItem(this.ACCOUNTS_KEY);
      if (accountsJson) {
        return JSON.parse(accountsJson);
      }
      return [];
    } catch (error) {
      console.error('Failed to load accounts:', error);
      return [];
    }
  }

  static async saveActiveAccount(accountId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACTIVE_ACCOUNT_KEY, accountId);
    } catch (error) {
      console.error('Failed to save active account:', error);
      throw error;
    }
  }

  static async loadActiveAccount(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.ACTIVE_ACCOUNT_KEY);
    } catch (error) {
      console.error('Failed to load active account:', error);
      return null;
    }
  }

  static async setOnboarded(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ONBOARDED_KEY, 'true');
    } catch (error) {
      console.error('Failed to set onboarded flag:', error);
    }
  }

  static async isOnboarded(): Promise<boolean> {
    try {
      const onboarded = await AsyncStorage.getItem(this.ONBOARDED_KEY);
      return onboarded === 'true';
    } catch (error) {
      console.error('Failed to check onboarded status:', error);
      return false;
    }
  }
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        '@skibidi_accounts',
        '@skibidi_active_account',
        '@skibidi_onboarded',
        '@breez_mnemonic', // This might be handled by BreezSDKService
      ]);
      console.log('🗑️ All wallet data cleared');
    } catch (error) {
      console.error('Failed to clear wallet data:', error);
      throw new Error('Failed to clear wallet data');
    }
  }

  /**
   * Check if any wallet data exists
   */
  static async hasWalletData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const walletKeys = keys.filter(key => 
        key.startsWith('@skibidi_') || key.startsWith('@breez_')
      );
      return walletKeys.length > 0;
    } catch (error) {
      console.error('Failed to check wallet data:', error);
      return false;
    }
  }

  /**
   * Get all wallet-related storage keys (for debugging)
   */
  static async getWalletKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => 
        key.startsWith('@skibidi_') || key.startsWith('@breez_')
      );
    } catch (error) {
      console.error('Failed to get wallet keys:', error);
      return [];
    }
  }

  /**
   * Export all wallet data (for backup purposes)
   */
  static async exportWalletData(): Promise<any> {
    try {
      const accounts = await this.loadAccounts();
      const activeAccount = await this.loadActiveAccount();
      const isOnboarded = await this.isOnboarded();
      
      return {
        accounts,
        activeAccount,
        isOnboarded,
        exportedAt: Date.now(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Failed to export wallet data:', error);
      throw new Error('Failed to export wallet data');
    }
  }

  /**
   * Import wallet data (excluding mnemonic, for account restoration)
   */
  static async importWalletData(data: any): Promise<void> {
    try {
      if (!data || !data.accounts) {
        throw new Error('Invalid wallet data format');
      }

      await this.saveAccounts(data.accounts);
      
      if (data.activeAccount) {
        await this.saveActiveAccount(data.activeAccount);
      }
      
      if (data.isOnboarded) {
        await this.setOnboarded();
      }
      
      console.log('✅ Wallet data imported successfully');
    } catch (error) {
      console.error('Failed to import wallet data:', error);
      throw new Error('Failed to import wallet data');
    }
  }
}