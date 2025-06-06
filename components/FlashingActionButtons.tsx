import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Alert,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface FlashingButtonProps {
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  flashColor: string;
  flashSpeed?: number; // milliseconds
  alternateColor?: string; // for swap button
  iconAnimation?: 'rotate' | 'bounce' | 'shake' | 'move'; // Animation type
}

const FlashingButton: React.FC<FlashingButtonProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  flashColor,
  flashSpeed = 1000,
  alternateColor,
  iconAnimation,
}) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Icon animation values
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const iconBounceAnim = useRef(new Animated.Value(0)).current;
  const iconShakeAnim = useRef(new Animated.Value(0)).current;
  const iconMoveX = useRef(new Animated.Value(0)).current;
  const iconMoveY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startFlashing = () => {
      if (alternateColor) {
        // Swap button: alternate between two colors rapidly
        Animated.loop(
          Animated.sequence([
            Animated.timing(flashAnim, {
              toValue: 1,
              duration: flashSpeed / 4, // Much faster for swap
              useNativeDriver: false,
            }),
            Animated.timing(flashAnim, {
              toValue: 0,
              duration: flashSpeed / 4,
              useNativeDriver: false,
            }),
          ])
        ).start();
      } else {
        // Regular buttons: flash single color
        Animated.loop(
          Animated.sequence([
            Animated.timing(flashAnim, {
              toValue: 1,
              duration: flashSpeed / 2,
              useNativeDriver: false,
            }),
            Animated.timing(flashAnim, {
              toValue: 0,
              duration: flashSpeed / 2,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    };

    const startIconAnimation = () => {
      switch (iconAnimation) {
        case 'rotate':
          // Continuous rotation for swap icon
          Animated.loop(
            Animated.timing(iconRotateAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            })
          ).start();
          break;
          
        case 'bounce':
          // Bouncing for receive arrow
          Animated.loop(
            Animated.sequence([
              Animated.timing(iconBounceAnim, {
                toValue: -8,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(iconBounceAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
              }),
            ])
          ).start();
          break;
          
        case 'shake':
          // Shaking for cash bag
          Animated.loop(
            Animated.sequence([
              Animated.timing(iconShakeAnim, {
                toValue: 3,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(iconShakeAnim, {
                toValue: -3,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(iconShakeAnim, {
                toValue: 2,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(iconShakeAnim, {
                toValue: -2,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(iconShakeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          ).start();
          break;
          
        case 'move':
          // Moving rocket that bounces off walls
          const moveSequence = () => {
            Animated.sequence([
              // Move right and down
              Animated.parallel([
                Animated.timing(iconMoveX, {
                  toValue: 15,
                  duration: 800,
                  useNativeDriver: true,
                }),
                Animated.timing(iconMoveY, {
                  toValue: 8,
                  duration: 800,
                  useNativeDriver: true,
                }),
              ]),
              // Move left and up
              Animated.parallel([
                Animated.timing(iconMoveX, {
                  toValue: -15,
                  duration: 800,
                  useNativeDriver: true,
                }),
                Animated.timing(iconMoveY, {
                  toValue: -8,
                  duration: 800,
                  useNativeDriver: true,
                }),
              ]),
              // Move right and down again
              Animated.parallel([
                Animated.timing(iconMoveX, {
                  toValue: 10,
                  duration: 600,
                  useNativeDriver: true,
                }),
                Animated.timing(iconMoveY, {
                  toValue: 5,
                  duration: 600,
                  useNativeDriver: true,
                }),
              ]),
              // Return to center
              Animated.parallel([
                Animated.timing(iconMoveX, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }),
                Animated.timing(iconMoveY, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]),
            ]).start(() => moveSequence()); // Loop infinitely
          };
          moveSequence();
          break;
      }
    };

    startFlashing();
    if (iconAnimation) {
      startIconAnimation();
    }
  }, []);

  const handlePress = () => {
    Vibration.vibrate([50, 30, 50]);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  // Calculate border color based on animation
  const borderColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: alternateColor 
      ? ['rgba(255, 255, 255, 0.3)', flashColor] // Swap: white to green, then will cycle to red
      : ['rgba(255, 255, 255, 0.3)', flashColor], // Others: white to their color
  });

  // For swap button, alternate between green and red
  const swapBorderColor = alternateColor ? flashAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255, 255, 255, 0.3)', flashColor, alternateColor],
  }) : borderColor;

  // Calculate icon transform based on animation type
  const getIconTransform = () => {
    const transforms: any[] = [];
    
    switch (iconAnimation) {
      case 'rotate':
        const rotation = iconRotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });
        transforms.push({ rotate: rotation });
        break;
        
      case 'bounce':
        transforms.push({ translateY: iconBounceAnim });
        break;
        
      case 'shake':
        transforms.push({ translateX: iconShakeAnim });
        break;
        
      case 'move':
        transforms.push({ translateX: iconMoveX });
        transforms.push({ translateY: iconMoveY });
        break;
    }
    
    return transforms;
  };

  return (
    <Animated.View 
      style={[
        styles.buttonContainer,
        { 
          transform: [{ scale: scaleAnim }],
          borderColor: alternateColor ? swapBorderColor : borderColor,
        }
      ]}
    >
      <TouchableOpacity onPress={handlePress} style={styles.buttonInner}>
        <Animated.Text 
          style={[
            styles.buttonIcon,
            { transform: getIconTransform() }
          ]}
        >
          {icon}
        </Animated.Text>
        <Text style={styles.buttonTitle}>{title}</Text>
        {subtitle && <Text style={styles.buttonSubtitle}>{subtitle}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main action buttons component
const FlashingActionButtons: React.FC = () => {
  return (
    <View style={styles.actionButtonsContainer}>
      <View style={styles.actionButtonsRow}>
        <FlashingButton
          title="CASH"
          icon="💰"
          onPress={() => Alert.alert('💰 Cash', 'Cash functionality coming soon!')}
          flashColor="rgba(255, 215, 0, 0.8)" // Golden
          flashSpeed={1000}
          iconAnimation="shake" // Shaking cash bag
        />
        
        <FlashingButton
          title="RECEIVE"
          icon="⬇️" // Changed to down arrow
          onPress={() => Alert.alert('⬇️ Receive', 'Receive functionality coming soon!')}
          flashColor="rgba(0, 255, 0, 0.8)" // Green
          flashSpeed={1000}
          iconAnimation="bounce" // Bouncing arrow
        />
        
        <FlashingButton
          title="SEND"
          icon="🚀"
          onPress={() => Alert.alert('🚀 Send', 'Send functionality coming soon!')}
          flashColor="rgba(255, 0, 0, 0.8)" // Red
          flashSpeed={1000}
          iconAnimation="move" // Moving rocket
        />
        
        <FlashingButton
          title="SWAP"
          icon="🔄"
          onPress={() => Alert.alert('🔄 Swap', 'Swap functionality coming soon!')}
          flashColor="rgba(0, 255, 0, 0.8)" // Green
          alternateColor="rgba(255, 0, 0, 0.8)" // Red
          flashSpeed={300} // Much faster
          iconAnimation="rotate" // Rotating swap icon
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtonsContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
    zIndex: 1001,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    width: (width - 80) / 4, // Four buttons per row with spacing
    height: 90,
    backgroundColor: 'transparent', // Transparent background
    borderRadius: 12,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 2, // Small spacing between buttons
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  buttonIcon: {
    fontSize: 20, // Slightly smaller icon
    marginBottom: 2,
    textAlign: 'center',
  },
  buttonTitle: {
    fontSize: 12, // Smaller text to fit
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 1,
  },
});

export default FlashingActionButtons;