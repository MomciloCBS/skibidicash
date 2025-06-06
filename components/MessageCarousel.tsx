import { useEffect, useRef, useState } from "react";    

import { Animated, View, Text } from "react-native";

import { styles } from "../styles/AppStyles";

export function MessageCarousel() {
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