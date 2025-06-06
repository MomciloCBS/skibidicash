import AsyncStorage from "@react-native-async-storage/async-storage";
import { BitcoinAccount } from "../types/account/BitcoinAccount";
import * as Keychain from 'react-native-keychain';

export class SecureStorage {
    private static readonly KEYCHAIN_SERVICE = 'SkibidiCashWallet';
  
    static async storePrivateKey(accountId: string, privateKey: string): Promise<void> {
      try {
        await Keychain.setInternetCredentials(
          `${this.KEYCHAIN_SERVICE}_${accountId}`,
          accountId,
          privateKey
    );  
      } catch (error) {
        console.error('Failed to store private key:', error);
        throw new Error('Failed to securely store private key');
      }
    }
  
    static async getPrivateKey(accountId: string): Promise<string | null> {
      try {
        const credentials = await Keychain.getInternetCredentials(`${this.KEYCHAIN_SERVICE}_${accountId}`);
        if (credentials && credentials.password) {
          return credentials.password;
        }
        return null;
      } catch (error) {
        console.error('Failed to retrieve private key:', error);
        return null;
      }
    }
  
    static async deletePrivateKey(accountId: string): Promise<void> {
      try {
        await Keychain.resetInternetCredentials({
          server: `${this.KEYCHAIN_SERVICE}_${accountId}`,
        });
      } catch (error) {
        console.error('Failed to delete private key:', error);
      }
    }
}
  
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
}