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
import skibidiFace from "../assets/skibidi-face.png";
import toiletPic from '../assets/toilet.png';

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
  autoRestart = false,
  animationDuration = 3000,
}) => {
  const rotationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const flashingColor = useRef(new Animated.Value(0)).current;
  const bouncingX = useRef(new Animated.Value(0)).current;
  const bouncingY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();

    // Flashing color
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashingColor, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(flashingColor, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Bouncing X
    Animated.loop(
      Animated.sequence([
        Animated.timing(bouncingX, {
          toValue: width - 280,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(bouncingX, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Bouncing Y
    Animated.loop(
      Animated.sequence([
        Animated.timing(bouncingY, {
          toValue: height - 120,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(bouncingY, {
          toValue: 40,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      rotationValue.stopAnimation();
      scaleValue.stopAnimation();
      opacityValue.stopAnimation();
    };
  }, []);

  const startAnimation = () => {
    rotationValue.setValue(0);
    scaleValue.setValue(1);
    opacityValue.setValue(1);

    Animated.loop(
      Animated.parallel([
        Animated.timing(rotationValue, {
          toValue: 360,
          duration: animationDuration,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleValue, {
              toValue: 0.1,
              duration: animationDuration * 0.4,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(opacityValue, {
              toValue: 0,
              duration: animationDuration * 0.4,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
          Animated.delay(animationDuration * 0.1),
          Animated.parallel([
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: animationDuration * 0.5,
              easing: Easing.out(Easing.elastic(1)),
              useNativeDriver: false,
            }),
            Animated.timing(opacityValue, {
              toValue: 1,
              duration: animationDuration * 0.5,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }),
          ]),
        ]),
      ])
    ).start();
  };

  const rotation = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const flashColor = flashingColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff00cc', '#00ffff'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <SimpleRipple />

      <View style={styles.toiletContainer}>
        <Image
          source={toiletImage || toiletPic}
          style={styles.toiletImage}
          resizeMode="contain"
        />
      </View>

      <Animated.View
        style={[
          styles.skibidiContainer,
          {
            transform: [
              { scale: scaleValue },
              { rotate: rotation },
            ],
            opacity: opacityValue,
          },
        ]}
      >
        <Image
          source={skibidiImage || skibidiFace}
          style={styles.skibidiImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.flashingText,
          {
            color: flashColor,
            transform: [
              { translateX: bouncingX },
              { translateY: bouncingY },
            ],
          },
        ]}
      >
        ⚡ CONNECTING TO LIGHTNING… THIS TAKES A RIDICULOUS AMOUNT OF TIME (~2 MINS) 💥🧻🌀
      </Animated.Text>
    </View>
  );
};

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
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  background: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    backgroundColor: '#111111',
    borderRadius: width,
  },
  ripple: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
  skibidiContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: height / 2 - 60,
    left: width / 2 - 60,
    width: 120,
    height: 120,
    zIndex: 3,
  },
  skibidiImage: {
    width: 120,
    height: 120,
  },
  flashingText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    width: 280,
    textAlign: 'center',
  },
});

export default SkibidiFlushSplash;
