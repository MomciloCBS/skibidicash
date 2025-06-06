  
import { Text, TouchableOpacity, Vibration } from "react-native";

import { Animated } from "react-native";
import { styles } from "../styles/AppStyles";
import { SkibidiColors } from "../theme/SkibidiTheme";
import { useRef } from "react";
import { SkibidiButtonProps } from "../types/ui/SkibidiButtonProps";

export function SkibidiButton({ title, onPress, variant = 'primary', style, icon }: SkibidiButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
  
    const handlePress = () => {
      Vibration.vibrate([50, 30, 50]);
      
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
  
    const getButtonStyle = () => {
      const baseStyle = {
        paddingVertical: variant === 'small' ? 8 : 16,
        paddingHorizontal: variant === 'small' ? 12 : 24,
        borderRadius: variant === 'small' ? 8 : 16,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        borderWidth: variant === 'small' ? 1 : 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
      };
  
      switch (variant) {
        case 'primary':
          return { ...baseStyle, backgroundColor: SkibidiColors.skibidiOrange };
        case 'secondary':
          return { ...baseStyle, backgroundColor: SkibidiColors.toiletBlue };
        case 'chaos':
          return { ...baseStyle, backgroundColor: SkibidiColors.chaosRed };
        case 'sigma':
          return { ...baseStyle, backgroundColor: SkibidiColors.sigmaGold };
        case 'small':
          return { ...baseStyle, backgroundColor: SkibidiColors.midChaos };
        default:
          return { ...baseStyle, backgroundColor: SkibidiColors.skibidiOrange };
      }
    };
  
    return (
      <Animated.View style={[getButtonStyle(), { transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity onPress={handlePress} style={styles.buttonInner} activeOpacity={0.8}>
          <Text style={[styles.buttonText, { fontSize: variant === 'small' ? 12 : 14 }]}>
            {icon && `${icon} `}{title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
}