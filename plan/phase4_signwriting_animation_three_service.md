# ThreeService in sign.mt Repository

## Overview

- The `ThreeService` is an Angular injectable service that dynamically imports the `three` library.
- It provides access to various Three.js classes and utilities used for 3D rendering and animation.
- The service loads the `three` module asynchronously and caches the import promise for reuse.
- It exposes getters for key Three.js classes such as:
  - `Vector2`, `Vector3`
  - `Box3`, `Plane`
  - `VectorKeyframeTrack`, `QuaternionKeyframeTrack`
  - `AnimationClip`

## Usage in AnimationComponent

- The `AnimationComponent` uses `ThreeService` to create and manage animation tracks and clips.
- This abstraction allows lazy loading of the heavy `three` library only when needed.
- The service facilitates creating keyframe tracks for quaternion animations and playing animation clips on the 3D scene.

## Potential Use in SignBridge

- Use a similar service pattern in the SignBridge frontend (Tauri with JavaScript/TypeScript) to manage Three.js imports and utilities.
- Leverage the provided classes to build smooth SignWriting animations.
- Optimize loading and performance by lazy loading Three.js only when animation rendering is active.

## Next Steps

- Review other related services like `AssetsService` for asset management.
- Explore the animation state management and how animation data is structured and updated.
- Plan integration of Three.js animation rendering into the SignBridge frontend.
