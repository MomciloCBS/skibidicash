// utils/MnemonicUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// You'll need to install these packages:
// npm install react-native-get-random-values
// npm install bip39-expo or similar mnemonic library

// Import random values polyfill for React Native
import 'react-native-get-random-values';

// For production use, install a proper BIP39 library like:
// import * as bip39 from 'bip39-expo';
// or
// import { generateMnemonic, validateMnemonic } from '@dawar2151/bip39-expo';

const MNEMONIC_STORAGE_KEY = '@breez_mnemonic';
const MNEMONIC_BACKUP_SHOWN_KEY = '@mnemonic_backup_shown';

export class MnemonicUtils {
  /**
   * Generate a new 12-word BIP39 mnemonic
   * Replace this with proper BIP39 library in production
   */
  static generateMnemonic(): string {
    // TEMPORARY: Using test mnemonic for development
    // In production, use proper BIP39 library:
    // return bip39.generateMnemonic();
    
    const testWords = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ];
    
    // Generate 12 random words for testing
    const mnemonic = Array.from({ length: 12 }, () => 
      testWords[Math.floor(Math.random() * testWords.length)]
    ).join(' ');
    
    console.log('⚠️ DEVELOPMENT: Generated test mnemonic. Replace with proper BIP39 in production!');
    return mnemonic;
  }

  /**
   * Validate mnemonic (replace with proper BIP39 validation)
   */
  static validateMnemonic(mnemonic: string): boolean {
    // TEMPORARY: Basic validation for testing
    // In production, use: return bip39.validateMnemonic(mnemonic);
    
    const words = mnemonic.trim().split(' ');
    return words.length === 12 && words.every(word => word.length > 0);
  }

  /**
   * Get stored mnemonic or generate new one
   */
  static async getOrCreateMnemonic(): Promise<string> {
    try {
      // Check if mnemonic already exists
      const existingMnemonic = await AsyncStorage.getItem(MNEMONIC_STORAGE_KEY);
      
      if (existingMnemonic) {
        console.log('✅ Using existing mnemonic from secure storage');
        
        // Validate existing mnemonic
        if (this.validateMnemonic(existingMnemonic)) {
          return existingMnemonic;
        } else {
          console.log('⚠️ Existing mnemonic is invalid, generating new one');
        }
      }

      // Generate new mnemonic
      const newMnemonic = this.generateMnemonic();
      
      // Store securely
      await AsyncStorage.setItem(MNEMONIC_STORAGE_KEY, newMnemonic);
      
      console.log('🆕 Generated and stored new mnemonic securely');
      return newMnemonic;
      
    } catch (error) {
      console.error('❌ Failed to handle mnemonic:', error);
      throw new Error('Failed to generate or retrieve wallet mnemonic');
    }
  }

  /**
   * Get stored mnemonic (for backup/export purposes)
   */
  static async getStoredMnemonic(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(MNEMONIC_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to retrieve mnemonic:', error);
      return null;
    }
  }

  /**
   * Clear stored mnemonic (for wallet reset)
   */
  static async clearMnemonic(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([MNEMONIC_STORAGE_KEY, MNEMONIC_BACKUP_SHOWN_KEY]);
      console.log('🗑️ Cleared stored mnemonic and backup flags');
    } catch (error) {
      console.error('Failed to clear mnemonic:', error);
      throw error;
    }
  }

  /**
   * Check if user has been shown mnemonic backup prompt
   */
  static async hasShownBackupPrompt(): Promise<boolean> {
    try {
      const shown = await AsyncStorage.getItem(MNEMONIC_BACKUP_SHOWN_KEY);
      return shown === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark that backup prompt has been shown
   */
  static async markBackupPromptShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(MNEMONIC_BACKUP_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark backup prompt as shown:', error);
    }
  }

  /**
   * Format mnemonic for display (with numbering)
   */
  static formatMnemonicForDisplay(mnemonic: string): Array<{word: string, index: number}> {
    const words = mnemonic.trim().split(' ');
    return words.map((word, index) => ({
      word,
      index: index + 1
    }));
  }

  /**
   * Create mnemonic backup text
   */
  static createBackupText(mnemonic: string): string {
    const timestamp = new Date().toLocaleString();
    const formattedWords = this.formatMnemonicForDisplay(mnemonic);
    
    return `
SKIBIDI CASH WALLET BACKUP
Generated: ${timestamp}

🔐 RECOVERY PHRASE (Keep this safe and private!)
${formattedWords.map(({word, index}) => `${index}. ${word}`).join('\n')}

⚠️ IMPORTANT SECURITY NOTES:
• Never share this phrase with anyone
• Store it in a secure, offline location
• Anyone with this phrase can access your funds
• Skibidi Cash cannot recover lost phrases

🚽 Stay skibidi, stay secure! ⚡
    `.trim();
  }

  /**
   * Export mnemonic for user backup
   */
  static async exportForBackup(): Promise<string | null> {
    try {
      const mnemonic = await this.getStoredMnemonic();
      if (!mnemonic) {
        throw new Error('No mnemonic found to export');
      }
      
      await this.markBackupPromptShown();
      return this.createBackupText(mnemonic);
      
    } catch (error) {
      console.error('Failed to export mnemonic for backup:', error);
      return null;
    }
  }
}

// Additional utility functions for mnemonic handling
export const MnemonicConstants = {
  WORD_COUNT: 12,
  MIN_ENTROPY_BITS: 128,
  STORAGE_KEY: MNEMONIC_STORAGE_KEY,
} as const;

// Hook for React components to use mnemonic utilities
export const useMnemonic = () => {
  return {
    generateMnemonic: MnemonicUtils.generateMnemonic,
    validateMnemonic: MnemonicUtils.validateMnemonic,
    getOrCreateMnemonic: MnemonicUtils.getOrCreateMnemonic,
    getStoredMnemonic: MnemonicUtils.getStoredMnemonic,
    clearMnemonic: MnemonicUtils.clearMnemonic,
    exportForBackup: MnemonicUtils.exportForBackup,
    hasShownBackupPrompt: MnemonicUtils.hasShownBackupPrompt,
    formatForDisplay: MnemonicUtils.formatMnemonicForDisplay,
  };
};