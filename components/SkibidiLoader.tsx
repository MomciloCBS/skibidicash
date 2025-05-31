import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Skibidi Toilet 3D</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; overflow: hidden; }
      canvas { width: 100%; height: 100% }
    </style>
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.155.0/examples/js/loaders/GLTFLoader.js"></script>

    <script>
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      const loader = new THREE.GLTFLoader();
      loader.load('../assets/models/skibidi.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.2, 1.2, 1.2);
        scene.add(model);
        animate(model);
      }, undefined, (error) => {
        console.error('GLB Load Error:', error);
      });

      camera.position.z = 2;

      function animate(model) {
        function frame() {
          requestAnimationFrame(frame);
          model.rotation.y += 0.01;
          renderer.render(scene, camera);
        }
        frame();
      }
    </script>
  </body>
</html>
`;

const SkibidiLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'red', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  webview: { flex: 1 },
});

export default SkibidiLoader;