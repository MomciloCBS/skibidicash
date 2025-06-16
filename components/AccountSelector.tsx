import { Easing, Text, TouchableOpacity } from "react-native";
import { Animated, View } from "react-native";
import { styles } from "../styles/AppStyles";
import { useEffect, useRef } from "react";
import { AccountSelectorProps } from "../types/account/AccountSelectorProps"; 

export function AccountSelector({ 
  activeAccount, 
  onAccountPress, 
  isLightningConnected = false 
}: AccountSelectorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lightningAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (isLightningConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lightningAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(lightningAnim, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      lightningAnim.setValue(0.2);
    }
  }, [isLightningConnected]);

  const getLightningStatusColor = () => {
    return isLightningConnected ? '#FFD700' : '#666666'; 
  };

  const getLightningStatusText = () => {
    return isLightningConnected ? '⚡' : '⚡'; 
  };

  return (
    <Animated.View style={[styles.accountSelector, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity onPress={onAccountPress} style={styles.accountButton}>
        <View style={styles.accountInfo}>
          <Text style={styles.accountEmoji}>{activeAccount.emoji}</Text>
          <View style={styles.accountNameContainer}>
            <Text style={styles.accountName}>{activeAccount.name}</Text>
            <View style={styles.lightningStatus}>
              <Animated.Text 
                style={[
                  styles.lightningIcon, 
                  { 
                    opacity: lightningAnim,
                    color: getLightningStatusColor()
                  }
                ]}
              >
                {getLightningStatusText()}
              </Animated.Text>
              <Text style={styles.lightningStatusText}>
                {isLightningConnected ? 'Lightning' : 'Offline'}
              </Text>
            </View>
          </View>
          <Text style={styles.accountDropdownIcon}>⌄</Text>
        </View>
        <View style={styles.accountBalances}>
          <Text style={styles.accountBalance}>
            {activeAccount.balance.toLocaleString()} sats
          </Text>
          <Text style={styles.accountOrdinals}>
            {activeAccount.ordinalsBalance} collectibles
          </Text>
          {isLightningConnected && (
            <Text style={styles.lightningBadge}>⚡ Ready for instant payments</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}