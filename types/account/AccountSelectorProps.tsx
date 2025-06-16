import { BitcoinAccount } from "./BitcoinAccount";

// 🏦 Account Selector Component
export interface AccountSelectorProps {
    activeAccount: BitcoinAccount;
    onAccountPress: () => void;
    isLightningConnected?: boolean;
}
  
