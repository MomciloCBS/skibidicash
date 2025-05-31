// App.tsx - Account Management Skibidi Cash with Persistent Storage
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Vibration,
  Alert,
  Dimensions,
  Animated,
  Easing,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkibidiColors } from './theme/SkibidiTheme';
import SkibidiLoader from './components/SkibidiLoader';

const { width, height } = Dimensions.get('window');



// 🏦 Account Interface
interface BitcoinAccount {
  id: string;
  name: string;
  ordinalsAddress: string; // Taproot address for ordinals
  paymentsAddress: string; // Native SegWit address for payments
  balance: number; // in sats
  ordinalsBalance: number; // ordinals count
  createdAt: number;
  emoji: string;
}

// 🔧 Bitcoin Address Generator (Simplified)
class BitcoinAddressGenerator {
  static generateTaprootAddress(): string {
    // Simplified taproot address generation
    // In real app, use proper key derivation with bitcoinjs-lib
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = 'bc1p';
    for (let i = 0; i < 58; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
  }

  static generateSegWitAddress(): string {
    // Simplified native segwit address generation
    // In real app, use proper key derivation with bitcoinjs-lib
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = 'bc1q';
    for (let i = 0; i < 38; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
  }

  static createNewAccount(name: string, emoji: string): BitcoinAccount {
    return {
      id: Date.now().toString(),
      name,
      ordinalsAddress: this.generateTaprootAddress(),
      paymentsAddress: this.generateSegWitAddress(),
      balance: Math.floor(Math.random() * 1000000), // Random balance for demo
      ordinalsBalance: Math.floor(Math.random() * 50), // Random ordinals count
      createdAt: Date.now(),
      emoji,
    };
  }
}

// 💾 Persistent Storage Manager
class AccountStorage {
  private static readonly ACCOUNTS_KEY = 'skibidi_accounts';
  private static readonly ACTIVE_ACCOUNT_KEY = 'skibidi_active_account';

  static async saveAccounts(accounts: BitcoinAccount[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Failed to save accounts:', error);
    }
  }

  static async loadAccounts(): Promise<BitcoinAccount[]> {
    try {
      const accountsJson = await AsyncStorage.getItem(this.ACCOUNTS_KEY);
      if (accountsJson) {
        return JSON.parse(accountsJson);
      }
      return this.getDefaultAccounts();
    } catch (error) {
      console.error('Failed to load accounts:', error);
      return this.getDefaultAccounts();
    }
  }

  static async saveActiveAccount(accountId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACTIVE_ACCOUNT_KEY, accountId);
    } catch (error) {
      console.error('Failed to save active account:', error);
    }
  }

  static async loadActiveAccount(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.ACTIVE_ACCOUNT_KEY);
    } catch (error) {
      console.error('Failed to load active account:', error);
      return null;
    }
  }

  private static getDefaultAccounts(): BitcoinAccount[] {
    return [
      {
        id: '1',
        name: 'Main Sigma Wallet',
        ordinalsAddress: 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297',
        paymentsAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        balance: 250000,
        ordinalsBalance: 12,
        createdAt: Date.now() - 86400000,
        emoji: '🔥',
      },
      {
        id: '2',
        name: 'HODL Stack',
        ordinalsAddress: 'bc1p8k3lzx9jh2fq4rmw6s5nbl8vtghe9dxq4lt5ws8xn2hc6vf8ruskg9m3x',
        paymentsAddress: 'bc1qm34lsc65zpw79lxes69zkqmk6lucs9pxxn2jhu',
        balance: 1500000,
        ordinalsBalance: 45,
        createdAt: Date.now() - 172800000,
        emoji: '💎',
      },
      {
        id: '3',
        name: 'DCA Machine',
        ordinalsAddress: 'bc1p2v8rx3k9nc4hs7lm6q2w9xlr5ft6x8dx4lt9wp4zn5hx8ve3rusrq7k8m',
        paymentsAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7k2uhdaf',
        balance: 75000,
        ordinalsBalance: 3,
        createdAt: Date.now() - 259200000,
        emoji: '🚀',
      },
    ];
  }
}

// 🚽 Enhanced Button Component
interface SkibidiButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'chaos' | 'sigma' | 'small';
  style?: any;
  icon?: string;
}

function SkibidiButton({ title, onPress, variant = 'primary', style, icon }: SkibidiButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Vibration.vibrate([50, 30, 50]);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getButtonStyle = () => {
    const baseStyle = {
      paddingVertical: variant === 'small' ? 8 : 16,
      paddingHorizontal: variant === 'small' ? 12 : 24,
      borderRadius: variant === 'small' ? 8 : 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      elevation: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      borderWidth: variant === 'small' ? 1 : 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: SkibidiColors.skibidiOrange };
      case 'secondary':
        return { ...baseStyle, backgroundColor: SkibidiColors.toiletBlue };
      case 'chaos':
        return { ...baseStyle, backgroundColor: SkibidiColors.chaosRed };
      case 'sigma':
        return { ...baseStyle, backgroundColor: SkibidiColors.sigmaGold };
      case 'small':
        return { ...baseStyle, backgroundColor: SkibidiColors.midChaos };
      default:
        return { ...baseStyle, backgroundColor: SkibidiColors.skibidiOrange };
    }
  };

  return (
    <Animated.View style={[getButtonStyle(), { transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity onPress={handlePress} style={styles.buttonInner} activeOpacity={0.8}>
        <Text style={[styles.buttonText, { fontSize: variant === 'small' ? 12 : 14 }]}>
          {icon && `${icon} `}{title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 🏦 Account Selector Component
interface AccountSelectorProps {
  activeAccount: BitcoinAccount;
  onAccountPress: () => void;
}

function AccountSelector({ activeAccount, onAccountPress }: AccountSelectorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.accountSelector, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity onPress={onAccountPress} style={styles.accountButton}>
        <View style={styles.accountInfo}>
          <Text style={styles.accountEmoji}>{activeAccount.emoji}</Text>
          <Text style={styles.accountName}>{activeAccount.name}</Text>
          <Text style={styles.accountDropdownIcon}>⌄</Text>
        </View>
        <View style={styles.accountBalances}>
          <Text style={styles.accountBalance}>{activeAccount.balance.toLocaleString()} sats</Text>
          <Text style={styles.accountOrdinals}>{activeAccount.ordinalsBalance} ordinals</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 📱 Account Selection Modal
interface AccountModalProps {
  visible: boolean;
  accounts: BitcoinAccount[];
  activeAccount: BitcoinAccount;
  onClose: () => void;
  onSelectAccount: (account: BitcoinAccount) => void;
  onCreateAccount: () => void;
}

function AccountModal({ 
  visible, 
  accounts, 
  activeAccount, 
  onClose, 
  onSelectAccount, 
  onCreateAccount 
}: AccountModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🏦 Select Account</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.accountsList} showsVerticalScrollIndicator={false}>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountItem,
                  {
                    backgroundColor: account.id === activeAccount.id 
                      ? SkibidiColors.skibidiOrange + '40' 
                      : SkibidiColors.midChaos,
                    borderColor: account.id === activeAccount.id 
                      ? SkibidiColors.skibidiOrange 
                      : SkibidiColors.lightChaos,
                  }
                ]}
                onPress={() => {
                  onSelectAccount(account);
                  onClose();
                }}
              >
                <View style={styles.accountItemHeader}>
                  <Text style={styles.accountItemEmoji}>{account.emoji}</Text>
                  <Text style={styles.accountItemName}>{account.name}</Text>
                  {account.id === activeAccount.id && (
                    <Text style={styles.activeIndicator}>✓</Text>
                  )}
                </View>
                
                <View style={styles.accountItemDetails}>
                  <Text style={styles.accountItemBalance}>
                    💰 {account.balance.toLocaleString()} sats
                  </Text>
                  <Text style={styles.accountItemOrdinals}>
                    🎨 {account.ordinalsBalance} ordinals
                  </Text>
                </View>

                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Payments (SegWit):</Text>
                  <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                    {account.paymentsAddress}
                  </Text>
                  <Text style={styles.addressLabel}>Ordinals (Taproot):</Text>
                  <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                    {account.ordinalsAddress}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <SkibidiButton
              title="+ Create New Account"
              variant="primary"
              onPress={onCreateAccount}
              icon="🆕"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// 🆕 Create Account Modal
interface CreateAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateAccount: (name: string, emoji: string) => void;
}

function CreateAccountModal({ visible, onClose, onCreateAccount }: CreateAccountModalProps) {
  const [accountName, setAccountName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  
  const emojis = ['🔥', '💎', '🚀', '⚡', '🎮', '💰', '🦈', '🐊', '☕', '💃'];

  const handleCreate = () => {
    if (!accountName.trim()) {
      Alert.alert('❌ Name Required', 'Enter a name for your account, chief!');
      return;
    }
    
    onCreateAccount(accountName.trim(), selectedEmoji);
    setAccountName('');
    setSelectedEmoji('🔥');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createModalContent}>
          <Text style={styles.modalTitle}>🆕 Create New Account</Text>
          
          <Text style={styles.inputLabel}>Account Name:</Text>
          <TextInput
            style={styles.textInput}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="My Sigma Wallet"
            placeholderTextColor={SkibidiColors.textMuted}
            maxLength={20}
          />

          <Text style={styles.inputLabel}>Choose Emoji:</Text>
          <View style={styles.emojiGrid}>
            {emojis.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  { 
                    backgroundColor: emoji === selectedEmoji 
                      ? SkibidiColors.skibidiOrange + '40' 
                      : 'transparent' 
                  }
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.createModalActions}>
            <SkibidiButton
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.createActionButton}
            />
            <SkibidiButton
              title="Create"
              variant="primary"
              onPress={handleCreate}
              style={styles.createActionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 💫 Floating Particles Component (Reduced for performance)
function FloatingParticles() {
  const particles = Array.from({ length: 3 }, (_, i) => {
    const anim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const animateParticle = () => {
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 12000 + Math.random() * 6000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      };
      
      setTimeout(animateParticle, i * 2000);
    }, []);

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [height, -100],
    });

    const opacity = anim.interpolate({
      inputRange: [0, 0.1, 0.9, 1],
      outputRange: [0, 1, 1, 0],
    });

    const emojis = ['🚽', '⚡', '💎'];
    
    return (
      <Animated.Text
        key={i}
        style={[
          styles.particle,
          {
            transform: [{ translateY }],
            opacity,
            left: (i + 1) * (width / 4),
          },
        ]}
      >
        {emojis[i]}
      </Animated.Text>
    );
  });

  return <View style={styles.particleContainer}>{particles}</View>;
}

// 📱 Fixed Header Component
function FixedHeader() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });

  return (
    <View style={styles.fixedHeader}>
      <Animated.View style={[styles.headerContent, { transform: [{ rotate: rotation }] }]}>
        <Text style={styles.headerTitle}>🚽 SKIBIDI CASH 🚽</Text>
        <Text style={styles.headerSubtitle}>Where Bitcoin meets Brainrot</Text>
      </Animated.View>
      <View style={styles.headerUnderline} />
    </View>
  );
}

// 📋 Message Carousel Component (kept from previous version)
function MessageCarousel() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const messages = [
    "Diamond hands only - no paper hands allowed 🚫📄",
    "HODL like your life depends on it 💎",
    "Stack sats or stay broke 💰",
    "Bitcoin fixes this 🔧",
    "Not your keys, not your coins 🔑",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.messageCarousel}>
      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <Text style={styles.motivationText}>{messages[currentMessage]}</Text>
      </Animated.View>
    </View>
  );
}

// 🏠 Home Screen Content
function HomeContent({ activeAccount }: { activeAccount: BitcoinAccount }) {
  const balanceScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(balanceScaleAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(balanceScaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <SkibidiLoader />
      <FloatingParticles />
      
      {/* Balance Card */}
      <Animated.View style={[styles.balanceCard, { transform: [{ scale: balanceScaleAnim }] }]}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>💰 Your Bag 💰</Text>
        </View>
        <Text style={styles.balanceAmount}>{activeAccount.balance.toLocaleString()} sats</Text>
        <Text style={styles.balanceSubtext}>🎨 {activeAccount.ordinalsBalance} ordinals</Text>
        <View style={styles.balanceGlow} />
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <SkibidiButton
          title="SEND"
          variant="primary"
          onPress={() => Alert.alert('🚀 Send', 'Send functionality coming soon!')}
          style={styles.actionButton}
          icon="🚀"
        />
        <SkibidiButton
          title="RECEIVE"
          variant="secondary"
          onPress={() => Alert.alert('📱 Receive', 'Receive functionality coming soon!')}
          style={styles.actionButton}
          icon="📱"
        />
      </View>

      {/* Message Carousel */}
      <MessageCarousel />

      {/* Account Addresses */}
      <View style={styles.addressesContainer}>
        <Text style={styles.addressesTitle}>🔑 Your Addresses</Text>
        
        <View style={styles.addressItem}>
          <Text style={styles.addressType}>💰 Payments (Native SegWit)</Text>
          <Text style={styles.addressValue} numberOfLines={1} ellipsizeMode="middle">
            {activeAccount.paymentsAddress}
          </Text>
        </View>
        
        <View style={styles.addressItem}>
          <Text style={styles.addressType}>🎨 Ordinals (Taproot)</Text>
          <Text style={styles.addressValue} numberOfLines={1} ellipsizeMode="middle">
            {activeAccount.ordinalsAddress}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Other screen components remain the same...
function SwapContent() {
  return (
    <ScrollView style={styles.contentContainer}>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderEmoji}>🔄</Text>
        <Text style={styles.placeholderTitle}>Swap Coming Soon!</Text>
        <Text style={styles.placeholderText}>Multi-account swapping with ordinals support.</Text>
      </View>
    </ScrollView>
  );
}

function TransactionsContent() {
  return (
    <ScrollView style={styles.contentContainer}>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderEmoji}>📊</Text>
        <Text style={styles.placeholderTitle}>Transaction History</Text>
        <Text style={styles.placeholderText}>Track payments and ordinal transfers.</Text>
      </View>
    </ScrollView>
  );
}

function GameContent() {
  return (
    <ScrollView style={styles.contentContainer}>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderEmoji}>🎮</Text>
        <Text style={styles.placeholderTitle}>Skibidi Game</Text>
        <Text style={styles.placeholderText}>Game functionality here!</Text>
      </View>
    </ScrollView>
  );
}

// 📱 Bottom Navigation Component
interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

function BottomNavigation({ currentScreen, onNavigate }: BottomNavProps) {
  const tabs = [
    { id: 'home', title: 'Home', icon: '🏠' },
    { id: 'swap', title: 'Swap', icon: '🔄' },
    { id: 'transactions', title: 'History', icon: '📊' },
    { id: 'game', title: 'Game', icon: '🎮' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.navTab,
            {
              backgroundColor: currentScreen === tab.id 
                ? SkibidiColors.skibidiOrange + '40' 
                : 'transparent',
            },
          ]}
          onPress={() => {
            Vibration.vibrate(30);
            onNavigate(tab.id);
          }}
        >
          <Text style={styles.navIcon}>{tab.icon}</Text>
          <Text
            style={[
              styles.navText,
              {
                color: currentScreen === tab.id 
                  ? SkibidiColors.skibidiOrange 
                  : SkibidiColors.textMuted,
              },
            ]}
          >
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// 🎯 Main App Component
export default function App(): JSX.Element {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [accounts, setAccounts] = useState<BitcoinAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<BitcoinAccount | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      const loadedAccounts = await AccountStorage.loadAccounts();
      const activeAccountId = await AccountStorage.loadActiveAccount();
      
      setAccounts(loadedAccounts);
      
      if (activeAccountId) {
        const active = loadedAccounts.find(acc => acc.id === activeAccountId);
        setActiveAccount(active || loadedAccounts[0]);
      } else {
        setActiveAccount(loadedAccounts[0]);
      }
    } catch (error) {
      console.error('Failed to load account data:', error);
    }
  };

  const navigateToScreen = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleAccountSelect = async (account: BitcoinAccount) => {
    setActiveAccount(account);
    await AccountStorage.saveActiveAccount(account.id);
    Vibration.vibrate(50);
  };

  const handleCreateAccount = async (name: string, emoji: string) => {
    const newAccount = BitcoinAddressGenerator.createNewAccount(name, emoji);
    const updatedAccounts = [...accounts, newAccount];
    
    setAccounts(updatedAccounts);
    setActiveAccount(newAccount);
    
    await AccountStorage.saveAccounts(updatedAccounts);
    await AccountStorage.saveActiveAccount(newAccount.id);
    
    Vibration.vibrate([100, 50, 100]);
    Alert.alert('🎉 Account Created!', `${emoji} ${name} is ready for maximum chaos!`);
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
      
      {/* Fixed Header */}
      <FixedHeader />
      
      {/* Account Selector */}
      <AccountSelector 
        activeAccount={activeAccount}
        onAccountPress={() => setShowAccountModal(true)}
      />
      
      {/* Scrollable Content Area */}
      <View style={styles.contentArea}>
        {renderContent()}
      </View>
      
      {/* Fixed Bottom Navigation */}
      <BottomNavigation currentScreen={currentScreen} onNavigate={navigateToScreen} />

      {/* Account Selection Modal */}
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
      />

      {/* Create Account Modal */}
      <CreateAccountModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAccount={handleCreateAccount}
      />
    </SafeAreaView>
  );
}

// 🎨 Enhanced Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SkibidiColors.darkChaos,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
  },
  fixedHeader: {
    backgroundColor: SkibidiColors.darkChaos,
    borderBottomWidth: 2,
    borderBottomColor: SkibidiColors.skibidiOrange,
    paddingVertical: 15,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: SkibidiColors.textPrimary,
    textShadowColor: SkibidiColors.skibidiOrange,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: SkibidiColors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  headerUnderline: {
    width: 80,
    height: 2,
    backgroundColor: SkibidiColors.skibidiOrange,
    marginTop: 8,
    borderRadius: 1,
  },
  accountSelector: {
    backgroundColor: SkibidiColors.midChaos,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SkibidiColors.skibidiOrange + '60',
  },
  accountButton: {
    padding: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  accountName: {
    fontSize: 16,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  accountDropdownIcon: {
    fontSize: 12,
    color: SkibidiColors.textMuted,
  },
  accountBalances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountBalance: {
    fontSize: 12,
    color: SkibidiColors.crocodileGreen,
    fontWeight: '600',
  },
  accountOrdinals: {
    fontSize: 12,
    color: SkibidiColors.sigmaGold,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: SkibidiColors.midChaos,
    padding: 24,
    borderRadius: 20,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: SkibidiColors.skibidiOrange,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceHeader: {
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: SkibidiColors.textMuted,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: SkibidiColors.crocodileGreen,
    marginBottom: 8,
    textShadowColor: SkibidiColors.glowGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  balanceSubtext: {
    fontSize: 14,
    color: SkibidiColors.sigmaGold,
    textAlign: 'center',
    fontWeight: '700',
  },
  balanceGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SkibidiColors.glowOrange,
    opacity: 0.1,
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  messageCarousel: {
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 16,
    backgroundColor: SkibidiColors.midChaos,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SkibidiColors.sigmaGold + '40',
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  motivationText: {
    fontSize: 14,
    color: SkibidiColors.sigmaGold,
    textAlign: 'center',
    fontWeight: '700',
  },
  addressesContainer: {
    marginVertical: 20,
    padding: 16,
    backgroundColor: SkibidiColors.midChaos,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SkibidiColors.lightChaos,
  },
  addressesTitle: {
    fontSize: 16,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
    marginBottom: 12,
  },
  addressItem: {
    marginBottom: 12,
  },
  addressType: {
    fontSize: 12,
    color: SkibidiColors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 12,
    color: SkibidiColors.textMuted,
    fontFamily: 'monospace',
    backgroundColor: SkibidiColors.lightChaos,
    padding: 8,
    borderRadius: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: SkibidiColors.midChaos,
    borderTopWidth: 2,
    borderTopColor: SkibidiColors.skibidiOrange,
    paddingVertical: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: SkibidiColors.midChaos,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SkibidiColors.lightChaos,
  },
  modalTitle: {
    fontSize: 20,
    color: SkibidiColors.textPrimary,
    fontWeight: '900',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: SkibidiColors.textMuted,
    fontWeight: '700',
  },
  accountsList: {
    maxHeight: height * 0.5,
    paddingHorizontal: 20,
  },
  accountItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  accountItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountItemEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  accountItemName: {
    fontSize: 16,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  activeIndicator: {
    fontSize: 16,
    color: SkibidiColors.crocodileGreen,
    fontWeight: '900',
  },
  accountItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  accountItemBalance: {
    fontSize: 14,
    color: SkibidiColors.crocodileGreen,
    fontWeight: '600',
  },
  accountItemOrdinals: {
    fontSize: 14,
    color: SkibidiColors.sigmaGold,
    fontWeight: '600',
  },
  addressContainer: {
    backgroundColor: SkibidiColors.lightChaos,
    padding: 12,
    borderRadius: 8,
  },
  addressLabel: {
    fontSize: 10,
    color: SkibidiColors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 10,
    color: SkibidiColors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  modalActions: {
    padding: 20,
  },
  createModalContent: {
    backgroundColor: SkibidiColors.midChaos,
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: SkibidiColors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: SkibidiColors.lightChaos,
    borderRadius: 8,
    padding: 12,
    color: SkibidiColors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: SkibidiColors.skibidiOrange + '60',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: (width - 120) / 5,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  emojiText: {
    fontSize: 20,
  },
  createModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  createActionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  placeholderEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    color: SkibidiColors.textPrimary,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: SkibidiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: SkibidiColors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    fontSize: 16,
  },
});