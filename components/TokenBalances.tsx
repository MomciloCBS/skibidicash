import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkibidiColors } from '../theme/SkibidiTheme';
import { WalletInfo } from '../services/BreezSDKService';
import { PaymentService } from '../services/PaymentService';

const { width } = Dimensions.get('window');

// 🪙 Token Interface
interface Token {
  id: string;
  symbol: string;
  name: string;
  type: 'BTC' | 'BRC-20' | 'RUNES' | 'ORDINALS' | 'LIGHTNING';
  balance: string; // String to handle large numbers and decimals
  decimals: number;
  usdValue?: number;
  change24h?: number;
  emoji: string;
  color: string;
  isNative?: boolean;
  isLightning?: boolean;
}

// 💾 Token Storage Manager
class TokenStorage {
  private static readonly TOKENS_KEY = 'skibidi_tokens';
  private static readonly HIDDEN_TOKENS_KEY = 'skibidi_hidden_tokens';

  static async saveTokens(accountId: string, tokens: Token[]): Promise<void> {
    try {
      const key = `${this.TOKENS_KEY}_${accountId}`;
      await AsyncStorage.setItem(key, JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  static async loadTokens(accountId: string): Promise<Token[]> {
    try {
      const key = `${this.TOKENS_KEY}_${accountId}`;
      const tokensJson = await AsyncStorage.getItem(key);
      if (tokensJson) {
        return JSON.parse(tokensJson);
      }
      return this.getDefaultTokens();
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return this.getDefaultTokens();
    }
  }

  static async saveHiddenTokens(accountId: string, hiddenIds: string[]): Promise<void> {
    try {
      const key = `${this.HIDDEN_TOKENS_KEY}_${accountId}`;
      await AsyncStorage.setItem(key, JSON.stringify(hiddenIds));
    } catch (error) {
      console.error('Failed to save hidden tokens:', error);
    }
  }

  static async loadHiddenTokens(accountId: string): Promise<string[]> {
    try {
      const key = `${this.HIDDEN_TOKENS_KEY}_${accountId}`;
      const hiddenJson = await AsyncStorage.getItem(key);
      return hiddenJson ? JSON.parse(hiddenJson) : [];
    } catch (error) {
      console.error('Failed to load hidden tokens:', error);
      return [];
    }
  }

  private static getDefaultTokens(): Token[] {
    return [
      {
        id: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'BTC',
        balance: '0.00842069',
        decimals: 8,
        usdValue: 42069.42,
        change24h: 4.20,
        emoji: '₿',
        color: SkibidiColors.skibidiOrange,
        isNative: true,
      },
      {
        id: 'ordi',
        symbol: 'ORDI',
        name: 'Ordinals',
        type: 'BRC-20',
        balance: '6969.420',
        decimals: 18,
        usdValue: 42.069,
        change24h: -1.23,
        emoji: '🟠',
        color: '#FF6B35',
      },
      {
        id: 'sats',
        symbol: 'SATS',
        name: 'Satoshis',
        type: 'BRC-20',
        balance: '100000000.69',
        decimals: 18,
        usdValue: 0.0042,
        change24h: 12.34,
        emoji: '⚡',
        color: '#FFD700',
      },
      {
        id: 'rats',
        symbol: 'RATS',
        name: 'Rats Protocol',
        type: 'BRC-20',
        balance: '420690.00',
        decimals: 18,
        usdValue: 0.069,
        change24h: -6.9,
        emoji: '🐀',
        color: '#8B4513',
      },
      {
        id: 'pepe',
        symbol: 'PEPE',
        name: 'Pepe Coin',
        type: 'RUNES',
        balance: '42069420.0',
        decimals: 8,
        usdValue: 0.000420,
        change24h: 69.42,
        emoji: '🐸',
        color: '#00FF00',
      },
      {
        id: 'doge',
        symbol: 'DOGE',
        name: 'Doge Rune',
        type: 'RUNES',
        balance: '1337.69',
        decimals: 8,
        usdValue: 0.42,
        change24h: 2.1,
        emoji: '🐕',
        color: '#C2A633',
      },
      {
        id: 'skibidi',
        symbol: 'SKBI',
        name: 'Skibidi Token',
        type: 'BRC-20',
        balance: '999999.42',
        decimals: 18,
        usdValue: 1.337,
        change24h: 420.69,
        emoji: '🚽',
        color: SkibidiColors.toiletBlue,
      },
    ];
  }

  static createLightningToken(walletInfo: WalletInfo): Token {
    return {
      id: 'lightning-btc',
      symbol: 'L-BTC',
      name: 'Lightning Bitcoin',
      type: 'LIGHTNING',
      balance: (walletInfo.balanceSat / 100000000).toFixed(8),
      decimals: 8,
      usdValue: 43000, // Assume same as BTC
      change24h: 2.5,
      emoji: '⚡',
      color: '#FFD700',
      isLightning: true,
      isNative: true,
    };
  }
}

// 💰 Individual Token Item Component
interface TokenItemProps {
  token: Token;
  onPress: () => void;
  onLongPress: () => void;
  isHidden?: boolean;
  isLightningConnected?: boolean;
}

function TokenItem({ 
  token, 
  onPress, 
  onLongPress, 
  isHidden = false,
  isLightningConnected = false 
}: TokenItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const lightningAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (token.isNative || token.isLightning) {
      // Subtle glow animation for BTC and Lightning
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    }

    // Lightning animation for Lightning tokens
    if (token.isLightning && isLightningConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lightningAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(lightningAnim, {
            toValue: 0.5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isLightningConnected]);

  const handlePress = () => {
    Vibration.vibrate(30);
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

  const getChangeColor = () => {
    if (!token.change24h) return SkibidiColors.textMuted;
    return token.change24h > 0 ? SkibidiColors.crocodileGreen : SkibidiColors.chaosRed;
  };

  const getChangeIcon = () => {
    if (!token.change24h) return '';
    return token.change24h > 0 ? '📈' : '📉';
  };

  const calculateUsdTotal = () => {
    if (!token.usdValue) return 0;
    return parseFloat(token.balance) * token.usdValue;
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const lightningOpacity = lightningAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View style={[
      styles.tokenItem,
      { 
        transform: [{ scale: scaleAnim }],
        borderColor: token.color,
        opacity: isHidden ? 0.5 : 1,
      }
    ]}>
      {(token.isNative || token.isLightning) && (
        <Animated.View 
          style={[
            styles.tokenGlow,
            { 
              backgroundColor: token.color,
              opacity: glowOpacity,
            }
          ]} 
        />
      )}

      {/* Lightning Status Indicator */}
      {token.isLightning && (
        <Animated.View 
          style={[
            styles.lightningIndicator,
            { opacity: isLightningConnected ? lightningOpacity : 0.3 }
          ]}
        >
          <Text style={styles.lightningBadgeText}>
            {isLightningConnected ? '⚡ LIVE' : '❌ OFFLINE'}
          </Text>
        </Animated.View>
      )}
      
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={() => {
          Vibration.vibrate(50);
          onLongPress();
        }}
        style={styles.tokenItemInner}
        activeOpacity={0.8}
      >
        <View style={styles.tokenHeader}>
          <View style={styles.tokenInfo}>
            <View style={styles.tokenTitleRow}>
              <Text style={styles.tokenEmoji}>{token.emoji}</Text>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
              <View style={[styles.tokenTypeBadge, { backgroundColor: token.color + '40' }]}>
                <Text style={[styles.tokenType, { color: token.color }]}>
                  {token.type}
                </Text>
              </View>
              {token.isLightning && (
                <View style={styles.lightningBadge}>
                  <Text style={styles.lightningBadgeText}>⚡</Text>
                </View>
              )}
            </View>
            <Text style={styles.tokenName}>{token.name}</Text>
          </View>
          
          <View style={styles.tokenValues}>
            <Text style={styles.tokenBalance}>
              {token.isLightning 
                ? PaymentService.formatAmount(Math.floor(parseFloat(token.balance) * 100000000))
                : token.balance
              }
            </Text>
            {token.usdValue && (
              <Text style={styles.tokenUsdValue}>
                ${calculateUsdTotal().toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
            )}
          </View>
        </View>

        {token.change24h !== undefined && (
          <View style={styles.tokenFooter}>
            <Text style={[styles.tokenChange, { color: getChangeColor() }]}>
              {getChangeIcon()} {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}% (24h)
            </Text>
            {token.usdValue && (
              <Text style={styles.tokenPrice}>
                ${token.usdValue.toLocaleString(undefined, { maximumFractionDigits: 8 })}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// 📊 Portfolio Summary Component
interface PortfolioSummaryProps {
  tokens: Token[];
  hiddenTokens: string[];
  lightningBalance?: number;
}

function PortfolioSummary({ 
  tokens, 
  hiddenTokens, 
  lightningBalance = 0 
}: PortfolioSummaryProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const visibleTokens = tokens.filter(token => !hiddenTokens.includes(token.id));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.01,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const calculateTotalValue = () => {
    let total = visibleTokens.reduce((total, token) => {
      if (token.usdValue && !token.isLightning) {
        return total + (parseFloat(token.balance) * token.usdValue);
      }
      return total;
    }, 0);

    // Add Lightning balance value
    if (lightningBalance > 0) {
      total += (lightningBalance / 100000000) * 43000; // Assume $43k BTC price
    }

    return total;
  };

  const calculateTotalChange = () => {
    const totalValue = calculateTotalValue();
    if (totalValue === 0) return 0;
    
    const weightedChange = visibleTokens.reduce((total, token) => {
      if (token.usdValue && token.change24h !== undefined && !token.isLightning) {
        const tokenValue = parseFloat(token.balance) * token.usdValue;
        const weight = tokenValue / totalValue;
        return total + (token.change24h * weight);
      }
      return total;
    }, 0);
    
    return weightedChange;
  };

  const totalValue = calculateTotalValue();
  const totalChange = calculateTotalChange();

  return (
    <Animated.View style={[styles.portfolioSummary, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.portfolioHeader}>
        <Text style={styles.portfolioTitle}>💼 Total Portfolio Value</Text>
      </View>
      
      <Text style={styles.portfolioValue}>
        ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </Text>
      
      <View style={styles.portfolioChange}>
        <Text style={[
          styles.portfolioChangeText,
          { color: totalChange >= 0 ? SkibidiColors.crocodileGreen : SkibidiColors.chaosRed }
        ]}>
          {totalChange >= 0 ? '📈' : '📉'} {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% (24h)
        </Text>
      </View>
      
      <View style={styles.portfolioStats}>
        <View style={styles.portfolioStat}>
          <Text style={styles.portfolioStatLabel}>🪙 Assets</Text>
          <Text style={styles.portfolioStatValue}>{visibleTokens.length}</Text>
        </View>
        <View style={styles.portfolioStat}>
          <Text style={styles.portfolioStatLabel}>⚡ Lightning</Text>
          <Text style={styles.portfolioStatValue}>
            {lightningBalance > 0 ? PaymentService.formatAmount(lightningBalance) : '0 sats'}
          </Text>
        </View>
        <View style={styles.portfolioStat}>
          <Text style={styles.portfolioStatLabel}>👁️ Hidden</Text>
          <Text style={styles.portfolioStatValue}>{hiddenTokens.length}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// 🔍 Token Filter Component
interface TokenFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  tokenCounts: { [key: string]: number };
}

function TokenFilter({ activeFilter, onFilterChange, tokenCounts }: TokenFilterProps) {
  const filters = [
    { id: 'ALL', label: 'All', emoji: '🔥', count: tokenCounts.ALL || 0 },
    { id: 'LIGHTNING', label: 'Lightning', emoji: '⚡', count: tokenCounts.LIGHTNING || 0 },
    { id: 'BTC', label: 'Bitcoin', emoji: '₿', count: tokenCounts.BTC || 0 },
    { id: 'BRC-20', label: 'BRC-20', emoji: '🟠', count: tokenCounts['BRC-20'] || 0 },
    { id: 'RUNES', label: 'Runes', emoji: '🪄', count: tokenCounts.RUNES || 0 },
    { id: 'ORDINALS', label: 'Ordinals', emoji: '🎨', count: tokenCounts.ORDINALS || 0 },
  ];

  return (
    <View style={styles.tokenFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilter === filter.id 
                  ? SkibidiColors.skibidiOrange + '40' 
                  : SkibidiColors.midChaos,
                borderColor: activeFilter === filter.id 
                  ? SkibidiColors.skibidiOrange 
                  : SkibidiColors.lightChaos,
              }
            ]}
            onPress={() => {
              Vibration.vibrate(30);
              onFilterChange(filter.id);
            }}
          >
            <Text style={styles.filterEmoji}>{filter.emoji}</Text>
            <Text style={[
              styles.filterLabel,
              { color: activeFilter === filter.id ? SkibidiColors.skibidiOrange : SkibidiColors.textMuted }
            ]}>
              {filter.label}
            </Text>
            <Text style={styles.filterCount}>({filter.count})</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// 🚽 Main Token Balances Component
interface TokenBalancesProps {
  accountId: string;
  ordinalsBalance: number;
  walletInfo?: WalletInfo | null;
  breezConnected?: boolean;
}

export function TokenBalances({ 
  accountId, 
  ordinalsBalance, 
  walletInfo,
  breezConnected = false 
}: TokenBalancesProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [hiddenTokens, setHiddenTokens] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokenData();
  }, [accountId]);

  useEffect(() => {
    // Update tokens when Lightning connection or wallet info changes
    updateTokensWithLightning();
  }, [walletInfo, breezConnected]);

  const loadTokenData = async () => {
    setLoading(true);
    try {
      const [loadedTokens, loadedHidden] = await Promise.all([
        TokenStorage.loadTokens(accountId),
        TokenStorage.loadHiddenTokens(accountId),
      ]);
      
      setTokens(loadedTokens);
      setHiddenTokens(loadedHidden);
    } catch (error) {
      console.error('Failed to load token data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTokensWithLightning = async () => {
    if (!walletInfo) return;

    try {
      const currentTokens = await TokenStorage.loadTokens(accountId);
      
      // Remove existing Lightning token
      const filteredTokens = currentTokens.filter(token => !token.isLightning);
      
      // Add new Lightning token if connected
      if (breezConnected && walletInfo.balanceSat > 0) {
        const lightningToken = TokenStorage.createLightningToken(walletInfo);
        filteredTokens.unshift(lightningToken); // Add to beginning
      }
      
      setTokens(filteredTokens);
      await TokenStorage.saveTokens(accountId, filteredTokens);
    } catch (error) {
      console.error('Failed to update Lightning tokens:', error);
    }
  };

  const getFilteredTokens = () => {
    let filtered = tokens;
    
    if (activeFilter !== 'ALL') {
      filtered = tokens.filter(token => token.type === activeFilter);
    }
    
    // Always show Lightning and BTC first if they're in the filtered results
    const lightningToken = filtered.find(token => token.isLightning);
    const btcToken = filtered.find(token => token.isNative && !token.isLightning);
    const otherTokens = filtered.filter(token => !token.isNative && !token.isLightning);
    
    const sortedTokens = [];
    if (lightningToken) sortedTokens.push(lightningToken);
    if (btcToken) sortedTokens.push(btcToken);
    sortedTokens.push(...otherTokens);
    
    return sortedTokens;
  };

  const getTokenCounts = () => {
    const counts: { [key: string]: number } = {
      ALL: tokens.length,
      LIGHTNING: tokens.filter(token => token.type === 'LIGHTNING').length,
      BTC: tokens.filter(token => token.type === 'BTC').length,
      'BRC-20': tokens.filter(token => token.type === 'BRC-20').length,
      RUNES: tokens.filter(token => token.type === 'RUNES').length,
      ORDINALS: ordinalsBalance,
    };
    return counts;
  };

  const handleTokenPress = (token: Token) => {
    let balanceDisplay = token.balance;
    let valueDisplay = token.usdValue ? `$${(parseFloat(token.balance) * token.usdValue).toLocaleString()}` : 'No price data';
    
    if (token.isLightning) {
      balanceDisplay = PaymentService.formatAmount(Math.floor(parseFloat(token.balance) * 100000000));
      valueDisplay = `$${(walletInfo!.balanceSat / 100000000 * 43000).toLocaleString()}`;
    }

    const statusText = token.isLightning 
      ? `\nStatus: ${breezConnected ? '⚡ Connected' : '❌ Offline'}`
      : '';

    Alert.alert(
      `${token.emoji} ${token.name}`,
      `Balance: ${balanceDisplay}\nValue: ${valueDisplay}${statusText}`,
      [
        { text: 'Send', onPress: () => Alert.alert('🚀 Send', 'Send functionality available in main app!') },
        { text: 'Receive', onPress: () => Alert.alert('📱 Receive', 'Receive functionality available in main app!') },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleTokenLongPress = (token: Token) => {
    if (token.isNative || token.isLightning) {
      Alert.alert('🚫 Cannot Hide', 'Cannot hide native Bitcoin or Lightning balance!');
      return;
    }

    const isHidden = hiddenTokens.includes(token.id);
    Alert.alert(
      `${token.emoji} ${token.name}`,
      `Do you want to ${isHidden ? 'show' : 'hide'} this token?`,
      [
        {
          text: isHidden ? 'Show Token' : 'Hide Token',
          onPress: async () => {
            const newHidden = isHidden 
              ? hiddenTokens.filter(id => id !== token.id)
              : [...hiddenTokens, token.id];
            
            setHiddenTokens(newHidden);
            await TokenStorage.saveHiddenTokens(accountId, newHidden);
            Vibration.vibrate(50);
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const filteredTokens = getFilteredTokens();
  const tokenCounts = getTokenCounts();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🚽 Loading your bag...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <TokenFilter 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        tokenCounts={tokenCounts}
      />

      <ScrollView style={styles.tokensList} showsVerticalScrollIndicator={false}>
        {filteredTokens.map((token) => (
          <TokenItem
            key={token.id}
            token={token}
            onPress={() => handleTokenPress(token)}
            onLongPress={() => handleTokenLongPress(token)}
            isHidden={hiddenTokens.includes(token.id)}
            isLightningConnected={breezConnected}
          />
        ))}
        
        {filteredTokens.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🫗</Text>
            <Text style={styles.emptyTitle}>No tokens found</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'LIGHTNING' && !breezConnected 
                ? 'Connect to Lightning Network to see Lightning balance'
                : 'Try changing the filter or add some tokens!'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
  },
  portfolioSummary: {
    backgroundColor: SkibidiColors.midChaos,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: SkibidiColors.skibidiOrange,
    alignItems: 'center',
  },
  portfolioHeader: {
    marginBottom: 12,
  },
  portfolioTitle: {
    fontSize: 16,
    color: SkibidiColors.textSecondary,
    fontWeight: '600',
  },
  portfolioValue: {
    fontSize: 28,
    color: SkibidiColors.crocodileGreen,
    fontWeight: '900',
    marginBottom: 8,
    textShadowColor: SkibidiColors.glowGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  portfolioChange: {
    marginBottom: 16,
  },
  portfolioChangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  portfolioStat: {
    alignItems: 'center',
  },
  portfolioStatLabel: {
    fontSize: 12,
    color: SkibidiColors.textMuted,
    fontWeight: '600',
  },
  portfolioStatValue: {
    fontSize: 16,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
    marginTop: 4,
  },
  tokenFilter: {
    marginVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  filterCount: {
    fontSize: 10,
    color: SkibidiColors.textMuted,
    fontWeight: '500',
  },
  tokensList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tokenItem: {
    backgroundColor: SkibidiColors.midChaos,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  tokenGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  lightningIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  lightningBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#000000',
  },
  tokenItemInner: {
    padding: 16,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  tokenSymbol: {
    fontSize: 16,
    color: SkibidiColors.textPrimary,
    fontWeight: '800',
    marginRight: 8,
  },
  tokenTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  tokenType: {
    fontSize: 8,
    fontWeight: '700',
  },
  lightningBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tokenName: {
    fontSize: 12,
    color: SkibidiColors.textMuted,
    fontWeight: '500',
  },
  tokenValues: {
    alignItems: 'flex-end',
  },
  tokenBalance: {
    fontSize: 16,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  tokenUsdValue: {
    fontSize: 12,
    color: SkibidiColors.crocodileGreen,
    fontWeight: '600',
  },
  tokenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  tokenPrice: {
    fontSize: 10,
    color: SkibidiColors.textMuted,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: SkibidiColors.textPrimary,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: SkibidiColors.textMuted,
    textAlign: 'center',
  },
});

export default TokenBalances;