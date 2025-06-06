import { useEffect, useRef } from "react";

import { Animated, Easing, View, Text } from "react-native";
import { styles } from "../styles/AppStyles";

export function FixedHeader() {
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