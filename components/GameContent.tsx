import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Vibration,
  Dimensions,
  Alert,
} from 'react-native';
import { SkibidiColors } from '../theme/SkibidiTheme';
import { Skibidi3D } from './Skibidi3D';
import { PointAnimation } from './PointAnimation';
import { PaymentService } from '../services/PaymentService';

const { width, height } = Dimensions.get('window');

// Game interface
interface Game {
  id: string;
  title: string;
  icon: string;
  description: string;
  points?: number;
}

// Props for the main component
interface SkibidiGameContentProps {
  onSendPayment?: (destination: string, amountSats?: number) => Promise<any>;
  onReceivePayment?: (amountSats?: number, description?: string) => Promise<any>;
  onGetTestCoins?: () => void;
  playerBalance?: number;
  isLightningReady?: boolean;
}

// Skibidi Clicker Game Component
function SkibidiClickerGame({ 
  onBack, 
  playerBalance, 
  isLightningReady, 
  onReceivePayment 
}: { 
  onBack: () => void;
  playerBalance?: number;
  isLightningReady?: boolean;
  onReceivePayment?: (amountSats?: number, description?: string) => Promise<any>;
}) {
  const [points, setPoints] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(0);
  const [animations, setAnimations] = useState<Array<{
    id: number;
    points: number;
    x: number;
    y: number;
  }>>([]);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const animationCounter = useRef(0);
  const comboTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSkibidiPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const now = Date.now();
    
    // Combo system - if clicked within 1 second, increase combo
    if (now - lastClickTime < 1000) {
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
    }
    setLastClickTime(now);

    // Clear existing combo timer
    if (comboTimer.current) {
      clearTimeout(comboTimer.current);
    }

    // Reset combo after 1 second of no clicks
    comboTimer.current = setTimeout(() => {
      setCombo(0);
    }, 1000);

    // Calculate points based on combo
    const basePoints = 1;
    const comboMultiplier = Math.floor(combo / 5) + 1;
    const earnedPoints = basePoints * comboMultiplier;

    // Update points and spin speed
    setPoints(prev => prev + earnedPoints);
    setSpinSpeed(prev => Math.min(prev + 0.1, 5)); // Max spin speed of 5

    // Slow down spin over time
    setTimeout(() => {
      setSpinSpeed(prev => Math.max(prev - 0.05, 0));
    }, 200);

    // Create point animation
    const animationId = ++animationCounter.current;
    setAnimations(prev => [...prev, {
      id: animationId,
      points: earnedPoints,
      x: locationX,
      y: locationY,
    }]);

    // Vibration for feedback
    Vibration.vibrate([30, 20, 30]);

    // Set click position for visual feedback
    setClickPosition({ x: locationX, y: locationY });
    setTimeout(() => setClickPosition(null), 300);
  };

  const removeAnimation = (id: number) => {
    setAnimations(prev => prev.filter(anim => anim.id !== id));
  };

  const handleCashOut = async () => {
    if (!isLightningReady || !onReceivePayment) {
      Alert.alert(
        '⚡ Lightning Required',
        'You need Lightning Network connection to cash out your Skibidi points!'
      );
      return;
    }

    if (points < 100) {
      Alert.alert(
        '💸 Not Enough Points',
        'You need at least 100 Skibidi points to cash out (1 sat = 100 points)'
      );
      return;
    }

    const satsToReceive = Math.floor(points / 100); // 100 points = 1 sat
    
    Alert.alert(
      '💰 Cash Out Skibidi Points',
      `Convert ${points} points to ${satsToReceive} sats?\n\nThis will create a Lightning invoice.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cash Out!',
          onPress: async () => {
            try {
              await onReceivePayment(satsToReceive, `Skibidi Clicker cash out: ${points} points → ${satsToReceive} sats`);
              setPoints(prev => prev - (satsToReceive * 100)); // Deduct points
              Alert.alert('🎉 Success!', `Invoice created for ${satsToReceive} sats!`);
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to create cash out invoice');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.gameContainer}>
      {/* Header */}
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>🚽 SKIBIDI CLICKER 🚽</Text>
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>SKIBIDI POINTS</Text>
        <Text style={styles.scoreValue}>{points.toLocaleString()}</Text>
        {combo > 0 && (
          <Text style={styles.comboText}>
            🔥 COMBO x{combo} 🔥
          </Text>
        )}
        
        {/* Lightning Balance Display */}
        {isLightningReady && playerBalance !== undefined && (
          <View style={styles.balanceDisplay}>
            <Text style={styles.balanceText}>
              ⚡ {PaymentService.formatAmount(playerBalance)}
            </Text>
          </View>
        )}
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        <Skibidi3D 
          spinSpeed={spinSpeed}
          onPress={handleSkibidiPress}
          clickPosition={clickPosition}
        />
        
        {/* Point Animations */}
        {animations.map((anim) => (
          <PointAnimation
            key={anim.id}
            points={anim.points}
            x={anim.x}
            y={anim.y}
            onComplete={() => removeAnimation(anim.id)}
          />
        ))}
      </View>

      {/* Cash Out Button */}
      {points >= 100 && (
        <View style={styles.cashOutContainer}>
          <TouchableOpacity 
            style={[
              styles.cashOutButton,
              !isLightningReady && styles.cashOutButtonDisabled
            ]}
            onPress={handleCashOut}
            disabled={!isLightningReady}
          >
            <Text style={styles.cashOutButtonText}>
              💰 Cash Out ({Math.floor(points / 100)} sats)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          💡 Tap the Skibidi to gain points! Build combos for maximum chaos! 
          {isLightningReady ? ' Cash out points for real sats!' : ' Connect Lightning to cash out!'}
        </Text>
      </View>
    </View>
  );
}

// Games List Component
function GamesList({ 
  onGameSelect, 
  isLightningReady 
}: { 
  onGameSelect: (gameId: string) => void;
  isLightningReady?: boolean;
}) {
  const games: Game[] = [
    {
      id: 'skibidi-clicker',
      title: 'Skibidi Clicker',
      icon: '🚽',
      description: 'Click the Skibidi to gain points and earn real sats!',
    },
    {
      id: 'coming-soon-1',
      title: 'Toilet Racing',
      icon: '🏁',
      description: 'Race toilets through chaotic obstacle courses! (Coming Soon)',
    },
    {
      id: 'coming-soon-2',
      title: 'Sigma Stack',
      icon: '💎',
      description: 'Stack diamonds and avoid the cringe! (Coming Soon)',
    },
  ];

  return (
    <ScrollView style={styles.gamesListContainer} showsVerticalScrollIndicator={false}>
      {/* Description */}
      <View style={styles.gamesDescription}>
        <Text style={styles.descriptionText}>
          Play games, earn points, and cash out for real Bitcoin!
        </Text>
        {isLightningReady && (
          <Text style={styles.lightningReadyText}>
            ⚡ Lightning connected - Cash outs enabled!
          </Text>
        )}
      </View>

      {/* Games Grid */}
      <View style={styles.gamesGrid}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameCard,
              game.id.includes('coming-soon') && styles.gameCardDisabled
            ]}
            onPress={() => {
              if (!game.id.includes('coming-soon')) {
                Vibration.vibrate(50);
                onGameSelect(game.id);
              }
            }}
            disabled={game.id.includes('coming-soon')}
          >
            <Text style={styles.gameIcon}>{game.icon}</Text>
            <Text style={styles.gameTitle}>{game.title}</Text>
            <Text style={styles.gameDescription}>{game.description}</Text>
            {game.id.includes('coming-soon') && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>SOON™</Text>
              </View>
            )}
            {game.id === 'skibidi-clicker' && isLightningReady && (
              <View style={styles.earningsEnabledBadge}>
                <Text style={styles.earningsEnabledText}>💰 EARNINGS</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Main Game Content Component (Updated)
export function SkibidiGameContent({ 
  onSendPayment, 
  onReceivePayment, 
  onGetTestCoins, 
  playerBalance, 
  isLightningReady 
}: SkibidiGameContentProps) {
  const [currentGame, setCurrentGame] = useState<string | null>(null);

  const handleGameSelect = (gameId: string) => {
    setCurrentGame(gameId);
  };

  const handleBackToList = () => {
    setCurrentGame(null);
  };

  if (currentGame === 'skibidi-clicker') {
    return (
      <SkibidiClickerGame 
        onBack={handleBackToList}
        playerBalance={playerBalance}
        isLightningReady={isLightningReady}
        onReceivePayment={onReceivePayment}
      />
    );
  }

  return (
    <GamesList 
      onGameSelect={handleGameSelect}
      isLightningReady={isLightningReady}
    />
  );
}

// Additional Styles for new features
const newStyles = StyleSheet.create({
  balanceDisplay: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
  },
  balanceText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    textAlign: 'center',
  },
  cashOutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cashOutButton: {
    backgroundColor: SkibidiColors.crocodileGreen,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: SkibidiColors.glowGreen,
  },
  cashOutButtonDisabled: {
    backgroundColor: '#666666',
    borderColor: '#444444',
  },
  cashOutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: SkibidiColors.textPrimary,
    textAlign: 'center',
  },
  lightningReadyText: {
    fontSize: 14,
    color: '#00FF88',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  earningsEnabledBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: SkibidiColors.crocodileGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  earningsEnabledText: {
    fontSize: 10,
    fontWeight: '800',
    color: SkibidiColors.textPrimary,
  },
});

// Merge with existing styles
const styles = StyleSheet.create({
  gamesListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gamesDescription: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  gamesGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  gameCard: {
    backgroundColor: SkibidiColors.darkChaos,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: SkibidiColors.skibidiOrange + '60',
    position: 'relative',
  },
  gameCardDisabled: {
    opacity: 0.6,
    borderColor: SkibidiColors.textMuted + '40',
  },
  gameIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: SkibidiColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: SkibidiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: SkibidiColors.chaosRed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '800',
    color: SkibidiColors.textPrimary,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: SkibidiColors.darkChaos,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: SkibidiColors.skibidiOrange,
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: SkibidiColors.skibidiOrange,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: SkibidiColors.midChaos,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: SkibidiColors.crocodileGreen,
  },
  scoreLabel: {
    fontSize: 14,
    color: SkibidiColors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: SkibidiColors.crocodileGreen,
    textShadowColor: SkibidiColors.glowGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  comboText: {
    fontSize: 16,
    color: SkibidiColors.skibidiOrange,
    fontWeight: '800',
    marginTop: 8,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: SkibidiColors.midChaos,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SkibidiColors.lightChaos,
  },
  instructionsText: {
    fontSize: 14,
    color: SkibidiColors.sigmaGold,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  // Merge new styles
  ...newStyles,
});