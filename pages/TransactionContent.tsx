import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useState, useEffect } from "react";
import { styles } from "../styles/AppStyles";
import { TransactionsContentProps } from "../types/content/ContentProps";
import { PaymentService } from "../services/PaymentService";
import { Payment, PaymentType, PaymentState } from "@breeztech/react-native-breez-sdk-liquid";
import { useBreez } from "../components/BreezProvider";

interface TransactionItem {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  fees: number;
  status: 'pending' | 'complete' | 'failed';
  date: Date;
  description?: string;
  destination?: string;
  txId?: string;
}

export function TransactionsContent({ 
  activeAccount, 
  walletInfo, 
  onUpdateBalance 
}: TransactionsContentProps) {
  const { isConnected: breezConnected, isLoading: breezLoading, getPaymentHistory } = useBreez();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (breezConnected) {
      loadTransactions();
    }
  }, [breezConnected]);

  const loadTransactions = async (isRefresh = false) => {
    if (!breezConnected) return;

    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const payments = await getPaymentHistory();
      const transformed = payments.map((payment: Payment): TransactionItem => ({
        id: payment.txId || `${payment.timestamp}`,
        type: payment.paymentType === PaymentType.SEND ? 'send' : 'receive',
        amount: payment.amountSat,
        fees: payment.feesSat,
        status: mapPaymentStatus(payment.status),
        date: new Date(payment.timestamp * 1000),
        description: getPaymentDescription(payment),
        destination: payment.destination,
        txId: payment.txId,
      }));
      transformed.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactions(transformed);
    } catch (err: any) {
      console.error("Failed to load:", err);
      setError(`Couldn't load transactions: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const mapPaymentStatus = (status: PaymentState): 'pending' | 'complete' | 'failed' => {
    switch (status) {
      case PaymentState.COMPLETE: return 'complete';
      case PaymentState.PENDING:
      case PaymentState.CREATED:
      case PaymentState.WAITING_FEE_ACCEPTANCE: return 'pending';
      default: return 'failed';
    }
  };

  const getPaymentDescription = (payment: Payment): string => {
    if (payment.details?.description) return payment.details.description;
    return payment.paymentType === PaymentType.SEND ? 'Sent sats' : 'Received sats';
  };

  const onRefresh = async () => {
    await loadTransactions(true);
    await onUpdateBalance();
  };

  const getStatusEmoji = (status: TransactionItem['status']) => {
    switch (status) {
      case 'complete': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getAmountColor = (type: TransactionItem['type']) =>
    type === 'send' ? '#FF6B6B' : '#00FF88';

  const getStatusColor = (status: TransactionItem['status']) => {
    switch (status) {
      case 'complete': return '#00FF88';
      case 'pending': return '#FFD700';
      case 'failed': return '#FF6B6B';
      default: return '#aaa';
    }
  };

  const handleTransactionPress = (tx: TransactionItem) => {
    const txType = tx.type === 'send' ? 'Sent' : 'Received';
    const statusText = tx.status.charAt(0).toUpperCase() + tx.status.slice(1);
    Alert.alert(
      `${txType} ${PaymentService.formatAmount(tx.amount)}`,
      `Status: ${statusText}\nAmount: ${tx.amount} sats\nFees: ${tx.fees} sats\n${tx.date.toLocaleString()}\n${tx.description}`,
      [{ text: 'OK' }]
    );
  };

  if (!breezConnected || breezLoading) {
    return (
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderEmoji}>⚡</Text>
        <Text style={styles.placeholderTitle}>Lightning Not Ready</Text>
        <Text style={styles.placeholderText}>
          Waiting for Lightning to boot up the flush system...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderEmoji}>💥</Text>
        <Text style={styles.placeholderTitle}>Error</Text>
        <Text style={styles.placeholderText}>{error}</Text>
        <TouchableOpacity onPress={() => loadTransactions()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>🔁 Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.transactionHeaderTitle, { textAlign: 'center', fontSize: 20 }]}>🧻 Skibidi Transactions</Text>

      {transactions.length === 0 && !loading && (
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderEmoji}>🕳️</Text>
          <Text style={styles.placeholderTitle}>No History Yet</Text>
          <Text style={styles.placeholderText}>Spend more to earn your flush stripes.</Text>
        </View>
      )}

      {transactions.map((tx, i) => (
        <TouchableOpacity
          key={`tx-${tx.id}-${i}`}
          onPress={() => handleTransactionPress(tx)}
          style={{
            marginHorizontal: 20,
            marginVertical: 10,
            padding: 16,
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: getStatusColor(tx.status),
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: getAmountColor(tx.type), fontSize: 18, fontWeight: 'bold' }}>
              {tx.type === 'send' ? '-' : '+'}{PaymentService.formatAmount(tx.amount)} sats
            </Text>
            <Text style={{ fontSize: 16, color: getStatusColor(tx.status) }}>
              {getStatusEmoji(tx.status)}
            </Text>
          </View>
          <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
            {tx.description}
          </Text>
          <Text style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
            {tx.date.toLocaleString()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
