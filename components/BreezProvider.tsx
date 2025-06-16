import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, Alert, Vibration } from 'react-native';
import { BreezSDKService, WalletInfo } from '../services/BreezSDKService';
import { PaymentService, PaymentResult, InvoiceResult } from '../services/PaymentService';
import { SdkEvent, SdkEventVariant, PaymentMethod } from '@breeztech/react-native-breez-sdk-liquid';
import { BREEZ_API_KEY } from '@env';
import SkibidiFlushSplash from './SkibidiFlushSplash';
import toiletPic from "../assets/toilet.png";
import skibidiFace from "../assets/skibidi-face.png";

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
  initializeAfterWalletCreation: () => Promise<void>; 
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
    // Only initialize Breez SDK if we have a mnemonic
    checkAndInitialize();
    
    // Cleanup on unmount
    return () => {
      BreezSDKService.disconnect();
    };
  }, []);

  const checkAndInitialize = async () => {
    try {
      // Check if mnemonic exists before trying to connect
      const hasMnemonic = await BreezSDKService.hasMnemonic();
      
      if (hasMnemonic) {
        console.log('🔑 Mnemonic found, initializing Breez SDK...');
        await initializeBreezSDK();
      } else {
        console.log('🔑 No mnemonic found, waiting for wallet creation...');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Failed to check mnemonic:', error);
      setIsLoading(false);
    }
  };

  const initializeBreezSDK = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Initializing Breez SDK...');
      
      await BreezSDKService.initialize({
        onEvent: handleBreezEvent,
        network,
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
      
      // Show user-friendly error only if we expect the SDK to connect
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

  // Method to trigger SDK initialization after wallet creation
  const initializeAfterWalletCreation = async () => {
    console.log('🔄 Initializing Breez SDK after wallet creation...');
    await initializeBreezSDK();
  };

  // Loading screen while initializing (only if we expect to have a wallet)
  if (isLoading) {
    return <SkibidiFlushSplash toiletImage={toiletPic} skibidiImage={skibidiFace}  />;
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
    initializeAfterWalletCreation
  };

  return (
    <BreezContext.Provider value={contextValue}>
      {children}
    </BreezContext.Provider>
  );
};