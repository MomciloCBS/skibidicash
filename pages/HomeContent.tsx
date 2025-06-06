import { ScrollView } from "react-native";

import { useRef } from "react";

import { useEffect } from "react";
import { Animated, Easing } from "react-native";
import { BitcoinAccount } from "../types/account/BitcoinAccount";
import { styles } from "../styles/AppStyles";
import { FloatingParticles } from "../components/FloatingParticles";
import AnimatedBalanceCard from "../components/AnimatedBalanceCard";
import FlashingActionButtons from "../components/FlashingActionButtons";
import { MessageCarousel } from "../components/MessageCarousel";
import { TokenBalances } from "../components/TokenBalances";

export function HomeContent({ activeAccount }: { activeAccount: BitcoinAccount }) {
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
          
          <FloatingParticles />
          
          <AnimatedBalanceCard 
            satoshiBalance={activeAccount.balance}
            ordinalsBalance={activeAccount.ordinalsBalance}
          />
  
          <FlashingActionButtons />
          <MessageCarousel />
  
          <TokenBalances accountId={activeAccount.id} ordinalsBalance={activeAccount.ordinalsBalance} />
        </ScrollView>
    );
  }