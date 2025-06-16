// modals/CreateAccountModal.tsx - Updated version
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SkibidiColors } from '../theme/SkibidiTheme';

interface CreateAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateAccount: (name: string, emoji: string, password?: string) => Promise<void>;
  onRestoreAccount?: (mnemonic: string, name: string, emoji: string, password?: string) => Promise<void>;
  isCreating?: boolean;
}

export function CreateAccountModal({
  visible,
  onClose,
  onCreateAccount,
  onRestoreAccount,
  isCreating = false,
}: CreateAccountModalProps) {
  const [mode, setMode] = useState<'create' | 'restore'>('create');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🚽');
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);

  const emojis = ['🚽', '💩', '🤪', '🎮', '💰', '🔥', '⚡', '🌟', '🚀', '👑'];

  const resetForm = () => {
    setName('');
    setEmoji('🚽');
    setMnemonic('');
    setPassword('');
    setConfirmPassword('');
    setUsePassword(false);
    setMode('create');
  };

  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onClose();
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('❌ Error', 'Please enter a wallet name');
      return false;
    }

    if (mode === 'restore') {
      if (!onRestoreAccount) {
        Alert.alert('❌ Error', 'Restore functionality is not available');
        return false;
      }
      const words = mnemonic.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        Alert.alert('❌ Error', 'Recovery phrase must be 12 or 24 words');
        return false;
      }
    }

    if (usePassword) {
      if (password.length < 6) {
        Alert.alert('❌ Error', 'Password must be at least 6 characters');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('❌ Error', 'Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const walletPassword = usePassword ? password : undefined;
      
      if (mode === 'create') {
        await onCreateAccount(name.trim(), emoji, walletPassword);
      } else if (onRestoreAccount) {
        await onRestoreAccount(mnemonic.trim(), name.trim(), emoji, walletPassword);
      }
    } catch (error) {
      console.error('Account creation/restore failed:', error);
      Alert.alert('❌ Error', 'Failed to create/restore account. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isCreating}
              style={[styles.closeButton, isCreating && { opacity: 0.5 }]}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {mode === 'create' ? '🆕 Create Wallet' : '🔄 Restore Wallet'}
            </Text>
          </View>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'create' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('create')}
              disabled={isCreating}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'create' && styles.modeButtonTextActive,
                ]}
              >
                Create New
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'restore' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('restore')}  
              disabled={isCreating || !onRestoreAccount}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'restore' && styles.modeButtonTextActive,
                ]}
              >
                Restore
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recovery Phrase Input (Restore Mode) */}
          {mode === 'restore' && onRestoreAccount && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🔑 Recovery Phrase</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={mnemonic}
                onChangeText={setMnemonic}
                placeholder="Enter your 12 or 24 word recovery phrase..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isCreating}
              />
              <Text style={styles.inputHint}>
                Separate each word with a space
              </Text>
            </View>
          )}

          {/* Wallet Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📝 Wallet Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter wallet name..."
              placeholderTextColor="#666"
              maxLength={20}
              editable={!isCreating}
            />
          </View>

          {/* Emoji Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>😀 Choose Emoji</Text>
            <View style={styles.emojiSelector}>
              {emojis.map((emojiOption) => (
                <TouchableOpacity
                  key={emojiOption}
                  style={[
                    styles.emojiButton,
                    emoji === emojiOption && styles.emojiButtonSelected,
                  ]}
                  onPress={() => setEmoji(emojiOption)}
                  disabled={isCreating}
                >
                  <Text style={styles.emojiText}>{emojiOption}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Optional Password */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setUsePassword(!usePassword)}
              disabled={isCreating}
            >
              <View style={[styles.checkbox, usePassword && styles.checkboxChecked]}>
                {usePassword && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>🔒 Add Password Protection</Text>
            </TouchableOpacity>
            
            {usePassword && (
              <>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password..."
                  placeholderTextColor="#666"
                  secureTextEntry
                  editable={!isCreating}
                />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password..."
                  placeholderTextColor="#666"
                  secureTextEntry
                  editable={!isCreating}
                />
              </>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!name.trim() || isCreating) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>
                  {mode === 'create' ? 'Creating...' : 'Restoring...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'create' ? '🆕 Create Wallet' : '🔄 Restore Wallet'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Security Warning */}
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Security Notice</Text>
            <Text style={styles.warningText}>
              {mode === 'create'
                ? 'Your recovery phrase will be shown after creation. Write it down and store it safely - it\'s the only way to recover your wallet!'
                : 'Make sure you\'re in a secure location when entering your recovery phrase. Never share it with anyone.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: SkibidiColors.skibidiOrange,
  },
  modeButtonText: {
    color: '#ccc',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  emojiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonSelected: {
    borderColor: SkibidiColors.skibidiOrange,
  },
  emojiText: {
    fontSize: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#555',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: SkibidiColors.skibidiOrange,
    borderColor: SkibidiColors.skibidiOrange,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: SkibidiColors.skibidiOrange,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warningBox: {
    backgroundColor: '#2D1B00',
    borderLeftWidth: 4,
    borderLeftColor: SkibidiColors.sigmaGold,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningTitle: {
    color: SkibidiColors.sigmaGold,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningText: {
    color: SkibidiColors.sigmaGold,
    fontSize: 14,
    lineHeight: 20,
  },
});