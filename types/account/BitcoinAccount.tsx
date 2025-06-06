// 🏦 Account Interface
export interface BitcoinAccount {
    id: string;
    name: string;
    ordinalsAddress: string; // Taproot address for ordinals
    paymentsAddress: string; // Native SegWit address for payments
    balance: number; // in sats
    ordinalsBalance: number; // ordinals count
    createdAt: number;
    emoji: string;
}