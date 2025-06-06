// components/PointAnimation.tsx
import React, { useRef, useEffect } from 'react';
import {
  Text,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';

interface PointAnimationProps {
  points: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export function PointAnimation({ points, x, y, onComplete }: PointAnimationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Random meme styling for maximum chaos
  const memeStyles = [
    { fontSize: 24, fontWeight: '900' as const, color: '#FF6B35' },
    { fontSize: 32, fontWeight: '100' as const, color: '#F7931E' },
    { fontSize: 28, fontWeight: '700' as const, color: '#FFD23F' },
    { fontSize: 36, fontWeight: '300' as const, color: '#06FFA5' },
    { fontSize: 20, fontWeight: '800' as const, color: '#C70039' },
    { fontSize: 30, fontWeight: '400' as const, color: '#900C3F' },
    { fontSize: 26, fontWeight: '600' as const, color: '#581845' },
    { fontSize: 38, fontWeight: '200' as const, color: '#FF0080' },
    { fontSize: 22, fontWeight: '500' as const, color: '#00FF80' },
    { fontSize: 34, fontWeight: 'bold' as const, color: '#8000FF' },
  ];

  const randomStyle = memeStyles[Math.floor(Math.random() * memeStyles.length)];

  // Random meme text additions for extra chaos
  const memeTexts = [
    '🔥', '💯', '⚡', '💎', '🚀', '🎯', '✨', '💥', '🌟', '🎉'
  ];
  const randomMemeText = memeTexts[Math.floor(Math.random() * memeTexts.length)];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 300,
          easing: Easing.elastic(2),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(onComplete);
    });
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.pointAnimation,
        {
          left: x - 20,
          top: y - 20,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
            { rotate: rotation },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.pointText, randomStyle]}>
        +{points} {randomMemeText}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pointAnimation: {
    position: 'absolute',
    zIndex: 1000,
  },
  pointText: {
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});