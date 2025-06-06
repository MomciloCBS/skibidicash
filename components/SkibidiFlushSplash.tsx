import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  StyleSheet,
  ImageSourcePropType,
  Animated,
  Easing,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SkibidiFlushSplashProps {
  toiletImage?: ImageSourcePropType;
  skibidiImage?: ImageSourcePropType;
  onAnimationComplete?: () => void;
  autoRestart?: boolean;
  animationDuration?: number;
}

const SkibidiFlushSplash: React.FC<SkibidiFlushSplashProps> = ({
  toiletImage,
  skibidiImage,
  onAnimationComplete,
  autoRestart = false, // Default to false to avoid timing issues
  animationDuration = 3000,
}) => {
  // Simple animation values
  const rotationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const spiralValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Reset values
    rotationValue.setValue(0);
    scaleValue.setValue(1);
    opacityValue.setValue(1);
    spiralValue.setValue(0);

    // Simple rotation animation
    Animated.timing(rotationValue, {
      toValue: 360 * 3, // 3 rotations
      duration: animationDuration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Spiral animation (simple version)
    Animated.timing(spiralValue, {
      toValue: 1,
      duration: animationDuration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Scale animation - zoom towards camera
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 4, // Zoom IN dramatically (was 0.05 shrinking)
        duration: animationDuration * 0.8,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: animationDuration * 0.2,
        easing: Easing.bounce,
        useNativeDriver: false,
      }),
    ]).start((finished) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });

    // Opacity animation - fade in as it zooms towards camera
    Animated.sequence([
      Animated.timing(opacityValue, {
        toValue: 0.3, // Start more visible (was 0)
        duration: animationDuration * 0.1,
        useNativeDriver: false,
      }),
      Animated.timing(opacityValue, {
        toValue: 1, // Full opacity as it gets bigger
        duration: animationDuration * 0.7,
        useNativeDriver: false,
      }),
      Animated.timing(opacityValue, {
        toValue: 1, // Stay visible longer
        duration: animationDuration * 0.2,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Calculate position - keep centered for zoom effect
  const translateX = spiralValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0], // Stay centered (was [100, 0])
  });

  const translateY = spiralValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0], // Stay centered (was [-60, -10])
  });

  const rotation = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Simple Background */}
      <View style={styles.background} />
      
      {/* Simple Ripple Effect */}
      <SimpleRipple />
      
      {/* Toilet in center */}
      <View style={styles.toiletContainer}>
        {toiletImage ? (
          <Image source={toiletImage} style={styles.toiletImage} resizeMode="contain" />
        ) : (
          <Text style={styles.toiletEmoji}>🚽</Text>
        )}
      </View>

      {/* Skibidi head that gets flushed */}
      <Animated.View 
        style={[
          styles.skibidiContainer,
          {
            transform: [
              { translateX },
              { translateY },
              { scale: scaleValue },
              { rotate: rotation },
            ],
            opacity: opacityValue,
          }
        ]}
      >
        {skibidiImage ? (
          <Image source={skibidiImage} style={styles.skibidiImage} resizeMode="contain" />
        ) : (
          <Text style={styles.skibidiEmoji}>😈</Text>
        )}
      </Animated.View>

      {/* Title text */}
      {/* <View style={styles.titleContainer}>
        <Text style={styles.titleText}>SKIBIDI FLUSH</Text>
        <SimpleLoadingText />
      </View> */}
    </View>
  );
};

// Simple ripple component
const SimpleRipple: React.FC = () => {
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animateRipple = () => {
      rippleScale.setValue(0);
      rippleOpacity.setValue(0.6);

      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 2,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Restart animation
        setTimeout(animateRipple, 500);
      });
    };

    animateRipple();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.ripple,
        {
          transform: [{ scale: rippleScale }],
          opacity: rippleOpacity,
        }
      ]} 
    />
  );
};

// Simple loading text
const SimpleLoadingText: React.FC = () => {
  const [dots, setDots] = React.useState('...');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        switch(prev) {
          case '.': return '..';
          case '..': return '...';
          case '...': return '.';
          default: return '...';
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.subtitleText}>
      Loading{dots}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Changed to black
    zIndex: 1000, // Ensure it's on top
  },
  background: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    backgroundColor: '#111111', // Dark black/gray gradient effect
    borderRadius: width,
  },
  ripple: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)', // More visible on black background
    backgroundColor: 'transparent',
  },
  toiletContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  toiletImage: {
    width: 180,
    height: 220,
  },
  toiletEmoji: {
    fontSize: 180,
    lineHeight: 220,
  },
  skibidiContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  skibidiImage: {
    width: 120, // Made bigger (was 70)
    height: 120, // Made bigger (was 70)
  },
  skibidiEmoji: {
    fontSize: 120, // Made bigger (was 70)
    lineHeight: 140, // Adjusted line height
  },
  titleContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SkibidiFlushSplash;