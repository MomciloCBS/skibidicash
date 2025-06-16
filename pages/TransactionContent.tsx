// pages/TransactionsContent.tsx - Updated with Breez SDK Transaction History
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useState, useEffect } from "react";
import { styles } from "../styles/AppStyles";
import { TransactionsContentProps } from "../types/content/ContentProps";
import { BreezSDKService } from "../services/BreezSDKService";
import { PaymentService } from "../services/PaymentService";
import { Payment, PaymentType, PaymentState } from "@breeztech/react-native-breez-sdk-liquid";

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
  breezConnected, 
  onUpdateBalance 
}: TransactionsContentProps) {
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

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    // try {
    //   console.log('🔍 Loading transaction history...');
      
    //   // Fetch recent payments from Breez SDK
    //   const payments = await BreezSDKService.getRecentPayments();
      
    //   console.log(`📊 Found ${payments.length} transactions`);

    //   // Transform payments to our transaction format
    //   const transformedTransactions: TransactionItem[] = payments.map((payment) => ({
    //     id: PaymentService.getPaymentId(payment),
    //     type: payment.paymentType === PaymentType.SEND ? 'send' : 'receive',
    //     amount: payment.amountSat,
    //     fees: payment.feesSat,
    //     status: mapPaymentStatus(payment.status),
    //     date: new Date(payment.timestamp * 1000),
    //     description: getPaymentDescription(payment),
    //     destination: payment.destination,
    //     txId: payment.txId,
    //   }));

    //   // Sort by date (newest first)
    //   transformedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    //   setTransactions(transformedTransactions);
    // } catch (error: any) {
    //   console.error('Failed to load transactions:', error);
    //   setError(`Failed to load transactions: ${error.message}`);
    // } finally {
    //   setLoading(false);
    //   setRefreshing(false);
    // }
  };

  const mapPaymentStatus = (status: PaymentState): 'pending' | 'complete' | 'failed' => {
    switch (status) {
      case PaymentState.COMPLETE:
        return 'complete';
      case PaymentState.PENDING:
      case PaymentState.CREATED:
      case PaymentState.WAITING_FEE_ACCEPTANCE:
        return 'pending';
      case PaymentState.FAILED:
      case PaymentState.TIMED_OUT:
      case PaymentState.REFUNDABLE:
      case PaymentState.REFUND_PENDING:
        return 'failed';
      default:
        return 'pending';
    }
  };

  const getPaymentDescription = (payment: Payment): string => {
    if (payment.details) {
      switch (payment.details.type) {
        case 'lightning':
          return payment.details.description || 'Lightning Payment';
        case 'bitcoin':
          return payment.details.description || 'Bitcoin Payment';
        case 'liquid':
          return payment.details.description || 'Liquid Payment';
        default:
          return 'Payment';
      }
    }
    return 'Payment';
  };

  const getStatusColor = (status: 'pending' | 'complete' | 'failed') => {
    switch (status) {
      case 'complete':
        return '#00FF88';
      case 'pending':
        return '#FFD700';
      case 'failed':
        return '#FF6B6B';
      default:
        return '#888888';
    }
  };

  const getStatusIcon = (status: 'pending' | 'complete' | 'failed') => {
    switch (status) {
      case 'complete':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getTypeIcon = (type: 'send' | 'receive') => {
    return type === 'send' ? '📤' : '📥';
  };

  const handleTransactionPress = (transaction: TransactionItem) => {
    const statusText = transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1);
    const typeText = transaction.type === 'send' ? 'Sent' : 'Received';
    
    Alert.alert(
      `${typeText} ${PaymentService.formatAmount(transaction.amount)}`,
      `Status: ${statusText}\n` +
      `Amount: ${PaymentService.formatAmount(transaction.amount)}\n` +
      `Fees: ${PaymentService.formatAmount(transaction.fees)}\n` +
      `Date: ${transaction.date.toLocaleString()}\n` +
      `Description: ${transaction.description}\n` +
      (transaction.txId ? `TX ID: ${transaction.txId.substring(0, 20)}...` : ''),
      [
        { text: 'OK' },
        ...(transaction.txId ? [{ 
          text: 'Copy TX ID', 
          onPress: () => {
            // Copy to clipboard
            Alert.alert('📋 Copied', 'Transaction ID copied to clipboard');
          }
        }] : [])
      ]
    );
  };

  const onRefresh = async () => {
    await loadTransactions(true);
    await onUpdateBalance();
  };

  if (!breezConnected) {
    return (
      <ScrollView style={styles.contentContainer}>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderEmoji}>⚡</Text>
          <Text style={styles.placeholderTitle}>Lightning Required</Text>
          <Text style={styles.placeholderText}>
            Connect to Lightning Network to view transaction history.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.contentContainer}>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderEmoji}>❌</Text>
          <Text style={styles.placeholderTitle}>Error Loading Transactions</Text>
          <Text style={styles.placeholderText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => loadTransactions()}
          >
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionHeaderTitle}>📊 Transaction History</Text>
        <Text style={styles.transactionHeaderSubtitle}>
          {transactions.length} transactions • Pull to refresh
        </Text>
      </View>

      {/* Balance Summary */}
      {walletInfo && (
        <View style={styles.balanceSummary}>
          <Text style={styles.balanceSummaryTitle}>Current Balance</Text>
          <Text style={styles.balanceSummaryAmount}>
            {PaymentService.formatAmount(walletInfo.balanceSat)}
          </Text>
          {(walletInfo.pendingReceiveSat > 0 || walletInfo.pendingSendSat > 0) && (
            <View style={styles.pendingContainer}>
              {walletInfo.pendingReceiveSat > 0 && (
                <Text style={styles.pendingReceive}>
                  +{PaymentService.formatAmount(walletInfo.pendingReceiveSat)} pending
                </Text>
              )}
              {walletInfo.pendingSendSat > 0 && (
                <Text style={styles.pendingSend}>
                  -{PaymentService.formatAmount(walletInfo.pendingSendSat)} pending
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Transactions List */}
      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⚡ Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderEmoji}>💸</Text>
          <Text style={styles.placeholderTitle}>No Transactions Yet</Text>
          <Text style={styles.placeholderText}>
            Your Lightning payments and receipts will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {transactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => handleTransactionPress(transaction)}
            >
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionTypeIcon}>
                  {getTypeIcon(transaction.type)}
                </Text>
                <Text style={styles.transactionStatusIcon}>
                  {getStatusIcon(transaction.status)}
                </Text>
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {transaction.date.toLocaleDateString()} {transaction.date.toLocaleTimeString()}
                </Text>
                {transaction.destination && (
                  <Text style={styles.transactionDestination}>
                    To: {transaction.destination.substring(0, 20)}...
                  </Text>
                )}
              </View>
              
              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.transactionAmountText,
                  { 
                    color: transaction.type === 'send' ? '#FF6B6B' : '#00FF88' 
                  }
                ]}>
                  {transaction.type === 'send' ? '-' : '+'}
                  {PaymentService.formatAmount(transaction.amount)}
                </Text>
                {transaction.fees > 0 && (
                  <Text style={styles.transactionFees}>
                    Fee: {PaymentService.formatAmount(transaction.fees)}
                  </Text>
                )}
                <Text style={[
                  styles.transactionStatus,
                  { color: getStatusColor(transaction.status) }
                ]}>
                  {transaction.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}