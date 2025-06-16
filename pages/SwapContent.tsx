// pages/SwapContent.tsx - Example of updated component
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SwapContentProps } from '../types/content/ContentProps';
import { SkibidiButton } from '../components/SkibidiButton';
import { PaymentService } from '../services/PaymentService';

export function SwapContent({ 
  activeAccount, 
  walletInfo, 
  breezConnected, 
  onSendPayment, 
  onReceivePayment, 
  onUpdateBalance 
}: SwapContentProps) {
  const [isSwapping, setIsSwapping] = useState(false);

  const handleQuickSwap = async () => {
    if (!breezConnected) {
      Alert.alert('⚡ Not Connected', 'Lightning network required for swaps');
      return;
    }

    setIsSwapping(true);
    try {
      // Example swap functionality
      const invoice = await onReceivePayment(5000, 'Skibidi swap incoming!');
      Alert.alert('💱 Swap Ready', 'Share this invoice to complete the swap');
    } catch (error: any) {
      Alert.alert('❌ Swap Failed', error.message);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>
        🔄 Skibidi Swap
      </Text>
      
      {/* Connection Status */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: breezConnected ? '#00FF00' : '#FF6B6B' }}>
          Status: {breezConnected ? '⚡ Lightning Ready' : '❌ Offline'}
        </Text>
        {walletInfo && (
          <Text style={{ color: 'white' }}>
            Balance: {PaymentService.formatAmount(walletInfo.balanceSat)}
          </Text>
        )}
      </View>

      {/* Swap Actions */}
      <SkibidiButton
        title={isSwapping ? "🔄 Swapping..." : "⚡ Quick Swap"}
        variant="primary"
        onPress={handleQuickSwap}
        disabled={!breezConnected || isSwapping}
      />
      
      <SkibidiButton
        title="🔄 Refresh Balance"
        variant="secondary"
        onPress={onUpdateBalance}
      />
    </View>
  );
}