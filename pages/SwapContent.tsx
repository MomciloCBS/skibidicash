import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Alert, Image, Animated, Easing, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SwapContentProps } from '../types/content/ContentProps';
import { SkibidiButton } from '../components/SkibidiButton';
import { PaymentService } from '../services/PaymentService';

import tralalero from '../assets/tralalero.png';
import ballerina from '../assets/cappucina-ballerina.png';
import comingSoon from '../assets/coming-soon.png';

const { width } = Dimensions.get('window');

export function SwapContent({ 
  activeAccount, 
  walletInfo, 
  breezConnected, 
  onSendPayment, 
  onReceivePayment, 
  onUpdateBalance 
}: SwapContentProps) {
  const [isSwapping, setIsSwapping] = useState(false);

  // Animation values
  const spin = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flash, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleQuickSwap = async () => {
    if (!breezConnected) {
      Alert.alert('⚡ Not Connected', 'Lightning network required for swaps');
      return;
    }

    setIsSwapping(true);
    try {
      const invoice = await onReceivePayment(5000, 'Skibidi swap incoming!');
      Alert.alert('💱 Swap Ready', 'Share this invoice to complete the swap');
    } catch (error: any) {
      Alert.alert('❌ Swap Failed', error.message);
    } finally {
      setIsSwapping(false);
    }
  };

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const flashingColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff00cc', '#00ffff'],
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={styles.container}>
      {/* Banner */}
      <Animated.Text style={[styles.banner, { color: flashingColor }]}>
        🚨 SWAP MODE: BRAINROT ACTIVATED 🚨
      </Animated.Text>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Text style={{ color: breezConnected ? '#00FF00' : '#FF6B6B', fontSize: 16 }}>
          Status: {breezConnected ? '⚡ Lightning Ready' : '❌ Offline'}
        </Text>
        {walletInfo && (
          <Text style={{ color: 'white', marginTop: 4 }}>
            Balance: {PaymentService.formatAmount(walletInfo.balanceSat)}
          </Text>
        )}
      </View>

      {/* Meme carousel */}
      <View style={styles.memeRow}>
        <Animated.Image
          source={tralalero}
          style={[styles.memeImage, { transform: [{ rotate }] }]}
        />
        <Animated.Image
          source={ballerina}
          style={[styles.memeImage, { transform: [{ rotate }] }]}
        />
      </View>

      {/* Fake swap UI */}
      <View style={styles.swapPanel}>
        <Text style={styles.label}>From:</Text>
        <Text style={styles.fakeInput}>💩 $SKIBIDI</Text>

        <Text style={styles.label}>To:</Text>
        <Text style={styles.fakeInput}>🚽 $BOMBARIDO</Text>

        {/* <Image source={comingSoon} style={styles.comingSoon} /> */}
      </View>

      {/* Buttons */}
      <View style={{ width: '100%', marginTop: 30 }}>
        <SkibidiButton
          title={isSwapping ? "🔄 Swapping..." : "⚡ Quick Swap (coming soon)"}
          variant="primary"
          onPress={handleQuickSwap}
          disabled={!breezConnected || isSwapping}
        />
        <View style={{ marginVertical: 10 }} />
        <SkibidiButton
          title="🔁 Refresh Balance"
          variant="secondary"
          onPress={onUpdateBalance}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  banner: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  memeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    width: '90%',
  },
  memeImage: {
    width: 100,
    height: 100,
  },
  swapPanel: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ff8800',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  fakeInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#2a2a2a',
    width: '100%',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  comingSoon: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
    marginTop: 15,
  },
});
