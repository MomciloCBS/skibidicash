import { BitcoinAccount } from "./BitcoinAccount";

// 📱 Account Selection Modal
export interface AccountModalProps {
    visible: boolean;
    accounts: BitcoinAccount[];
    activeAccount: BitcoinAccount;
    onClose: () => void;
    onSelectAccount: (account: BitcoinAccount) => void;
    onCreateAccount: () => void;
    onExportPrivateKey: (account: BitcoinAccount) => void;
  }
  
