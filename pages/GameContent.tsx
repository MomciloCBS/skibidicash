import { ScrollView, View, Text } from "react-native";
import { styles } from "../styles/AppStyles";
import { SkibidiGameContent } from "../components/GameContent";

export function GameContent() {
    return (
      <ScrollView style={styles.contentContainer}>
        <SkibidiGameContent />
      </ScrollView>
    );
  }