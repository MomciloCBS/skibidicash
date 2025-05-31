import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useOnboarding } from '../hooks/useOnboarding';
import { SkibidiColors } from '../theme/SkibidiTheme';

export default function OnboardingFlow({ navigation }: any) {
  const { submitPassword, error, createWallet, restoreWallet } = useOnboarding();
  const [input, setInput] = useState('');
  const [seedInput, setSeedInput] = useState('');

  const handlePasswordContinue = async () => {
    const success = await submitPassword(input);
    if (success) {
      Alert.alert('✅ Password Set', 'Choose to create or restore a wallet.');
    }
  };

  const handleCreate = async () => {
    const phrase = await createWallet();
    Alert.alert('🎉 Wallet Created', phrase);
    navigation.navigate('Main'); // navigate to main wallet screen
  };

  const handleRestore = async () => {
    const ok = await restoreWallet(seedInput);
    if (ok) {
      Alert.alert('✅ Wallet Restored', 'Welcome back, skibidi soldier!');
      navigation.navigate('Main');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Set Your Sigma Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Enter password"
        placeholderTextColor={SkibidiColors.textMuted}
        value={input}
        onChangeText={setInput}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handlePasswordContinue}>
        <Text style={styles.buttonText}>CONTINUE 🚽</Text>
      </TouchableOpacity>

      <Text style={styles.divider}>──── OR ────</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleCreate}>
        <Text style={styles.buttonText}>🧠 Create New Wallet</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { marginTop: 16 }]}
        placeholder="Enter 12-word seed to restore"
        placeholderTextColor={SkibidiColors.textMuted}
        value={seedInput}
        onChangeText={setSeedInput}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleRestore}>
        <Text style={styles.buttonText}>RESTORE 🔁</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SkibidiColors.darkChaos,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: SkibidiColors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: SkibidiColors.lightChaos,
    color: SkibidiColors.textPrimary,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: SkibidiColors.midChaos,
  },
  error: {
    color: SkibidiColors.chaosRed,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    backgroundColor: SkibidiColors.skibidiOrange,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: 16,
    backgroundColor: SkibidiColors.toiletBlue,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: SkibidiColors.textPrimary,
    fontWeight: '900',
    fontSize: 16,
  },
  divider: {
    textAlign: 'center',
    marginVertical: 16,
    color: SkibidiColors.textMuted,
    fontWeight: 'bold',
  },
});
