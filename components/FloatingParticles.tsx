import { useEffect } from "react";

import { useRef } from "react";
import { Animated, Dimensions, Easing, View } from "react-native";
import { styles } from "../styles/AppStyles";

const { width, height } = Dimensions.get('window');

export function FloatingParticles() {
    const particles = Array.from({ length: 7 }, (_, i) => {
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
  
      const emojis = ['🚽', '🩰', '☕️', '💣', '🐊', '🦈', '🐦‍⬛'];
      
      return (
        <Animated.Text
          key={i}
          style={[
            styles.particle,
            {
              transform: [{ translateY }],
              opacity,
              left: (i + 1) * (width / 7),
            },
          ]}
        >
          {emojis[i]}
        </Animated.Text>
      );
    });
  
    return <View style={styles.particleContainer}>{particles}</View>;
  }