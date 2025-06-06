import { Dimensions, ScrollView, TouchableOpacity } from "react-native";

import { Animated, View } from "react-native";

import { Modal, Text } from "react-native";
import { SkibidiButton } from "../components/SkibidiButton";
import { styles } from "../styles/AppStyles";
import { useEffect } from "react";
import { useRef } from "react";
import { SkibidiColors } from "../theme/SkibidiTheme";
import { AccountModalProps } from "../types/account/AccountModalProps";

export function AccountModal({ 
    visible, 
    accounts, 
    activeAccount, 
    onClose, 
    onSelectAccount, 
    onCreateAccount,
    onExportPrivateKey 
  }: AccountModalProps) {
    const { height } = Dimensions.get('window');
    const slideAnim = useRef(new Animated.Value(height)).current;
  
    useEffect(() => {
      if (visible) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [visible]);
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏦 Select Account</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
  
            <ScrollView style={styles.accountsList} showsVerticalScrollIndicator={false}>
              {accounts.map((account) => (
                <View key={account.id}>
                  <TouchableOpacity
                    style={[
                      styles.accountItem,
                      {
                        backgroundColor: account.id === activeAccount.id 
                          ? SkibidiColors.skibidiOrange + '40' 
                          : SkibidiColors.midChaos,
                        borderColor: account.id === activeAccount.id 
                          ? SkibidiColors.skibidiOrange 
                          : SkibidiColors.lightChaos,
                      }
                    ]}
                    onPress={() => {
                      onSelectAccount(account);
                      onClose();
                    }}
                  >
                    <View style={styles.accountItemHeader}>
                      <Text style={styles.accountItemEmoji}>{account.emoji}</Text>
                      <Text style={styles.accountItemName}>{account.name}</Text>
                      {account.id === activeAccount.id && (
                        <Text style={styles.activeIndicator}>✓</Text>
                      )}
                    </View>
                    
                    <View style={styles.accountItemDetails}>
                      <Text style={styles.accountItemBalance}>
                        💰 {account.balance.toLocaleString()} sats
                      </Text>
                      <Text style={styles.accountItemOrdinals}>
                        🎨 {account.ordinalsBalance} collectibles
                      </Text>
                    </View>
  
                    <View style={styles.addressContainer}>
                      <Text style={styles.addressLabel}>Payments (SegWit):</Text>
                      <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                        {account.paymentsAddress}
                      </Text>
                      <Text style={styles.addressLabel}>Ordinals (Taproot):</Text>
                      <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                        {account.ordinalsAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Export Private Key Button */}
                  <View style={styles.exportButtonContainer}>
                    <SkibidiButton
                      title="🔑 Export Private Key"
                      variant="small"
                      onPress={() => {
                        onClose();
                        onExportPrivateKey(account);
                      }}
                      style={styles.exportButton}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
  
            <View style={styles.modalActions}>
              <SkibidiButton
                title="+ Create New Account"
                variant="primary"
                onPress={onCreateAccount}
                icon="🆕"
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
}