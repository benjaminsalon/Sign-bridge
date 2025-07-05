import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface AnimationComponentProps {
  animationTracks: Record<string, number[][]>;
  fps?: number;
}

const AnimationComponent: React.FC<AnimationComponentProps> = ({ animationTracks, fps = 30 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const mixer = new THREE.AnimationMixer(scene);
    setMixer(mixer);
    setScene(scene);
    setRenderer(renderer);
    setCamera(camera);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!mixer || !scene) return;

    // Clear previous animations
    mixer.stopAllAction();
    scene.animations = [];

    // Create new animation clip from animationTracks
    const tracks = [];
    for (const [name, quaternions] of Object.entries(animationTracks)) {
      const times = quaternions.map((_, i) => i / fps);
      const flatQuats = quaternions.flat();
      tracks.push(new THREE.QuaternionKeyframeTrack(name, times, flatQuats));
    }
    const clip = new THREE.AnimationClip('signAnimation', -1, tracks);
    scene.animations.push(clip);

    const action = mixer.clipAction(clip);
    action.play();

  }, [animationTracks, mixer, scene, fps]);

  return <div ref={mountRef} style={{ width: '100%', height: '400px' }} />;
};

export default AnimationComponent;
