// components/BreezProvider.tsx - Updated to use final Breez SDK Liquid API
import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, Alert, Vibration } from 'react-native';
import { BreezSDKService, WalletInfo } from '../services/BreezSDKService';
import { PaymentService, PaymentResult, InvoiceResult } from '../services/PaymentService';
import { SdkEvent, SdkEventVariant, PaymentMethod } from '@breeztech/react-native-breez-sdk-liquid';
import { BREEZ_API_KEY, MNEMONIC, NETWORK } from '@env';
import SkibidiFlushSplash from './SkibidiFlushSplash';

interface BreezContextType {
  isConnected: boolean;
  walletInfo: WalletInfo | null;
  isLoading: boolean;
  error: string | null;
  updateWalletInfo: () => Promise<void>;
  sendPayment: (destination: string, amountSats?: number) => Promise<PaymentResult>;
  createInvoice: (amountSats: number, description?: string, paymentMethod?: PaymentMethod) => Promise<InvoiceResult>;
  getPaymentHistory: () => Promise<any[]>;
  sync: () => Promise<void>;
}

const BreezContext = createContext<BreezContextType | null>(null);

export const useBreez = () => {
  const context = useContext(BreezContext);
  if (!context) {
    throw new Error('useBreez must be used within BreezProvider');
  }
  return context;
};

interface BreezProviderProps {
  children: React.ReactNode;
  network?: 'testnet' | 'mainnet';
}

export const BreezProvider: React.FC<BreezProviderProps> = ({ 
  children, 
  network = __DEV__ ? 'testnet' : 'mainnet' 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeBreezSDK();
    
    // Cleanup on unmount
    return () => {
      BreezSDKService.disconnect();
    };
  }, []);

  const initializeBreezSDK = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Initializing Breez SDK...');
      
      await BreezSDKService.initialize({
        onEvent: handleBreezEvent,
        network: NETWORK,
        apiKey: BREEZ_API_KEY,
      });

      setIsConnected(true);
      console.log('✅ Breez SDK connected successfully');
      
      // Get initial wallet info
      await updateWalletInfo();
      
      // Success feedback
      Vibration.vibrate([50, 20, 50]);
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Breez SDK:', error);
      setError(error.message);
      setIsConnected(false);
      
      // Show user-friendly error
      Alert.alert(
        '⚡ Lightning Connection Failed',
        'Could not connect to the Lightning Network. You can retry or continue with limited functionality.',
        [
          { 
            text: 'Retry', 
            onPress: () => {
              setTimeout(initializeBreezSDK, 1000);
            }
          },
          { 
            text: 'Continue Offline', 
            style: 'cancel',
            onPress: () => {
              setIsLoading(false);
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreezEvent = (event: SdkEvent) => {
    console.log('🔔 Breez SDK Event:', event.type);
    
    switch (event.type) {
      case SdkEventVariant.PAYMENT_SUCCEEDED:
        console.log('✅ Payment succeeded:', event.details);
        Vibration.vibrate([100, 50, 100, 50, 200]);
        Alert.alert(
          '🎉 Payment Successful!', 
          `Your payment has been completed successfully.`
        );
        updateWalletInfo();
        break;
        
      case SdkEventVariant.PAYMENT_FAILED:
        console.log('❌ Payment failed:', event.details);
        Vibration.vibrate([200]);
        Alert.alert(
          '💀 Payment Failed!', 
          `Payment failed. Please try again.`
        );
        break;
        
      case SdkEventVariant.PAYMENT_PENDING:
        console.log('⏳ Payment pending:', event.details);
        Alert.alert('⏳ Payment Pending', 'Your payment is being processed...');
        break;
        
      case SdkEventVariant.SYNCED:
        console.log('🔄 Wallet synced');
        updateWalletInfo();
        break;

      case SdkEventVariant.DATA_SYNCED:
        console.log('📊 Data synced, new records:', event.didPullNewRecords);
        if (event.didPullNewRecords) {
          updateWalletInfo();
        }
        break;
        
      case SdkEventVariant.PAYMENT_WAITING_CONFIRMATION:
        console.log('⏰ Payment waiting confirmation:', event.details);
        Alert.alert('⏰ Waiting Confirmation', 'Payment is waiting for network confirmation');
        break;
        
      case SdkEventVariant.PAYMENT_REFUNDABLE:
        console.log('💰 Payment refundable:', event.details);
        Alert.alert(
          '💰 Payment Refundable', 
          'This payment can be refunded. Would you like to process the refund?',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Refund', onPress: () => {
              // Handle refund logic here
              console.log('User requested refund for payment:', event.details);
            }}
          ]
        );
        break;

      case SdkEventVariant.PAYMENT_WAITING_FEE_ACCEPTANCE:
        console.log('💸 Payment waiting fee acceptance:', event.details);
        Alert.alert(
          '💸 Fee Acceptance Required',
          'This payment requires fee acceptance. Please review the fees.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Accept Fees', onPress: () => {
              // Handle fee acceptance logic here
              console.log('User accepted fees for payment:', event.details);
            }}
          ]
        );
        break;
        
      default:
        console.log('📡 Other SDK Event:', event.type, event);
    }
  };

  const updateWalletInfo = async () => {
    if (!isConnected) return;
    
    try {
      const info = await BreezSDKService.getWalletInfo();
      setWalletInfo(info);
    } catch (error: any) {
      console.error('Failed to update wallet info:', error);
    }
  };

  const sendPayment = async (destination: string, amountSats?: number): Promise<PaymentResult> => {
    if (!isConnected) {
      throw new Error('Lightning network not connected');
    }
    
    return await PaymentService.sendPayment(destination, amountSats);
  };

  const createInvoice = async (
    amountSats: number, 
    description?: string,
    paymentMethod: PaymentMethod = PaymentMethod.LIGHTNING
  ): Promise<InvoiceResult> => {
    if (!isConnected) {
      throw new Error('Lightning network not connected');
    }
    
    return await PaymentService.createReceiveInvoice(amountSats, description, paymentMethod);
  };

  const getPaymentHistory = async () => {
    if (!isConnected) {
      throw new Error('Lightning network not connected');
    }
    
    return await BreezSDKService.getPaymentHistory({ limit: 50 });
  };

  const sync = async () => {
    if (!isConnected) {
      throw new Error('Lightning network not connected');
    }
    
    return await BreezSDKService.sync();
  };

  // Loading screen while initializing
  if (isLoading) {
    return (
    //   <View style={{
    //     flex: 1,
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     backgroundColor: '#1a1a1a',
    //   }}>
    //     <Text style={{ 
    //       textAlign: 'center', 
    //       color: '#ffffff',
    //       fontSize: 18,
    //       marginBottom: 10,
    //     }}>
    //       ⚡ Connecting to Lightning...
    //     </Text>
    //     <Text style={{ 
    //       textAlign: 'center', 
    //       color: '#888888',
    //       fontSize: 14,
    //     }}>
    //       Powering up your Skibidi experience
    //     </Text>
    //   </View>
    <SkibidiFlushSplash />
    );
  }

  const contextValue: BreezContextType = {
    isConnected,
    walletInfo,
    isLoading,
    error,
    updateWalletInfo,
    sendPayment,
    createInvoice,
    getPaymentHistory,
    sync,
  };

  return (
    <BreezContext.Provider value={contextValue}>
      {children}
    </BreezContext.Provider>
  );
};