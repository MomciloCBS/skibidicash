import { ScrollView, View, Text } from "react-native";
import { styles } from "../styles/AppStyles";
import { SkibidiGameContent } from "../components/GameContent";
import { GameContentProps } from "../types/content/ContentProps";
import { PaymentService } from "../services/PaymentService";

export function GameContent({ 
  activeAccount, 
  walletInfo, 
  breezConnected, 
  onUpdateBalance,
  onSendPayment,
  onReceivePayment,
  onGetTestCoins 
}: GameContentProps) {
  return (
    <ScrollView style={styles.contentContainer}>
      {/* Lightning Status for Games */}
      {breezConnected && walletInfo && (
        <View style={styles.gameStatusBar}>
          <Text style={styles.gameStatusText}>
            ⚡ Balance: {PaymentService.formatAmount(walletInfo.balanceSat)}
          </Text>
          <Text style={styles.gameStatusSubtext}>
            Ready for in-game transactions!
          </Text>
        </View>
      )}
      
      <SkibidiGameContent 
        // Pass payment functions in case games need them in the future
        onSendPayment={onSendPayment}
        onReceivePayment={onReceivePayment}
        onGetTestCoins={onGetTestCoins}
        playerBalance={walletInfo?.balanceSat ?? activeAccount.balance}
        isLightningReady={breezConnected}
      />
    </ScrollView>
  );
}