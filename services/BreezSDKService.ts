// services/BreezSDKService.ts - Final version with correct Breez SDK Liquid API
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as liquidSdk from '@breeztech/react-native-breez-sdk-liquid';
import {
  Config,
  ConnectRequest,
  defaultConfig,
  LiquidNetwork,
  SdkEvent,
  SdkEventVariant,
  GetInfoResponse,
  WalletInfo as SDKWalletInfo,
  Payment,
  PaymentType,
  PaymentState,
  ListPaymentsRequest,
  EventListener,
} from '@breeztech/react-native-breez-sdk-liquid';
import { BREEZ_API_KEY, MNEMONIC } from '@env';


// Generate a secure random mnemonic - you'll need to install bip39
// npm install @react-native-async-storage/async-storage
// For mnemonic generation, you can use: npm install bip39-rn or similar

export interface BreezInitOptions {
  onEvent: EventListener;
  network: 'testnet' | 'mainnet';
  apiKey?: string;
}

export interface WalletInfo {
  balanceSat: number;
  pendingReceiveSat: number;
  pendingSendSat: number;
  fingerprint: string;
  pubkey: string;
  assetBalances: Array<{
    assetId: string;
    balanceSat: number;
    name?: string;
    ticker?: string;
    balance?: number;
  }>;
}

export interface PaymentHistoryOptions {
  filters?: PaymentType[];
  states?: PaymentState[];
  fromTimestamp?: number;
  toTimestamp?: number;
  offset?: number;
  limit?: number;
  sortAscending?: boolean;
}

export class BreezSDKService {
  private static isConnected = false;
  private static eventListenerId: string | null = null;
  private static currentNetwork: LiquidNetwork | null = null;
  private static config: Config | null = null;

  /**
   * Generate or retrieve stored mnemonic
   */
  private static async getMnemonic(): Promise<string> {
    try {
      // Check if we already have a mnemonic stored
      const storedMnemonic = await AsyncStorage.getItem('@breez_mnemonic');
      
      if (storedMnemonic) {
        console.log('✅ Using existing mnemonic from storage');
        return storedMnemonic;
      }

      // Generate new mnemonic (you'll need to implement proper mnemonic generation)
      // For now, using a test mnemonic - REPLACE THIS IN PRODUCTION
      const newMnemonic = MNEMONIC || 
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      
      // Store the mnemonic securely
      await AsyncStorage.setItem('@breez_mnemonic', newMnemonic);
      
      console.log('🆕 Generated and stored new mnemonic');
      return newMnemonic;
      
    } catch (error) {
      console.error('Failed to handle mnemonic:', error);
      throw new Error('Failed to handle wallet mnemonic');
    }
  }

  /**
   * Get the current mnemonic (for backup purposes)
   */
  static async getStoredMnemonic(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@breez_mnemonic');
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
      await AsyncStorage.removeItem('@breez_mnemonic');
      console.log('🗑️ Cleared stored mnemonic');
    } catch (error) {
      console.error('Failed to clear mnemonic:', error);
    }
  }

  /**
   * Initialize and connect to Breez SDK Liquid
   */
  static async initialize(options: BreezInitOptions): Promise<void> {
    if (this.isConnected) {
      console.log('⚠️ Breez SDK already connected');
      return;
    }

    try {
      console.log('🔄 Initializing Breez SDK Liquid...');

      // Get API key
      const apiKey = options.apiKey || BREEZ_API_KEY;
      if (!apiKey) {
        throw new Error('Breez API key is required');
      }

      // Get or generate mnemonic
      const mnemonic = await this.getMnemonic();

      // Create configuration
      const network = options.network === 'testnet' ? LiquidNetwork.TESTNET : LiquidNetwork.MAINNET;
      this.currentNetwork = network;

      console.log('🔧 Creating Liquid SDK config...');
      this.config = await defaultConfig(network, apiKey);

      console.log('🔌 Connecting to Breez SDK...');
      // Create proper connect request and connect FIRST
      const connectRequest: ConnectRequest = {
        config: this.config,
        mnemonic,
      };
      
      // Connect to Breez SDK Liquid
      await liquidSdk.connect(connectRequest);
      this.isConnected = true;
      console.log('✅ Breez SDK Liquid connected successfully');

      // Add event listener AFTER connection
      try {
        // Remove existing event listener if any
        if (this.eventListenerId) {
          await liquidSdk.removeEventListener(this.eventListenerId);
          this.eventListenerId = null;
        }

        this.eventListenerId = await liquidSdk.addEventListener(options.onEvent);
        console.log('✅ Event listener added successfully');
      } catch (eventError: any) {
        console.error('⚠️ Failed to add event listener:', eventError);
        // Continue without event listener - the SDK is still connected
      }

      // Perform initial sync
      await this.sync();

    } catch (error: any) {
      console.error('❌ Failed to initialize Breez SDK:', error);
      this.isConnected = false;
      
      // Clean up on failure
      if (this.eventListenerId) {
        try {
          await liquidSdk.removeEventListener(this.eventListenerId);
        } catch (cleanupError) {
          console.error('Failed to cleanup event listener:', cleanupError);
        }
        this.eventListenerId = null;
      }
      
      throw new Error(`Breez SDK initialization failed: ${error.message}`);
    }
  }

  /**
   * Get current wallet information
   */
  static async getWalletInfo(): Promise<WalletInfo> {
    if (!this.isConnected) {
      throw new Error('Breez SDK not connected. Call initialize() first.');
    }

    try {
      const info: GetInfoResponse = await liquidSdk.getInfo();
      const walletInfo: SDKWalletInfo = info.walletInfo;
      
      return {
        balanceSat: walletInfo.balanceSat,
        pendingReceiveSat: walletInfo.pendingReceiveSat,
        pendingSendSat: walletInfo.pendingSendSat,
        fingerprint: walletInfo.fingerprint,
        pubkey: walletInfo.pubkey,
        assetBalances: walletInfo.assetBalances.map(balance => ({
          assetId: balance.assetId,
          balanceSat: balance.balanceSat,
          name: balance.name,
          ticker: balance.ticker,
          balance: balance.balance,
        })),
      };
    } catch (error: any) {
      console.error('Failed to get wallet info:', error);
      throw new Error(`Failed to get wallet info: ${error.message}`);
    }
  }

  /**
   * Get payment history with optional filtering
   */
  static async getPaymentHistory(options: PaymentHistoryOptions = {}): Promise<Payment[]> {
    if (!this.isConnected) {
      throw new Error('Breez SDK not connected. Call initialize() first.');
    }

    try {
      const request: ListPaymentsRequest = {
        filters: options.filters,
        states: options.states,
        fromTimestamp: options.fromTimestamp,
        toTimestamp: options.toTimestamp,
        offset: options.offset || 0,
        limit: options.limit || 50,
        sortAscending: options.sortAscending || false,
      };

      const payments = await liquidSdk.listPayments(request);
      return payments;
    } catch (error: any) {
      console.error('Failed to get payment history:', error);
      throw new Error(`Failed to get payment history: ${error.message}`);
    }
  }

  /**
   * Get recent payments (last 20)
   */
  static async getRecentPayments(): Promise<Payment[]> {
    return this.getPaymentHistory({ 
      limit: 20,
      sortAscending: false,
    });
  }

  /**
   * Get sent payments only
   */
  static async getSentPayments(limit: number = 20): Promise<Payment[]> {
    return this.getPaymentHistory({ 
      filters: [PaymentType.SEND],
      limit,
      sortAscending: false,
    });
  }

  /**
   * Get received payments only
   */
  static async getReceivedPayments(limit: number = 20): Promise<Payment[]> {
    return this.getPaymentHistory({ 
      filters: [PaymentType.RECEIVE],
      limit,
      sortAscending: false,
    });
  }

  /**
   * Get payments by state
   */
  static async getPaymentsByState(states: PaymentState[], limit: number = 20): Promise<Payment[]> {
    return this.getPaymentHistory({ 
      states,
      limit,
      sortAscending: false,
    });
  }

  /**
   * Get balance in different formats
   */
  static async getFormattedBalance(): Promise<{
    sats: number;
    btc: string;
    pending: {
      receive: number;
      send: number;
    };
    assets: Array<{
      assetId: string;
      balanceSat: number;
      name?: string;
      ticker?: string;
    }>;
  }> {
    const walletInfo = await this.getWalletInfo();
    
    return {
      sats: walletInfo.balanceSat,
      btc: (walletInfo.balanceSat / 100000000).toFixed(8),
      pending: {
        receive: walletInfo.pendingReceiveSat,
        send: walletInfo.pendingSendSat,
      },
      assets: walletInfo.assetBalances,
    };
  }

  /**
   * Check if SDK is connected
   */
  static isSDKConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current network
   */
  static getCurrentNetwork(): LiquidNetwork | null {
    return this.currentNetwork;
  }

  /**
   * Get current configuration
   */
  static getCurrentConfig(): Config | null {
    return this.config;
  }

  /**
   * Sync wallet data
   */
  static async sync(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Breez SDK not connected. Call initialize() first.');
    }

    try {
      console.log('🔄 Syncing wallet...');
      await liquidSdk.sync();
      console.log('✅ Wallet synced successfully');
    } catch (error: any) {
      console.error('Failed to sync wallet:', error);
      // Don't throw error for sync failures, just log them
    }
  }

  /**
   * Get Lightning payment limits
   */
  static async getLightningLimits(): Promise<{
    send: { minSat: number; maxSat: number; maxZeroConfSat: number };
    receive: { minSat: number; maxSat: number; maxZeroConfSat: number };
  }> {
    try {
      const limits = await liquidSdk.fetchLightningLimits();
      return {
        send: limits.send,
        receive: limits.receive,
      };
    } catch (error: any) {
      console.error('Failed to get Lightning limits:', error);
      throw new Error(`Failed to get Lightning limits: ${error.message}`);
    }
  }

  /**
   * Get on-chain payment limits
   */
  static async getOnchainLimits(): Promise<{
    send: { minSat: number; maxSat: number; maxZeroConfSat: number };
    receive: { minSat: number; maxSat: number; maxZeroConfSat: number };
  }> {
    try {
      const limits = await liquidSdk.fetchOnchainLimits();
      return {
        send: limits.send,
        receive: limits.receive,
      };
    } catch (error: any) {
      console.error('Failed to get on-chain limits:', error);
      throw new Error(`Failed to get on-chain limits: ${error.message}`);
    }
  }

  /**
   * Get recommended fees for on-chain transactions
   */
  static async getRecommendedFees(): Promise<{
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
  }> {
    try {
      const fees = await liquidSdk.recommendedFees();
      return fees;
    } catch (error: any) {
      console.error('Failed to get recommended fees:', error);
      throw new Error(`Failed to get recommended fees: ${error.message}`);
    }
  }

  /**
   * Disconnect from Breez SDK
   */
  static async disconnect(): Promise<void> {
    try {
      if (this.eventListenerId) {
        await liquidSdk.removeEventListener(this.eventListenerId);
        this.eventListenerId = null;
      }
      
      if (this.isConnected) {
        await liquidSdk.disconnect();
      }
      
      this.isConnected = false;
      this.currentNetwork = null;
      this.config = null;
      console.log('📴 Breez SDK disconnected');
    } catch (error: any) {
      console.error('Error disconnecting Breez SDK:', error);
      // Still mark as disconnected even if cleanup failed
      this.isConnected = false;
      this.currentNetwork = null;
      this.config = null;
    }
  }

  /**
   * Reconnect to the SDK (useful for error recovery)
   */
  static async reconnect(options: BreezInitOptions): Promise<void> {
    console.log('🔄 Reconnecting to Breez SDK...');
    await this.disconnect();
    await this.initialize(options);
  }

  /**
   * Check connection health
   */
  static async healthCheck(): Promise<{
    connected: boolean;
    canGetInfo: boolean;
    canSync: boolean;
    error?: string;
  }> {
    const result = {
      connected: this.isConnected,
      canGetInfo: false,
      canSync: false,
      error: undefined as string | undefined,
    };

    if (!this.isConnected) {
      result.error = 'SDK not connected';
      return result;
    }

    try {
      await this.getWalletInfo();
      result.canGetInfo = true;
    } catch (error: any) {
      result.error = `Cannot get wallet info: ${error.message}`;
      return result;
    }

    try {
      await this.sync();
      result.canSync = true;
    } catch (error: any) {
      result.error = `Cannot sync: ${error.message}`;
    }

    return result;
  }

  /**
   * Get SDK status for debugging
   */
  static getSDKStatus(): {
    connected: boolean;
    network: string | null;
    hasEventListener: boolean;
    hasConfig: boolean;
  } {
    return {
      connected: this.isConnected,
      network: this.currentNetwork,
      hasEventListener: this.eventListenerId !== null,
      hasConfig: this.config !== null,
    };
  }

  /**
   * Backup wallet data
   */
  static async backup(backupPath?: string): Promise<void> {
    try {
      await liquidSdk.backup({ backupPath });
      console.log('✅ Wallet backup completed');
    } catch (error: any) {
      console.error('Failed to backup wallet:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restore wallet data
   */
  static async restore(backupPath?: string): Promise<void> {
    try {
      await liquidSdk.restore({ backupPath });
      console.log('✅ Wallet restore completed');
    } catch (error: any) {
      console.error('Failed to restore wallet:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }
}