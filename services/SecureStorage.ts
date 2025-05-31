import EncryptedStorage from 'react-native-encrypted-storage';

const STORAGE_KEYS = {
  PASSWORD: 'skibidi_password',
  MNEMONIC: 'skibidi_mnemonic',
};

export const SecureStorage = {
  async savePassword(password: string) {
    await EncryptedStorage.setItem(STORAGE_KEYS.PASSWORD, password);
  },

  async getPassword(): Promise<string | null> {
    return await EncryptedStorage.getItem(STORAGE_KEYS.PASSWORD);
  },

  async saveMnemonic(mnemonic: string) {
    await EncryptedStorage.setItem(STORAGE_KEYS.MNEMONIC, mnemonic);
  },

  async getMnemonic(): Promise<string | null> {
    return await EncryptedStorage.getItem(STORAGE_KEYS.MNEMONIC);
  },

  async clearAll() {
    await EncryptedStorage.clear();
  },
};
