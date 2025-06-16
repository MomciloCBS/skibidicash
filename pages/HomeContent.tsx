import { ScrollView, View, Text, Alert } from "react-native";
import { useRef, useEffect, useState } from "react";
import { Animated, Easing } from "react-native";
import { styles } from "../styles/AppStyles";
import { FloatingParticles } from "../components/FloatingParticles";
import AnimatedBalanceCard from "../components/AnimatedBalanceCard";
import FlashingActionButtons from "../components/FlashingActionButtons";
import { MessageCarousel } from "../components/MessageCarousel";
import { TokenBalances } from "../components/TokenBalances";
import { PaymentService } from "../services/PaymentService";
import { 
  BaseContentProps, 
  HomeContentProps, 
  SwapContentProps, 
  TransactionsContentProps, 
  GameContentProps 
} from '../types/content/ContentProps';

export function HomeContent({ 
  activeAccount, 
  walletInfo, 
  breezConnected, 
  onSendPayment, 
  onReceivePayment, 
  onUpdateBalance,
  onGetTestCoins 
}: HomeContentProps) {
  const balanceScaleAnim = useRef(new Animated.Value(1)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await onUpdateBalance();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickSend = () => {
    if (!breezConnected) {
      Alert.alert(
        '⚡ Lightning Required',
        'Connect to Lightning Network to send payments',
        [
          { text: 'OK' },
          { text: 'Retry Connection', onPress: onUpdateBalance }
        ]
      );
      return;
    }

    Alert.prompt(
      '⚡ Quick Send',
      'Enter Lightning invoice, address, or Lightning address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (destination) => {
            if (destination?.trim()) {
              try {
                await onSendPayment(destination.trim());
              } catch (error) {
                // Error handling is done in the parent function
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleQuickReceive = () => {
    if (!breezConnected) {
      Alert.alert(
        '⚡ Lightning Required',
        'Connect to Lightning Network to receive payments',
        [
          { text: 'OK' },
          { text: 'Retry Connection', onPress: onUpdateBalance }
        ]
      );
      return;
    }

    Alert.prompt(
      '💰 Quick Receive',
      'Enter amount in sats:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Invoice',
          onPress: async (amountStr) => {
            const amount = parseInt(amountStr || '1000');
            if (amount > 0) {
              try {
                await onReceivePayment(amount, 'Skibidi Cash payment 🚽⚡');
              } catch (error) {
                // Error handling is done in the parent function
              }
            }
          }
        }
      ],
      'plain-text',
      '1000',
      'default'
    );
  };

  // Use real Lightning balance if available, otherwise fall back to account balance
  const displayBalance = walletInfo?.balanceSat ?? activeAccount.balance;
  const pendingReceive = walletInfo?.pendingReceiveSat ?? 0;
  const pendingSend = walletInfo?.pendingSendSat ?? 0;

  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <FloatingParticles />
      
      {/* Lightning Connection Status */}
      <View style={styles.connectionStatus}>
        <Text style={[
          styles.connectionStatusText,
          { color: breezConnected ? '#00FF88' : '#FF6B6B' }
        ]}>
          {breezConnected ? '⚡ Lightning Ready' : '❌ Lightning Offline'}
        </Text>
        {!breezConnected && (
          <Text style={styles.connectionSubtext}>
            Limited functionality without Lightning
          </Text>
        )}
      </View>

      <AnimatedBalanceCard 
        satoshiBalance={displayBalance}
        ordinalsBalance={activeAccount.ordinalsBalance}
        isLightningBalance={breezConnected}
        pendingReceive={pendingReceive}
        pendingSend={pendingSend}
        onRefresh={handleRefreshBalance}
        isRefreshing={isRefreshing}
      />

      <FlashingActionButtons 
        onSend={handleQuickSend}
        onReceive={handleQuickReceive}
        onGetTestCoins={onGetTestCoins}
        isLightningConnected={breezConnected}
      />
      
      <MessageCarousel />

      <TokenBalances 
        accountId={activeAccount.id} 
        ordinalsBalance={activeAccount.ordinalsBalance}
        walletInfo={walletInfo}
        breezConnected={breezConnected}
      />

      {/* Quick Stats */}
      {walletInfo && (
        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>⚡ Lightning Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>
                {PaymentService.formatAmount(walletInfo.balanceSat)}
              </Text>
            </View>
            {pendingReceive > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Incoming</Text>
                <Text style={[styles.statValue, { color: '#00FF88' }]}>
                  +{PaymentService.formatAmount(pendingReceive)}
                </Text>
              </View>
            )}
            {pendingSend > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Outgoing</Text>
                <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                  -{PaymentService.formatAmount(pendingSend)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}