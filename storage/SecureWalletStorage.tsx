// // storage/Storage.ts - Enhanced version combining your existing code
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { BitcoinAccount } from "../types/account/BitcoinAccount";
// import * as Keychain from 'react-native-keychain';
// import CryptoJS from 'crypto-js';

// // Enhanced interface for storing complete wallet data
// export interface SecureWalletData {
//   mnemonic: string;
//   privateKey: string;
//   fingerprint: string;
// }

// export class SecureStorage {
//   private static readonly KEYCHAIN_SERVICE = 'SkibidiCashWallet';
  
//   /**
//    * Store complete wallet data securely (mnemonic + private key + fingerprint)
//    * This replaces the simpler storePrivateKey method for new wallets
//    */
//   static async storeWalletData(
//     accountId: string, 
//     walletData: SecureWalletData,
//     password?: string
//   ): Promise<void> {
//     try {
//       let dataToStore = JSON.stringify(walletData);
      
//       // Optionally encrypt with user password
//       if (password) {
//         dataToStore = CryptoJS.AES.encrypt(dataToStore, password).toString();
//       }
      
//       await Keychain.setInternetCredentials(
//         `${this.KEYCHAIN_SERVICE}_wallet_${accountId}`,
//         accountId,
//         dataToStore
//       );
//     } catch (error) {
//       console.error('Failed to store wallet data:', error);
//       throw new Error('Failed to store wallet data securely');
//     }
//   }

//   /**
//    * Retrieve complete wallet data from keychain
//    */
//   static async getWalletData(
//     accountId: string, 
//     password?: string
//   ): Promise<SecureWalletData | null> {
//     try {
//       const credentials = await Keychain.getInternetCredentials(
//         `${this.KEYCHAIN_SERVICE}_wallet_${accountId}`
//       );
      
//       if (credentials === false) {
//         return null;
//       }
      
//       let walletDataString = credentials.password;
      
//       // Decrypt if password was used
//       if (password) {
//         try {
//           const bytes = CryptoJS.AES.decrypt(walletDataString, password);
//           walletDataString = bytes.toString(CryptoJS.enc.Utf8);
          
//           if (!walletDataString) {
//             throw new Error('Invalid password');
//           }
//         } catch (decryptError) {
//           throw new Error('Invalid password');
//         }
//       }
      
//       return JSON.parse(walletDataString);
//     } catch (error) {
//       console.error('Failed to retrieve wallet data:', error);
//       return null;
//     }
//   }

//   /**
//    * Legacy method - store just private key (for backward compatibility)
//    */
//   static async storePrivateKey(accountId: string, privateKey: string): Promise<void> {
//     try {
//       await Keychain.setInternetCredentials(
//         `${this.KEYCHAIN_SERVICE}_${accountId}`,
//         accountId,
//         privateKey
//       );
//     } catch (error) {
//       console.error('Failed to store private key:', error);
//       throw new Error('Failed to securely store private key');
//     }
//   }

//   /**
//    * Legacy method - get just private key (for backward compatibility)
//    */
//   static async getPrivateKey(accountId: string): Promise<string | null> {
//     try {
//       const credentials = await Keychain.getInternetCredentials(`${this.KEYCHAIN_SERVICE}_${accountId}`);
//       if (credentials && credentials.password) {
//         return credentials.password;
//       }
//       return null;
//     } catch (error) {
//       console.error('Failed to retrieve private key:', error);
//       return null;
//     }
//   }

//   /**
//    * Delete wallet data from keychain
//    */
//   static async deleteWalletData(accountId: string): Promise<void> {
//     try {
//       // Delete new format wallet data
//       await Keychain.resetInternetCredentials({
//         server: `${this.KEYCHAIN_SERVICE}_${accountId}`,
//       });
//       // Also delete legacy private key if it exists
//       await this.deletePrivateKey(accountId);
//     } catch (error) {
//       console.error('Failed to delete wallet data:', error);
//       throw new Error('Failed to delete wallet data');
//     }
//   }

//   /**
//    * Legacy method - delete just private key
//    */
//   static async deletePrivateKey(accountId: string): Promise<void> {
//     try {
//         await Keychain.resetInternetCredentials({
//             server: `${this.KEYCHAIN_SERVICE}_${accountId}`,
//           });
//     } catch (error) {
//       console.error('Failed to delete private key:', error);
//     }
//   }

//   /**
//    * Check if wallet data exists for account
//    */
//   static async hasWalletData(accountId: string): Promise<boolean> {
//     try {
//       const credentials = await Keychain.getInternetCredentials(
//         `${this.KEYCHAIN_SERVICE}_wallet_${accountId}`
//       );
//       return credentials !== false;
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * Store master password hash for verification
//    */
//   static async storeMasterPasswordHash(passwordHash: string): Promise<void> {
//     try {
//       await Keychain.setInternetCredentials(
//         `${this.KEYCHAIN_SERVICE}_master`,
//         'master',
//         passwordHash
//       );
//     } catch (error) {
//       throw new Error('Failed to store master password');
//     }
//   }

//   /**
//    * Verify master password
//    */
//   static async verifyMasterPassword(password: string): Promise<boolean> {
//     try {
//       const credentials = await Keychain.getInternetCredentials(
//         `${this.KEYCHAIN_SERVICE}_master`
//       );
      
//       if (credentials === false) {
//         return false;
//       }
      
//       const storedHash = credentials.password;
//       const providedHash = CryptoJS.SHA256(password).toString();
      
//       return storedHash === providedHash;
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * Get recovery phrase for account
//    */
//   static async getRecoveryPhrase(accountId: string, password?: string): Promise<string | null> {
//     try {
//       const walletData = await this.getWalletData(accountId, password);
//       return walletData?.mnemonic || null;
//     } catch (error) {
//       console.error('Failed to get recovery phrase:', error);
//       return null;
//     }
//   }
// }

// export class AccountStorage {
//   private static readonly ACCOUNTS_KEY = 'skibidi_accounts';
//   private static readonly ACTIVE_ACCOUNT_KEY = 'skibidi_active_account';
//   private static readonly ONBOARDED_KEY = 'skibidi_onboarded';
//   private static readonly ACCOUNT_IDS_KEY = 'skibidi_account_ids'; // New: track account IDs

//   static async saveAccounts(accounts: BitcoinAccount[]): Promise<void> {
//     try {
//       await AsyncStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
      
//       // Also save account IDs for tracking secure storage
//       const accountIds = accounts.map(acc => acc.id);
//       await AsyncStorage.setItem(this.ACCOUNT_IDS_KEY, JSON.stringify(accountIds));
//     } catch (error) {
//       console.error('Failed to save accounts:', error);
//       throw error;
//     }
//   }

//   static async loadAccounts(): Promise<BitcoinAccount[]> {
//     try {
//       const accountsJson = await AsyncStorage.getItem(this.ACCOUNTS_KEY);
//       if (accountsJson) {
//         return JSON.parse(accountsJson);
//       }
//       return [];
//     } catch (error) {
//       console.error('Failed to load accounts:', error);
//       return [];
//     }
//   }

//   static async saveActiveAccount(accountId: string): Promise<void> {
//     try {
//       await AsyncStorage.setItem(this.ACTIVE_ACCOUNT_KEY, accountId);
//     } catch (error) {
//       console.error('Failed to save active account:', error);
//       throw error;
//     }
//   }

//   static async loadActiveAccount(): Promise<string | null> {
//     try {
//       return await AsyncStorage.getItem(this.ACTIVE_ACCOUNT_KEY);
//     } catch (error) {
//       console.error('Failed to load active account:', error);
//       return null;
//     }
//   }

//   static async setOnboarded(): Promise<void> {
//     try {
//       await AsyncStorage.setItem(this.ONBOARDED_KEY, 'true');
//     } catch (error) {
//       console.error('Failed to set onboarded flag:', error);
//     }
//   }

//   static async isOnboarded(): Promise<boolean> {
//     try {
//       const onboarded = await AsyncStorage.getItem(this.ONBOARDED_KEY);
//       return onboarded === 'true';
//     } catch (error) {
//       console.error('Failed to check onboarded status:', error);
//       return false;
//     }
//   }

//   /**
//    * Get list of account IDs that have secure wallet data
//    */
//   static async getStoredAccountIds(): Promise<string[]> {
//     try {
//       const accountIdsJson = await AsyncStorage.getItem(this.ACCOUNT_IDS_KEY);
//       if (accountIdsJson) {
//         return JSON.parse(accountIdsJson);
//       }
//       return [];
//     } catch (error) {
//       console.error('Failed to get stored account IDs:', error);
//       return [];
//     }
//   }

//   /**
//    * Remove account and its secure data
//    */
//   static async deleteAccount(accountId: string): Promise<void> {
//     try {
//       // Load current accounts
//       const accounts = await this.loadAccounts();
      
//       // Remove the account
//       const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      
//       // Save updated accounts
//       await this.saveAccounts(updatedAccounts);
      
//       // Delete secure wallet data
//       await SecureStorage.deleteWalletData(accountId);
      
//       // If this was the active account, clear it
//       const activeAccountId = await this.loadActiveAccount();
//       if (activeAccountId === accountId) {
//         await AsyncStorage.removeItem(this.ACTIVE_ACCOUNT_KEY);
//       }
//     } catch (error) {
//       console.error('Failed to delete account:', error);
//       throw error;
//     }
//   }
// }


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
}