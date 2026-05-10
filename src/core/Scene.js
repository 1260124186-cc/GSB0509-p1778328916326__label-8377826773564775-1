import * as THREE from 'three/webgpu';

/**
 * Scene Manager - Creates and manages the 3D scene
 * Compatible with WebGPU and WebGL renderers
 */
export class SceneManager {
    constructor() {
        this.scene = null;
        this.background = null;
    }

    init() {
        this.scene = new THREE.Scene();
        this.createBackground();
        this.createFog();
        return this.scene;
    }

    createBackground() {
        // Create gradient background using shader
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Night sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0a1628');      // Deep navy at top
        gradient.addColorStop(0.3, '#1a2a4a');    // Dark blue
        gradient.addColorStop(0.6, '#2d3a5e');    // Lighter blue
        gradient.addColorStop(1, '#1f2d47');      // Medium blue at bottom

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 512);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        this.scene.background = texture;
    }

    createFog() {
        // Add atmospheric fog - use standard Fog for better WebGPU compatibility
        this.scene.fog = new THREE.Fog(0x1a2a4a, 10, 80);
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }

    dispose() {
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}
