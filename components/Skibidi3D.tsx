import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Skibidi3DScene from './Skibidi3DScreen';
import { SkibidiColors } from '../theme/SkibidiTheme';

const { width, height } = Dimensions.get('window');

interface Skibidi3DProps {
  spinSpeed: number;
  onPress: (event: any) => void;
  clickPosition: { x: number; y: number } | null;
}

export function Skibidi3D({ spinSpeed, onPress, clickPosition }: Skibidi3DProps) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const [currentRotationSpeed, setCurrentRotationSpeed] = useState(0.02);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Update rotation speed based on spinSpeed prop
  useEffect(() => {
    const baseSpeed = 0.02;
    const newSpeed = baseSpeed + (spinSpeed * 0.05); // Convert spinSpeed to Three.js rotation speed
    setCurrentRotationSpeed(newSpeed);
  }, [spinSpeed]);

  const handlePress = (event: any) => {
    // Bounce animation on press
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 300,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    onPress(event);
  };

  const handleModelLoaded = () => {
    console.log('🎯 Skibidi model loaded successfully!');
    setIsModelLoaded(true);
  };

  const handleModelError = (error: string) => {
    console.error('💀 Skibidi model failed to load:', error);
    // You could show a fallback here if needed
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.8}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.sceneContainer,
          {
            transform: [{ scale: bounceAnim }],
          },
        ]}
      >
        <Skibidi3DScene
          glbUrl="https://files.catbox.moe/da1exr.glb"
          modelScale={2.5}
          rotationSpeed={currentRotationSpeed}
          backgroundColor="transparent"
          onModelLoaded={handleModelLoaded}
          onModelError={handleModelError}
        />
        
        {/* Click feedback overlay */}
        {clickPosition && (
          <View style={styles.clickOverlay}>
            <View 
              style={[
                styles.clickRipple,
                {
                  left: clickPosition.x - 30,
                  top: clickPosition.y - 30,
                }
              ]} 
            />
          </View>
        )}
        
        {/* Glow effect when spinning fast */}
        {spinSpeed > 2 && (
          <View style={styles.speedGlow} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 125,
    overflow: 'hidden',
    position: 'relative',
  },
  clickOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  clickRipple: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: SkibidiColors.skibidiOrange + '60',
    borderWidth: 2,
    borderColor: SkibidiColors.skibidiOrange,
  },
  speedGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 135,
    backgroundColor: SkibidiColors.glowOrange || SkibidiColors.skibidiOrange,
    opacity: 0.3,
    pointerEvents: 'none',
  },
});