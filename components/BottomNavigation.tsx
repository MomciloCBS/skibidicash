import { Text, TouchableOpacity, Vibration, View } from "react-native";
import { styles } from "../styles/AppStyles";
import { SkibidiColors } from "../theme/SkibidiTheme";

// 📱 Bottom Navigation Component
export interface BottomNavProps {
    currentScreen: string;
    onNavigate: (screen: string) => void;
}
  
export function BottomNavigation({ currentScreen, onNavigate }: BottomNavProps) {
    const tabs = [
      { id: 'home', title: 'Home', icon: '🏠' },
      { id: 'swap', title: 'Swap', icon: '🔄' },
      { id: 'transactions', title: 'History', icon: '📊' },
      { id: 'game', title: 'Game', icon: '🎮' },
    ];
  
    return (
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.navTab,
              {
                backgroundColor: currentScreen === tab.id 
                  ? SkibidiColors.skibidiOrange + '40' 
                  : 'transparent',
              },
            ]}
            onPress={() => {
              Vibration.vibrate(30);
              onNavigate(tab.id);
            }}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.navText,
                {
                  color: currentScreen === tab.id 
                    ? SkibidiColors.skibidiOrange 
                    : SkibidiColors.textMuted,
                },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
}