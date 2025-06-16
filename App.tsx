// App.tsx - Final Production Version with Breez SDK Integration
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  SafeAreaView,
  Vibration,
  Alert,
} from 'react-native';
import SkibidiFlushSplash from './components/SkibidiFlushSplash';
import { BreezProvider, useBreez } from './components/BreezProvider';
import { styles } from './styles/AppStyles';
import { BottomNavigation } from './components/BottomNavigation';
import { AccountModal } from './modals/AccountModal';
import { CreateAccountModal } from './modals/CreateAccountModal';
import { BitcoinAccount } from './types/account/BitcoinAccount';
import { AccountStorage } from './storage/SecureWalletStorage';
import { FixedHeader } from './components/Header';  
import { AccountSelector } from './components/AccountSelector';  
import { HomeContent } from './pages/HomeContent';
import { SwapContent } from './pages/SwapContent';
import { TransactionsContent } from './pages/TransactionContent';
import { GameContent } from './pages/GameContent';
import { SkibidiButton } from './components/SkibidiButton';
import Clipboard from '@react-native-clipboard/clipboard';

// App states
type AppState = 'splash' | 'loading' | 'onboarding' | 'ready' | 'error';

interface AppError {
  message: string;
  canRetry: boolean;
  retryAction?: () => void;
}

// Main App Content Component (wrapped by BreezProvider)
function AppContent() {
  // Breez SDK state from context
  const { 
    isConnected: breezConnected, 
    walletInfo: breezWalletInfo, 
    updateWalletInfo: updateBreezWalletInfo, 
    sendPayment: breezSendPayment, 
    createInvoice: breezCreateInvoice,
    isLoading: breezLoading,
    error: breezError
  } = useBreez();
  
  // Core app state
  const [appState, setAppState] = useState<AppState>('splash');
  const [appError, setAppError] = useState<AppError | null>(null);
  
  // Account management
  const [accounts, setAccounts] = useState<BitcoinAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<BitcoinAccount | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  
  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Update account balance when wallet info changes
  useEffect(() => {
    if (activeAccount && breezWalletInfo && breezConnected) {
      updateAccountBalance();
    }
  }, [breezWalletInfo, activeAccount, breezConnected]);

  // Monitor Breez connection status
  useEffect(() => {
    if (breezError) {
      console.log('⚠️ Breez error detected:', breezError);
    }
  }, [breezError]);

  const updateAccountBalance = async () => {
    if (!activeAccount || !breezWalletInfo) return;
    
    try {
      const updatedAccount: BitcoinAccount = {
        ...activeAccount,
        balance: breezWalletInfo.balanceSat,
      };
      setActiveAccount(updatedAccount);
      
      // Update in storage and accounts list
      const updatedAccounts = accounts.map(acc => 
        acc.id === activeAccount.id ? updatedAccount : acc
      );
      setAccounts(updatedAccounts);
      await AccountStorage.saveAccounts(updatedAccounts);
      
      console.log('💰 Account balance updated:', breezWalletInfo.balanceSat, 'sats');
    } catch (error) {
      console.error('Failed to update account balance:', error);
    }
  };

  const initializeApp = async () => {
    try {
      setAppState('splash');
      
      // Show splash for at least 2 seconds for better UX
      const splashPromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      // Initialize app data
      const initPromise = (async () => {
        setAppState('loading');
        
        console.log('🔄 Initializing SkibidiCash app...');
        
        const isOnboarded = await AccountStorage.isOnboarded();
        setOnboarded(isOnboarded);

        if (isOnboarded) {
          await loadAccountData();
          
          // Check if we have an active account
          const activeAccountId = await AccountStorage.loadActiveAccount();
          if (activeAccountId) {
            console.log('✅ Found existing account, proceeding to main app');
            return true; // Has account
          } else {
            console.log('⚠️ Onboarded but no active account, reset to onboarding');
            setOnboarded(false);
            return false;
          }
        }
        return false; // Not onboarded
      })();
      
      // Wait for both splash time and initialization
      const [, hasAccount] = await Promise.all([splashPromise, initPromise]);
      
      if (onboarded && hasAccount) {
        setAppState('ready');
        console.log('🎉 App initialized successfully');
      } else {
        setAppState('onboarding');
        console.log('👋 New user onboarding');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to initialize app:', error);
      setAppError({
        message: `Failed to initialize app: ${error.message}`,
        canRetry: true,
        retryAction: initializeApp
      });
      setAppState('error');
    }
  };

  const loadAccountData = async () => {
    try {
      const savedAccounts = await AccountStorage.loadAccounts();
      setAccounts(savedAccounts);

      const activeAccountId = await AccountStorage.loadActiveAccount();
      if (activeAccountId) {
        const active = savedAccounts.find(acc => acc.id === activeAccountId);
        if (active) {
          setActiveAccount(active);
          console.log('👤 Loaded active account:', active.name);
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      throw new Error('Failed to load account data');
    }
  };

  const handleCreateAccount = async (name: string, emoji: string) => {
    if (isCreatingAccount) return;
    
    setIsCreatingAccount(true);
    
    try {
      const accountId = Date.now().toString();
      
      console.log('🆕 Creating new account:', name, emoji);
      
      // Create account with Breez SDK integration
      const newAccount: BitcoinAccount = {
        id: accountId,
        name,
        emoji,
        balance: 0,
        ordinalsBalance: 0,
        // With Breez SDK, addresses are managed automatically
        ordinalsAddress: 'Managed by Breez SDK',
        paymentsAddress: 'Managed by Breez SDK',
        publicKey: 'Managed by Breez SDK',
        fingerprint: accountId,
        addressIndex: 0,
        createdAt: Date.now(),
      };

      const updatedAccounts = [...accounts, newAccount];
      await AccountStorage.saveAccounts(updatedAccounts);
      setAccounts(updatedAccounts);

      // Set active account and onboarding status
      setActiveAccount(newAccount);
      await AccountStorage.saveActiveAccount(newAccount.id);
      await AccountStorage.setOnboarded();
      setOnboarded(true);

      // Close modal and go to ready state
      setShowCreateModal(false);
      setAppState('ready');

      Vibration.vibrate([50, 30, 50]);
      
      // Show success message with Lightning status
      const lightningStatus = breezConnected 
        ? '⚡ Lightning is connected!' 
        : breezLoading 
          ? '⚡ Lightning connecting...'
          : '⚠️ Lightning will connect soon.';
      
      Alert.alert(
        '✅ Skibidi Success!', 
        `Your new Lightning wallet "${name}" is ready!\n\n${lightningStatus}`,
        [
          {
            text: __DEV__ ? 'Get Test Coins' : 'Start Trading',
            onPress: () => {
              if (__DEV__ && breezConnected) {
                setTimeout(handleGetTestCoins, 500);
              }
            },
          },
          { text: 'Epic!', style: 'default' },
        ]
      );

    } catch (error: any) {
      console.error('❌ Failed to create account:', error);
      Alert.alert('❌ Creation Failed', `Couldn't create wallet: ${error.message}`);
      setAppState('onboarding');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleGetTestCoins = async (): Promise<void> => {
    if (!breezConnected) {
      Alert.alert(
        '⚡ Lightning Not Ready', 
        breezLoading 
          ? 'Lightning Network is still connecting. Please wait a moment and try again.'
          : 'Lightning Network is not connected. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('💰 Creating test invoice...');
      
      const invoice = await breezCreateInvoice(
        10000, 
        'Skibidi test coins for maximum crypto chaos! 🚽⚡'
      );
      
      Alert.alert(
        '💰 Get Test Coins',
        'Use a Lightning testnet wallet or faucet to pay this invoice and get 10,000 test sats for maximum skibidi action!\n\n💡 Tip: Search for "Lightning testnet faucet" to find services that can send you test coins.',
        [
          {
            text: 'Copy Invoice',
            onPress: () => {
              Clipboard.setString(invoice.destination);
              Alert.alert('📋 Copied!', 'Lightning invoice copied to clipboard! Paste it in a testnet wallet to receive test coins.');
            }
          },
          { text: 'Epic!' }
        ]
      );
    } catch (error: any) {
      console.error('❌ Test invoice creation failed:', error);
      Alert.alert('❌ Error', `Failed to create test invoice: ${error.message}`);
    }
  };

  const handleSendPayment = async (destination: string, amountSats?: number): Promise<any> => {
    if (!breezConnected) {
      Alert.alert('⚡ Not Connected', 'Lightning network not connected');
      throw new Error('Lightning network not connected');
    }

    try {
      console.log('🚀 Sending payment to:', destination.substring(0, 20) + '...');
      
      const result = await breezSendPayment(destination, amountSats);
      
      Alert.alert('🚀 Payment Sent!', 'Transaction sent successfully!');
      await updateBreezWalletInfo();
      
      return result;
    } catch (error: any) {
      console.error('❌ Payment failed:', error);
      Alert.alert('❌ Payment Failed', error.message);
      throw error;
    }
  };

  const handleReceivePayment = async (amountSats?: number, description?: string): Promise<any> => {
    if (!breezConnected) {
      Alert.alert('⚡ Not Connected', 'Lightning network not connected');
      throw new Error('Not connected to Lightning');
    }

    try {
      const amount = amountSats || 1000;
      const desc = description || 'Skibidi Cash payment 🚽⚡';
      
      console.log('💰 Creating invoice for', amount, 'sats');
      
      const invoice = await breezCreateInvoice(amount, desc);
      
      Alert.alert(
        '💰 Payment Request Created',
        `Share this invoice to receive ${amount} sats`,
        [
          {
            text: 'Copy Invoice',
            onPress: () => {
              Clipboard.setString(invoice.destination);
              Alert.alert('📋 Copied!', 'Invoice copied to clipboard');
            }
          },
          {
            text: 'Show QR',
            onPress: () => {
              Alert.alert('📱 QR Code', 'QR code feature coming soon! For now, use the copied invoice text.');
            }
          },
          { text: 'Done' }
        ]
      );
      
      return invoice;
    } catch (error: any) {
      console.error('❌ Invoice creation failed:', error);
      Alert.alert('❌ Error', `Failed to create payment request: ${error.message}`);
      throw error;
    }
  };

  const handleSelectAccount = async (account: BitcoinAccount) => {
    setActiveAccount(account);
    await AccountStorage.saveActiveAccount(account.id);
    setShowAccountModal(false);
    
    console.log('👤 Switched to account:', account.name);
    
    // Update wallet info for the selected account
    if (breezConnected) {
      await updateBreezWalletInfo();
    }
  };

  const handleExportPrivateKey = async (account: BitcoinAccount) => {
    Alert.alert(
      '🔐 Self-Custodial Security',
      'Your Skibidi Cash wallet is secured by Breez SDK on the Liquid Network. Your funds are completely self-custodial - you have full control and the keys are secured locally on your device.',
      [
        {
          text: 'Learn More',
          onPress: () => {
            Alert.alert(
              '⚡ Lightning + Liquid Security',
              'Your Bitcoin is stored on the Liquid sidechain with Lightning Network capabilities. This gives you instant payments while maintaining full custody of your funds. Breez SDK handles the technical complexity while keeping your skibidi secure!'
            );
          }
        },
        { text: 'Epic!' }
      ]
    );
  };

  const renderContent = () => {
    if (!activeAccount) return null;

    // Base props for all content components
    const baseProps = {
      activeAccount,
      walletInfo: breezWalletInfo,
      breezConnected,
      onUpdateBalance: updateBreezWalletInfo,
    };

    // Payment handlers
    const paymentProps = {
      onSendPayment: handleSendPayment,
      onReceivePayment: handleReceivePayment,
    };

    switch (currentScreen) {
      case 'swap':
        return <SwapContent {...baseProps} {...paymentProps} />;
      case 'transactions':
        return <TransactionsContent {...baseProps} />;
      case 'game':
        return (
          <GameContent 
            {...baseProps}
            onSendPayment={handleSendPayment}
            onReceivePayment={handleReceivePayment}
            onGetTestCoins={handleGetTestCoins}
          />
        );
      default:
        return (
          <HomeContent 
            {...baseProps}
            {...paymentProps}
            onGetTestCoins={handleGetTestCoins}
          />
        );
    }
  };

  // Show Breez loading state
  if (breezLoading && appState === 'ready') {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⚡ Connecting to Lightning...</Text>
          <Text style={styles.subtitleText}>Powering up your skibidi experience</Text>
        </View> */}
        <SkibidiFlushSplash />
      </SafeAreaView>
    );
  }

  // Splash screen
  if (appState === 'splash') {
    return <SkibidiFlushSplash />;
  }

  // Error state
  if (appState === 'error' && appError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>💀 Something Went Wrong</Text>
          <Text style={styles.subtitleText}>{appError.message}</Text>
          {appError.canRetry && (
            <SkibidiButton
              title="🔄 Try Again"
              variant="primary"
              onPress={appError.retryAction || initializeApp}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Onboarding screen
  if (!onboarded || appState === 'onboarding') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Welcome to Skibidi Cash!</Text>
          <Text style={styles.subtitleText}>⚡ Powered by Lightning & Liquid Network</Text>
          <Text style={styles.subtitleText}>🚽 Maximum crypto chaos awaits</Text>
          <SkibidiButton
            title={isCreatingAccount ? "🔄 Creating..." : "🆕 Create Skibidi Wallet"}
            variant="primary"
            onPress={() => !isCreatingAccount && setShowCreateModal(true)}
            disabled={isCreatingAccount}
          />
        </View>
        <CreateAccountModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateAccount={handleCreateAccount}
          isCreating={isCreatingAccount}
        />
      </SafeAreaView>
    );
  }

  // Loading state
  if (appState === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🚽 Loading Skibidi Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No active account fallback
  if (!activeAccount && onboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 Account Recovery</Text>
          <Text style={styles.subtitleText}>Setting up your wallet...</Text>
          <SkibidiButton
            title="Create New Wallet"
            variant="primary"
            onPress={() => {
              setOnboarded(false);
              setAppState('onboarding');
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Main app interface
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <FixedHeader />
      <AccountSelector 
        activeAccount={activeAccount!}
        onAccountPress={() => setShowAccountModal(true)}
        isLightningConnected={breezConnected}
      />
      {renderContent()}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
      <AccountModal
        visible={showAccountModal}
        accounts={accounts}
        activeAccount={activeAccount!}
        onClose={() => setShowAccountModal(false)}
        onSelectAccount={handleSelectAccount}
        onCreateAccount={() => {
          setShowAccountModal(false);
          setShowCreateModal(true);
        }}
        onExportPrivateKey={handleExportPrivateKey}
      />
      <CreateAccountModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAccount={handleCreateAccount}
        isCreating={isCreatingAccount}
      />
    </SafeAreaView>
  );
}

// Main App Component with BreezProvider wrapper
export default function App() {
  return (
    <BreezProvider network={__DEV__ ? 'testnet' : 'mainnet'}>
      <AppContent />
    </BreezProvider>
  );
}