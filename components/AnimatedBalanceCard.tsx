import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface AnimatedBalanceCardProps {
  satoshiBalance: number;
  ordinalsBalance?: number;
  isLightningBalance?: boolean;
  pendingReceive?: number;
  pendingSend?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const AnimatedBalanceCard: React.FC<AnimatedBalanceCardProps> = ({
  satoshiBalance,
}) => {
  const balanceScaleAnim = useRef(new Animated.Value(1)).current;
  const digitAnim = useRef(new Animated.Value(0)).current;

  // Convert sats to dollars (assuming 1 BTC = $43,000 and 100M sats = 1 BTC)
  const convertSatsToDollars = (sats: number): string => {
    const btcPrice = 43000; // Current BTC price assumption
    const satsPerBTC = 100000000; // 100 million sats per BTC
    const dollars = (sats / satsPerBTC) * btcPrice;
    return dollars.toFixed(2);
  };

  // Simulate hourly percentage change (in real app, this would come from API)
  const getHourlyChange = (): { percentage: number; isPositive: boolean } => {
    // Simulate a realistic percentage change (-5% to +8%)
    const change = (Math.random() - 0.3) * 13; // Slightly biased positive
    return {
      percentage: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const dollarAmount = convertSatsToDollars(satoshiBalance);
  const [wholePart, decimalPart] = dollarAmount.split('.');
  const hourlyChange = getHourlyChange();

  useEffect(() => {
    // Subtle breathing animation for the balance
    Animated.loop(
      Animated.sequence([
        Animated.timing(balanceScaleAnim, {
          toValue: 1.01,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(balanceScaleAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Constantly spinning last digit - much faster now
    Animated.loop(
      Animated.timing(digitAnim, {
        toValue: 10, // 0-9 digits
        duration: 800, // Faster: 0.8 seconds for full cycle (was 2000)
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.balanceContainer, { transform: [{ scale: balanceScaleAnim }] }]}>
      <View style={styles.balanceAmountContainer}>
        <Text style={styles.balanceAmount}>
          ${wholePart}.{decimalPart.charAt(0)}
        </Text>
        <SpinningDigit animValue={digitAnim} />
      </View>
      
      <View style={styles.changeContainer}>
        <Text style={[
          styles.changeText,
          { color: hourlyChange.isPositive ? '#4CAF50' : '#F44336' }
        ]}>
          {hourlyChange.isPositive ? '+' : '-'}{hourlyChange.percentage.toFixed(1)}% (1h)
        </Text>
      </View>
    </Animated.View>
  );
};

// Component for the spinning last digit
const SpinningDigit: React.FC<{ animValue: Animated.Value }> = ({ animValue }) => {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return (
    <View style={styles.digitContainer}>
      {digits.map((digit, index) => {
        const opacity = animValue.interpolate({
          inputRange: [index, index + 0.5, index + 1],
          outputRange: [1, 0, 0],
          extrapolate: 'clamp',
        });

        const translateY = animValue.interpolate({
          inputRange: [index, index + 1],
          outputRange: [0, -50], // Increased movement range
          extrapolate: 'clamp',
        });

        return (
          <Animated.Text
            key={digit}
            style={[
              styles.spinningDigit,
              {
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            {digit}
          </Animated.Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  balanceContainer: {
    marginVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    height: 60, // Increased height to accommodate spinning digit
    overflow: 'visible', // Allow content to be visible outside bounds
  },
  balanceAmount: {
    fontSize: 42, // Slightly larger for prominence
    fontWeight: '400', // Much slimmer (was '900')
    color: '#4CAF50', // Green color for money
    textShadowColor: 'rgba(76, 175, 80, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  changeContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  digitContainer: {
    position: 'relative',
    width: 35, // Increased width for digit
    height: 50, // Increased height for digit
    overflow: 'visible', // Changed from 'hidden' to 'visible'
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinningDigit: {
    position: 'absolute',
    width: 35, // Match container width
    textAlign: 'center',
    fontSize: 42, // Match main balance font size
    fontWeight: '400', // Match main balance font weight
    color: '#4CAF50', // Match main balance color
    textShadowColor: 'rgba(76, 175, 80, 0.5)',

  },
});

export default AnimatedBalanceCard;