import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
// import QRCode from 'react-native-qrcode-svg'; TO-DO: use real QRCode

// Mock QR image for now
import mockQr from '../assets/mock-qr.png';

interface QrCodeModalProps {
  visible: boolean;
  onClose: () => void;
  address: string;
  amount?: number;
  description?: string;
}

export const QrCodeReceiveModal: React.FC<QrCodeModalProps> = ({
  visible,
  onClose,
  address,
  amount,
  description
}) => {
  const paymentRequest = amount ? `${address}?amount=${amount}&label=${encodeURIComponent(description || '')}` : address;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>📥 Receive Bitcoin</Text>

          {/* Replace this Image with the real QRCode component */}
          <Image source={mockQr} style={styles.qrMock} />
          {/* <QRCode value={paymentRequest} size={240} /> */}

          <Text style={styles.addressText}>{address.slice(0, 10)}...{address.slice(-10)}</Text>
          {amount && <Text style={styles.amountText}>{amount} sats</Text>}

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>❌ Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
    width: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  qrMock: {
    width: 240,
    height: 240,
    marginBottom: 20,
  },
  addressText: {
    fontSize: 14,
    color: '#bbbbbb',
    marginTop: 6,
    marginBottom: 2,
  },
  amountText: {
    fontSize: 16,
    color: '#00ff99',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#ff5555',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default QrCodeReceiveModal;
