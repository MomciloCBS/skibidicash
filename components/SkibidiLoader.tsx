import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SkibidiColors } from '../theme/SkibidiTheme';

const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Skibidi Loader</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { 
        margin: 0; 
        overflow: hidden; 
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
      }
      .loading-container {
        text-align: center;
        color: rgba(255, 255, 255, 0.9);
        font-size: 18px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-top: 5px solid rgba(255, 255, 255, 1);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 20px;
      }
      .meme-text {
        font-size: 16px;
        transition: opacity 0.1s ease;
        min-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="loading-container">
      <div class="spinner"></div>
      <div id="meme-text" class="meme-text">🚽 Spawning Skibidi...</div>
    </div>

    <script>
      // 🔥 MEME MESSAGES ARRAY
      const memeMessages = [
        "🗿 Summoning Sigma...",
        "💀 Loading Ohio Energy...",
        "😎 Downloading Rizz...",
        "🔥 Calibrating Chaos...",
        "🧠 Buffering Brainrot...",
        "💀 Installing Cringe...",
        "🗿 Generating Gigachad...",
        "👨‍🍳 Cooking Content...",
        "🎭 Spawning Shenanigans...",
        "🌪️ Brewing Madness...",
        "⚡ Charging Charisma...",
        "✨ Activating Aura...",
        "🏆 Loading Legends...",
        "💧 Downloading Drip...",
        "🤪 Installing Insanity...",
        "😂 Generating Giggles...",
        "💯 Buffering Based...",
        "🔥 Cooking Chaos...",
        "🚽 Spawning Skibidi...",
        "📚 Loading Lore...",
        "🎮 Booting Brainrot...",
        "🤯 Processing Sigma...",
        "💪 Flexing on Ohio...",
        "🎯 Targeting Cringe...",
        "🌟 Manifesting Memes...",
        "🎪 Circus Mode Active...",
        "🔮 Predicting Chaos...",
        "🎲 Rolling Sigma...",
        "🌈 Rainbow Rizz Loading...",
        "🎭 Drama Mode Engaged..."
      ];

      let messageInterval;

      // 🎭 START MEME CHAOS FUNCTION
      function startMemeMessages() {
        const textElement = document.getElementById('meme-text');
        
        if (textElement) {
          console.log('🎭 Starting meme chaos!');
          
          // Change message immediately on start
          textElement.textContent = memeMessages[Math.floor(Math.random() * memeMessages.length)];
          
          // Continue cycling messages
          messageInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * memeMessages.length);
            textElement.textContent = memeMessages[randomIndex];
          }, 150); // Fast cycling every 150ms
        }
      }

      // 🚀 START MEMES IMMEDIATELY - Multiple triggers for reliability
      document.addEventListener('DOMContentLoaded', startMemeMessages);
      
      // Backup triggers
      setTimeout(startMemeMessages, 10);   // Almost immediate
      setTimeout(startMemeMessages, 100);  // Secondary backup
      
      // Also start when scripts are ready
      window.addEventListener('load', startMemeMessages);

      // Optional: Stop messages after a certain time (if needed)
      // setTimeout(() => {
      //   if (messageInterval) {
      //     clearInterval(messageInterval);
      //   }
      // }, 10000); // Stop after 10 seconds
    </script>
  </body>
</html>
`;

interface SkibidiLoaderProps {
  onLoadComplete?: () => void;
  duration?: number; // Optional duration in milliseconds
}

const SkibidiLoader: React.FC<SkibidiLoaderProps> = ({ onLoadComplete, duration = 3000 }) => {
  React.useEffect(() => {
    if (onLoadComplete && duration) {
      const timer = setTimeout(onLoadComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [onLoadComplete, duration]);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}activeAccount
        opaque={false}
        backgroundColor="transparent"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: SkibidiColors.darkChaos,
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    zIndex: 1000,
  },
  webview: { 
    flex: 1,
    backgroundColor: 'transparent'
  },
});

export default SkibidiLoader;