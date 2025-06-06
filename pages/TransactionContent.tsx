import { ScrollView, View, Text } from "react-native";

import { styles } from "../styles/AppStyles";

export function TransactionsContent() {
    return (
      <ScrollView style={styles.contentContainer}>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderEmoji}>📊</Text>
          <Text style={styles.placeholderTitle}>Transaction History</Text>
          <Text style={styles.placeholderText}>Track payments and ordinal transfers.</Text>
        </View>
      </ScrollView>
    );
}