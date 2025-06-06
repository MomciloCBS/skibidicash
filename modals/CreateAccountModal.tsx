import { Modal, TouchableOpacity, View } from "react-native";

import { useState } from "react";
import { Alert, Text, TextInput } from "react-native";
import { CreateAccountModalProps } from "../types/account/CreateAccountModalProps";
import { SkibidiButton } from "../components/SkibidiButton";
import { styles } from "../styles/AppStyles";
import { SkibidiColors } from "../theme/SkibidiTheme";

export function CreateAccountModal({ visible, onClose, onCreateAccount }: CreateAccountModalProps) {
    const [accountName, setAccountName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('🔥');
    
    const emojis = ['🔥', '💎', '🚀', '⚡', '🎮', '💰', '🦈', '🐊', '☕', '💃'];
  
    const handleCreate = () => {
      if (!accountName.trim()) {
        Alert.alert('❌ Name Required', 'Enter a name for your account, chief!');
        return;
      }
      
      onCreateAccount(accountName.trim(), selectedEmoji);
      setAccountName('');
      setSelectedEmoji('🔥');
      onClose();
    };
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalContent}>
            <Text style={styles.modalTitle}>🆕 Create New Account</Text>
            
            <Text style={styles.inputLabel}>Account Name:</Text>
            <TextInput
              style={styles.textInput}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="My Sigma Wallet"
              placeholderTextColor={SkibidiColors.textMuted}
              maxLength={20}
            />
  
            <Text style={styles.inputLabel}>Choose Emoji:</Text>
            <View style={styles.emojiGrid}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    { 
                      backgroundColor: emoji === selectedEmoji 
                        ? SkibidiColors.skibidiOrange + '40' 
                        : 'transparent' 
                    }
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
  
            <View style={styles.createModalActions}>
              <SkibidiButton
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={styles.createActionButton}
              />
              <SkibidiButton
                title="Create"
                variant="primary"
                onPress={handleCreate}
                style={styles.createActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }