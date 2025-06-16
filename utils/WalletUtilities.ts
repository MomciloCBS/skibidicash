import { Alert } from 'react-native';
import { BreezSDKService } from '../services/BreezSDKService';
import { AccountStorage } from '../storage/SecureWalletStorage';
import Clipboard from '@react-native-clipboard/clipboard';

export class WalletUtilities {
  /**
   * Export wallet mnemonic with security warnings
   */
  static async exportMnemonic(): Promise<void> {
    try {
      const mnemonic = await BreezSDKService.getStoredMnemonic();
      
      if (!mnemonic) {
        Alert.alert('❌ Error', 'No wallet found to export');
        return;
      }

      Alert.alert(
        '🔐 Export Wallet Seed',
        '⚠️ WARNING: Your seed phrase is the master key to your wallet. Anyone with access to it can control your funds. Never share it with anyone and store it securely offline.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'I Understand, Show Seed',
            style: 'destructive',
            onPress: () => this.showMnemonic(mnemonic)
          }
        ]
      );
    } catch (error: any) {
      console.error('Failed to export mnemonic:', error);
      Alert.alert('❌ Error', 'Failed to export wallet seed');
    }
  }

  /**
   * Display mnemonic with copy option
   */
  private static showMnemonic(mnemonic: string): void {
    const words = mnemonic.split(' ');
    const numberedWords = words.map((word, index) => `${index + 1}. ${word}`).join('\n');
    
    Alert.alert(
      '🔑 Your Wallet Seed Phrase',
      `Write down these 12 words in the exact order:\n\n${numberedWords}\n\n⚠️ Store this safely offline. This is the only way to recover your wallet.`,
      [
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            Clipboard.setString(mnemonic);
            Alert.alert(
              '📋 Copied!', 
              'Seed phrase copied to clipboard.\n\n⚠️ Remember to clear your clipboard after saving it securely!'
            );
          }
        },
        {
          text: 'I Saved It Securely',
          style: 'default'
        }
      ]
    );
  }

  /**
   * Import wallet from mnemonic
   */
  static async importWallet(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.prompt(
        '📥 Import Wallet',
        'Enter your 12-word seed phrase (separated by spaces):',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Import',
            onPress: async (mnemonic) => {
              if (!mnemonic) {
                Alert.alert('❌ Error', 'Please enter a valid seed phrase');
                resolve(false);
                return;
              }
              
              try {
                // Validate and import mnemonic
                if (!BreezSDKService.validateMnemonicPhrase(mnemonic)) {
                  Alert.alert('❌ Invalid Seed', 'The seed phrase you entered is not valid. Please check and try again.');
                  resolve(false);
                  return;
                }

                await BreezSDKService.importMnemonic(mnemonic);
                
                Alert.alert(
                  '✅ Import Successful', 
                  'Your wallet has been imported successfully! The app will restart to load your wallet.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // You might want to trigger app restart here
                        resolve(true);
                      }
                    }
                  ]
                );
              } catch (error: any) {
                console.error('Failed to import wallet:', error);
                Alert.alert('❌ Import Failed', `Failed to import wallet: ${error.message}`);
                resolve(false);
              }
            }
          }
        ],
        'plain-text',
        '',
        'default'
      );
    });
  }

  /**
   * Reset wallet (delete all data)
   */
  static async resetWallet(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🗑️ Reset Wallet',
        '⚠️ WARNING: This will permanently delete your wallet and all data. Make sure you have your seed phrase backed up before proceeding.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'I Have My Seed Phrase',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '🚨 Final Confirmation',
                'Are you absolutely sure you want to delete your wallet? This action cannot be undone.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => resolve(false)
                  },
                  {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // Clear all wallet data
                        await BreezSDKService.clearMnemonic();
                        await AccountStorage.clearAll();
                        
                        Alert.alert(
                          '✅ Wallet Reset',
                          'Your wallet has been completely reset. The app will restart.',
                          [
                            {
                              text: 'OK',
                              onPress: () => resolve(true)
                            }
                          ]
                        );
                      } catch (error: any) {
                        console.error('Failed to reset wallet:', error);
                        Alert.alert('❌ Reset Failed', `Failed to reset wallet: ${error.message}`);
                        resolve(false);
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    });
  }

  /**
   * Verify wallet integrity
   */
  static async verifyWallet(): Promise<void> {
    try {
      const hasMnemonic = await BreezSDKService.hasMnemonic();
      const accounts = await AccountStorage.loadAccounts();
      const activeAccountId = await AccountStorage.loadActiveAccount();
      
      let status = '✅ Wallet Status:\n\n';
      status += `🔑 Seed Phrase: ${hasMnemonic ? 'Present' : 'Missing'}\n`;
      status += `👤 Accounts: ${accounts.length}\n`;
      status += `🎯 Active Account: ${activeAccountId ? 'Set' : 'None'}\n`;
      
      if (hasMnemonic && accounts.length > 0) {
        // Test address generation
        try {
          const testAddresses = await BreezSDKService.generateAddressesForAccount(0);
          status += `🏠 Address Generation: Working\n`;
          status += `📍 Payment Address: ${testAddresses.paymentsAddress.slice(0, 20)}...\n`;
        } catch (error) {
          status += `❌ Address Generation: Failed\n`;
        }
      }
      
      // Check SDK connection
      const sdkStatus = BreezSDKService.getSDKStatus();
      status += `⚡ Lightning SDK: ${sdkStatus.connected ? 'Connected' : 'Disconnected'}\n`;
      
      Alert.alert('🔍 Wallet Verification', status);
      
    } catch (error: any) {
      console.error('Failed to verify wallet:', error);
      Alert.alert('❌ Verification Failed', `Could not verify wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet summary for display
   */
  static async getWalletSummary(): Promise<{
    hasMnemonic: boolean;
    accountCount: number;
    activeAccount: string | null;
    isConnected: boolean;
  }> {
    try {
      const hasMnemonic = await BreezSDKService.hasMnemonic();
      const accounts = await AccountStorage.loadAccounts();
      const activeAccountId = await AccountStorage.loadActiveAccount();
      const isConnected = BreezSDKService.isSDKConnected();

      return {
        hasMnemonic,
        accountCount: accounts.length,
        activeAccount: activeAccountId,
        isConnected,
      };
    } catch (error) {
      console.error('Failed to get wallet summary:', error);
      return {
        hasMnemonic: false,
        accountCount: 0,
        activeAccount: null,
        isConnected: false,
      };
    }
  }

  /**
   * Generate a new account from existing mnemonic
   */
  static async generateNewAccount(name: string, emoji: string): Promise<any> {
    try {
      const accounts = await AccountStorage.loadAccounts();
      const accountIndex = accounts.length;
      
      const addresses = await BreezSDKService.generateAddressesForAccount(
        accountIndex, 
        __DEV__ ? 'testnet' : 'mainnet'
      );
      
      const newAccount = {
        id: Date.now().toString(),
        name,
        emoji,
        balance: 0,
        ordinalsBalance: 0,
        ordinalsAddress: addresses.ordinalsAddress,
        paymentsAddress: addresses.paymentsAddress,
        publicKey: addresses.publicKey,
        fingerprint: addresses.fingerprint,
        addressIndex: accountIndex,
        createdAt: Date.now(),
      };

      const updatedAccounts = [...accounts, newAccount];
      await AccountStorage.saveAccounts(updatedAccounts);
      
      console.log('✅ Generated new account from mnemonic:', name);
      return newAccount;
      
    } catch (error) {
      console.error('Failed to generate new account:', error);
      throw new Error('Failed to generate new account from mnemonic');
    }
  }
}