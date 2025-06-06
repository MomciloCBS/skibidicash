import { ScrollView, View, Text } from "react-native";

import { styles } from "../styles/AppStyles";

export function SwapContent() {
    return (
      <ScrollView style={styles.contentContainer}>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderEmoji}>🔄</Text>
          <Text style={styles.placeholderTitle}>Swap Coming Soon!</Text>
          <Text style={styles.placeholderText}>Multi-account swapping with ordinals support.</Text>
        </View>
      </ScrollView>
    );
  }