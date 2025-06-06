import { Easing, Text, TouchableOpacity } from "react-native";

import { Animated, View } from "react-native";

import { styles } from "../styles/AppStyles";
import { useEffect } from "react";
import { useRef } from "react";
import { AccountSelectorProps } from "../types/account/AccountSelectorProps"; 

export function AccountSelector({ activeAccount, onAccountPress }: AccountSelectorProps) {
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
            <Text style={styles.accountOrdinals}>{activeAccount.ordinalsBalance} collectibles</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
}