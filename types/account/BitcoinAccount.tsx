export interface BitcoinAccount {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  ordinalsBalance: number;
  // Simplified - addresses managed by Breez SDK
  ordinalsAddress: string;  
  paymentsAddress: string; 
  publicKey: string;
  fingerprint: string;
  addressIndex?: number;
  createdAt: number;
}