import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  SafeAreaView,
  Vibration,
  Alert,
} from 'react-native';
import { SkibidiColors } from './theme/SkibidiTheme';
import SkibidiFlushSplash from './components/SkibidiFlushSplash';
import { styles } from './styles/AppStyles';
import { BottomNavigation } from './components/BottomNavigation';
import { AccountModal } from './modals/AccountModal';
import { CreateAccountModal } from './modals/CreateAccountModal';
import { BitcoinAccount } from './types/account/BitcoinAccount';
import { AccountStorage } from './storage/Storage';
import { FixedHeader } from './components/Header';  
import { AccountSelector } from './components/AccountSelector';  
import { HomeContent } from './pages/HomeContent';
import { SwapContent } from './pages/SwapContent';
import { TransactionsContent } from './pages/TransactionContent';
import { GameContent } from './pages/GameContent';


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [accounts, setAccounts] = useState<BitcoinAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<BitcoinAccount | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportAccount, setExportAccount] = useState<BitcoinAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const initializeApp = async () => {
    try {
      const isOnboarded = await AccountStorage.isOnboarded();
      
      if (isOnboarded) {
        await loadAccountData();
        setOnboarded(true);
      } else {
        setOnboarded(false);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setOnboarded(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountData = async () => {
    try {
      const loadedAccounts = await AccountStorage.loadAccounts();
      const activeAccountId = await AccountStorage.loadActiveAccount();
      
      setAccounts(loadedAccounts);
      
      if (activeAccountId && loadedAccounts.length > 0) {
        const active = loadedAccounts.find(acc => acc.id === activeAccountId);
        setActiveAccount(active || loadedAccounts[0]);
      } else if (loadedAccounts.length > 0) {
        setActiveAccount(loadedAccounts[0]);
      }
    } catch (error) {
      console.error('Failed to load account data:', error);
    }
  };

  const completeOnboarding = async (newAccount: BitcoinAccount) => {
    try {
      const updatedAccounts = [newAccount];
      
      setAccounts(updatedAccounts);
      setActiveAccount(newAccount);
      
      await AccountStorage.saveAccounts(updatedAccounts);
      await AccountStorage.saveActiveAccount(newAccount.id);
      await AccountStorage.setOnboarded();
      
      setOnboarded(true);
      Vibration.vibrate([100, 50, 100]);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('❌ Error', 'Failed to save wallet. Please try again.');
    }
  };

  const handleAccountSelect = async (account: BitcoinAccount) => {
    setActiveAccount(account);
    await AccountStorage.saveActiveAccount(account.id);
    Vibration.vibrate(50);
  };

  const navigateToScreen = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleExportPrivateKey = (account: BitcoinAccount) => {
    setExportAccount(account);
    setShowExportModal(true);
  };

  const renderContent = () => {
    if (!activeAccount) return null;

    switch (currentScreen) {
      case 'swap':
        return <SwapContent />;
      case 'transactions':
        return <TransactionsContent />;
      case 'game':
        return <GameContent />;
      default:
        return <HomeContent activeAccount={activeAccount} />;
    }
  };

  if (!activeAccount) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🚽 Loading Chaos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={SkibidiColors.darkChaos} />
      
      <FixedHeader />
      
      <AccountSelector 
        activeAccount={activeAccount}
        onAccountPress={() => setShowAccountModal(true)}
      />
      
      <View style={styles.contentArea}>
      { loading && 
      <SkibidiFlushSplash
        toiletImage={require('./assets/toilet.png')}
        skibidiImage={require('./assets/skibidi-face.png')}
        onAnimationComplete={() => setLoading(false)}
        autoRestart={false}
      />
      } 
        {renderContent()}
      </View>
      
      <BottomNavigation currentScreen={currentScreen} onNavigate={navigateToScreen} />

      <AccountModal
        visible={showAccountModal}
        accounts={accounts}
        activeAccount={activeAccount}
        onClose={() => setShowAccountModal(false)}
        onSelectAccount={handleAccountSelect}
        onCreateAccount={() => {
          setShowAccountModal(false);
          setShowCreateModal(true);
        }}
        onExportPrivateKey={handleExportPrivateKey}
      />

      <CreateAccountModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAccount={() => {}}
      />
    </SafeAreaView>
  );
}