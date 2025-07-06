import * as THREE from 'three';

const ThreeService = {
  load: async () => {
    // Placeholder for any async loading if needed
    return Promise.resolve();
  },
  QuaternionKeyframeTrack: THREE.QuaternionKeyframeTrack,
  AnimationClip: THREE.AnimationClip,
  VectorKeyframeTrack: THREE.VectorKeyframeTrack,
  AnimationMixer: THREE.AnimationMixer,
  Scene: THREE.Scene,
  PerspectiveCamera: THREE.PerspectiveCamera,
  WebGLRenderer: THREE.WebGLRenderer,
};

export default ThreeService;
