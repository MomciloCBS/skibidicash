import { BitcoinAccount } from '../account/BitcoinAccount';
import { WalletInfo } from '../../services/BreezSDKService';

export interface BaseContentProps {
  activeAccount: BitcoinAccount;
  walletInfo: WalletInfo | null;
  breezConnected: boolean;
  onUpdateBalance: () => Promise<void>;
}

export interface PaymentProps {
  onSendPayment: (destination: string, amountSats?: number) => Promise<any>;
  onReceivePayment: (amountSats?: number, description?: string) => Promise<any>;
}

export interface HomeContentProps extends BaseContentProps, PaymentProps {
  onGetTestCoins: () => Promise<void>;
}

export interface SwapContentProps extends BaseContentProps, PaymentProps {
  // Add swap-specific props here if needed
}

export interface TransactionsContentProps extends BaseContentProps {
  // Add transaction-specific props here if needed
}

export interface GameContentProps extends BaseContentProps {
  onSendPayment: (destination: string, amountSats?: number) => Promise<any>;
  onReceivePayment: (amountSats?: number, description?: string) => Promise<any>;
  onGetTestCoins: () => Promise<void>;
}