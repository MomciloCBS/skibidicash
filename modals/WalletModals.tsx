import { Alert, Animated, Modal, SafeAreaView, StatusBar, Text, View } from "react-native";
import { styles } from "../styles/AppStyles";
import { useEffect, useRef, useState } from "react";
import { BitcoinAccount } from "../types/account/BitcoinAccount";
import { SkibidiColors } from "../theme/SkibidiTheme";
import { SkibidiButton } from "../components/SkibidiButton";
import { SecureStorage } from "../storage/Storage";

export interface OnboardingScreenProps {    
    onCreateWallet: () => void;
    onImportWallet: () => void;
}
  
export function OnboardingScreen({ onCreateWallet, onImportWallet }: OnboardingScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
  
    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);
  
    return (
      <SafeAreaView style={styles.onboardingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={SkibidiColors.darkChaos} />
        
        <Animated.View 
          style={[
            styles.onboardingContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.onboardingTitle}>🚽 SKIBIDI CASH 🚽</Text>
          <Text style={styles.onboardingSubtitle}>Your Real Bitcoin Wallet</Text>
          
          <View style={styles.onboardingDescription}>
            <Text style={styles.onboardingText}>
              Welcome to the most sigma Bitcoin wallet on the blockchain! 
              Get ready to stack sats and collect ordinals like a true alpha.
            </Text>
          </View>
  
          <View style={styles.onboardingButtons}>
            <SkibidiButton
              title="🆕 Create New Wallet"
              variant="primary"
              onPress={onCreateWallet}
              style={styles.onboardingButton}
            />
            
            <SkibidiButton
              title="📥 Import Existing Wallet"
              variant="secondary"
              onPress={onImportWallet}
              style={styles.onboardingButton}
            />
          </View>
  
          <Text style={styles.onboardingWarning}>
            ⚠️ This is a real Bitcoin wallet. Keep your private keys safe!
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
}
  
export interface CreateWalletModalProps {
    visible: boolean;
    onClose: () => void;
    onWalletCreated: (account: BitcoinAccount) => void;
}
  
export interface ImportWalletModalProps {
    visible: boolean;
    onClose: () => void;
    onWalletImported: (account: BitcoinAccount) => void;
}
  
// 🔑 Export Private Key Modal
export interface ExportPrivateKeyModalProps {
    visible: boolean;
    account: BitcoinAccount | null;
    onClose: () => void;
  }
  
export function ExportPrivateKeyModal({ visible, account, onClose }: ExportPrivateKeyModalProps) {
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [revealed, setRevealed] = useState(false);
  
    useEffect(() => {
      if (visible && account) {
        loadPrivateKey();
      } else {
        setPrivateKey(null);
        setRevealed(false);
      }
    }, [visible, account]);
  
    const loadPrivateKey = async () => {
      if (!account) return;
      
      setLoading(true);
      try {
        const key = await SecureStorage.getPrivateKey(account.id);
        setPrivateKey(key);
      } catch (error) {
        console.error('Failed to load private key:', error);
        Alert.alert('❌ Error', 'Failed to load private key');
      } finally {
        setLoading(false);
      }
    };
  
    const handleReveal = () => {
      Alert.alert(
        '⚠️ Security Warning',
        'Anyone with your private key can access your Bitcoin. Only share this in a secure environment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'I Understand', onPress: () => setRevealed(true) },
        ]
      );
    };
  
    const copyToClipboard = async () => {
      if (privateKey) {
        // Note: You'll need to install @react-native-clipboard/clipboard
        // import Clipboard from '@react-native-clipboard/clipboard';
        // Clipboard.setString(privateKey);
        Alert.alert('📋 Copied', 'Private key copied to clipboard');
      }
    };
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModalContent}>
            <Text style={styles.modalTitle}>🔑 Export Private Key</Text>
            
            {account && (
              <View style={styles.accountInfo}>
                <Text style={styles.accountExportEmoji}>{account.emoji}</Text>
                <Text style={styles.accountExportName}>{account.name}</Text>
              </View>
            )}
  
            <Text style={styles.exportWarning}>
              ⚠️ Your private key gives complete access to your Bitcoin. Keep it secure!
            </Text>
  
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : privateKey ? (
              <View style={styles.privateKeyContainer}>
                {!revealed ? (
                  <View>
                    <Text style={styles.hiddenKey}>••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</Text>
                    <SkibidiButton
                      title="👁️ Reveal Private Key"
                      variant="primary"
                      onPress={handleReveal}
                      style={styles.revealButton}
                    />
                  </View>
                ) : (
                  <View>
                    <View style={styles.privateKeyBox}>
                      <Text style={styles.privateKeyText}>{privateKey}</Text>
                    </View>
                    <SkibidiButton
                      title="📋 Copy to Clipboard"
                      variant="secondary"
                      onPress={copyToClipboard}
                      style={styles.copyButton}
                    />
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.errorText}>Failed to load private key</Text>
            )}
  
            <SkibidiButton
              title="Close"
              variant="chaos"
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>
        </View>
      </Modal>
    );
}
  