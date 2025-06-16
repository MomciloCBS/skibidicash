import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SkibidiColors } from '../theme/SkibidiTheme';

interface Skibidi3DSceneProps {
  glbUrl?: string;
  modelScale?: number;
  rotationSpeed?: number;
  backgroundColor?: string;
  onModelLoaded?: () => void;
  onModelError?: (error: string) => void;
}

const Skibidi3DScene: React.FC<Skibidi3DSceneProps> = ({
  glbUrl = "https://files.catbox.moe/da1exr.glb",
  modelScale = 2,
  rotationSpeed = 0.1,
  backgroundColor = "transparent",
  onModelLoaded,
  onModelError
}) => {
  const webViewRef = useRef<any>(null);

  // Update rotation speed dynamically
  useEffect(() => {
    if (webViewRef.current) {
      const updateSpeedScript = `
        if (window.updateRotationSpeed) {
          window.updateRotationSpeed(${rotationSpeed});
        }
        true; // Return value for injectedJavaScript
      `;
      webViewRef.current.injectJavaScript(updateSpeedScript);
    }
  }, [rotationSpeed]);

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Skibidi 3D Scene</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * {
        margin: 0;
        padding: 0;
        background: transparent !important;
      }
      html, body { 
        margin: 0; 
        padding: 0;
        overflow: hidden; 
        background: transparent !important;
        background-color: transparent !important;
        width: 100%;
        height: 100%;
      }
      canvas { 
        display: block;
        width: 100%; 
        height: 100vh;
        opacity: 1;
        background: transparent !important;
        background-color: transparent !important;
      }
      .loading-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(255, 255, 255, 0.9);
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: bold;
        text-align: center;
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.5s ease;
        z-index: 10;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        background: transparent !important;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid rgba(255, 255, 255, 1);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 15px;
        background: transparent !important;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
  </head>
  <body>
    <!-- Loading indicator for 3D model -->
    <div id="loading-overlay" class="loading-overlay">
      <div class="spinner"></div>
      <div>Flushing ...</div>
    </div>

    <script>
      // Load GLTFLoader
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
      script.onload = initScene;
      document.head.appendChild(script);

      // Global variables for dynamic updates
      let currentRotationSpeed = ${rotationSpeed};
      let targetRotationSpeed = ${rotationSpeed};
      
      // Function to update rotation speed from React Native
      window.updateRotationSpeed = function(newSpeed) {
        targetRotationSpeed = newSpeed;
        console.log('🔄 Updated target rotation speed to:', newSpeed);
      };

      function initScene() {
        console.log('🚀 Initializing 3D Skibidi scene...');
        
        const scene = new THREE.Scene();
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.background = 'transparent';
        document.body.appendChild(renderer.domElement);

        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Add rim light for dramatic effect
        const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        rimLight.position.set(-5, 3, -5);
        scene.add(rimLight);

        // Add dynamic colored lights for speed effects
        const speedLight1 = new THREE.PointLight(0xff6b35, 0, 10);
        speedLight1.position.set(3, 0, 3);
        scene.add(speedLight1);
        
        const speedLight2 = new THREE.PointLight(0x35ff6b, 0, 10);
        speedLight2.position.set(-3, 0, 3);
        scene.add(speedLight2);

        const loader = new THREE.GLTFLoader();
        let model;
        let materialList = [];
        let fadeStartTime = null;
        const fadeDuration = 2000; // 2 seconds fade-in
        
        loader.load('${glbUrl}', (gltf) => {
          console.log('🎯 GLB loaded successfully!');
          model = gltf.scene;
          model.scale.set(${modelScale}, ${modelScale}, ${modelScale});
          
          // ✨ Make all materials transparent and invisible initially for fade effect
          model.traverse((child) => {
            if (child.isMesh && child.material) {
              const material = child.material;
              
              const materials = Array.isArray(material) ? material : [material];
              
              materials.forEach((mat) => {
                mat.userData.originalTransparent = mat.transparent;
                mat.userData.originalOpacity = mat.opacity;
                
                mat.transparent = true;
                mat.opacity = 0;
                mat.needsUpdate = true;
                
                materialList.push(mat);
              });
            }
          });
          
          scene.add(model);
          
          // Hide loading overlay
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
              loadingOverlay.style.display = 'none';
            }, 500);
          }
          
          // Start fade-in effect
          fadeStartTime = Date.now();
          
          // Notify React Native that model loaded
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MODEL_LOADED'
            }));
          }
          
          animate();
        }, 
        // Progress callback
        (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(\`📡 Loading progress: \${percent}%\`);
            
            // Update loading text with progress
            const loadingText = document.querySelector('#loading-overlay div:last-child');
            if (loadingText) {
              loadingText.textContent = \`Flushing... \${percent}%\`;
            }
          }
        },
        // Error callback
        (error) => {
          console.error('💀 GLB Load Error:', error);
          
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) {
            const textElement = loadingOverlay.querySelector('div:last-child');
            if (textElement) {
              textElement.textContent = '💀 Sigma Summoning Failed!';
              textElement.style.color = '#ff6b6b';
            }
          }
          
          // Notify React Native of error
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MODEL_ERROR',
              error: error.message || 'Failed to load 3D model'
            }));
          }
        });

        camera.position.set(0, 0, 5);

        function animate() {
          requestAnimationFrame(animate);
          
          if (model) {
            // ✨ Handle fade-in effect
            if (fadeStartTime && materialList.length > 0) {
              const elapsed = Date.now() - fadeStartTime;
              const fadeProgress = Math.min(elapsed / fadeDuration, 1);
              
              // Smooth easing function (ease-out)
              const easedProgress = 1 - Math.pow(1 - fadeProgress, 3);
              
              // Update opacity for all materials
              materialList.forEach((material) => {
                const targetOpacity = material.userData.originalOpacity || 1;
                material.opacity = easedProgress * targetOpacity;
                material.needsUpdate = true;
              });
              
              // Stop fade effect when complete
              if (fadeProgress >= 1) {
                fadeStartTime = null;
                // Restore original transparency settings
                materialList.forEach((material) => {
                  material.transparent = material.userData.originalTransparent;
                  material.needsUpdate = true;
                });
              }
            }
            
            // 🔄 Smooth rotation speed transitions
            const speedDiff = targetRotationSpeed - currentRotationSpeed;
            currentRotationSpeed += speedDiff * 0.1; // Smooth interpolation
            
            // 🚀 Spinning animation with dynamic speed
            model.rotation.y += currentRotationSpeed;
            
            // ✨ Speed-based effects
            const speedIntensity = Math.min(currentRotationSpeed / 0.2, 1); // Normalize to 0-1
            
            // Dynamic lighting based on speed
            speedLight1.intensity = speedIntensity * 0.5;
            speedLight2.intensity = speedIntensity * 0.3;
            
            // Subtle floating effect during fade or high speed
            if (fadeStartTime || speedIntensity > 0.5) {
              const time = Date.now() * 0.002;
              model.position.y = Math.sin(time * (1 + speedIntensity)) * (0.1 + speedIntensity * 0.1);
            }
            
            // Camera shake effect at very high speeds
            if (speedIntensity > 0.8) {
              const shakeIntensity = (speedIntensity - 0.8) * 0.1;
              camera.position.x = Math.sin(Date.now() * 0.02) * shakeIntensity;
              camera.position.z = 5 + Math.cos(Date.now() * 0.015) * shakeIntensity;
            } else {
              camera.position.x = 0;
              camera.position.z = 5;
            }
          }
          
          renderer.render(scene, camera);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
      }
    </script>
  </body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'MODEL_LOADED':
          onModelLoaded?.();
          break;
        case 'MODEL_ERROR':
          onModelError?.(data.error);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        opaque={backgroundColor !== 'transparent'}
        backgroundColor={backgroundColor}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: { 
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default Skibidi3DScene;