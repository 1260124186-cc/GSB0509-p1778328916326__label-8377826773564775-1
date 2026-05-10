import * as THREE from 'three/webgpu';

/**
 * Camera Manager - Handles camera setup and updates
 */
export class CameraManager {
    constructor() {
        this.camera = null;
        this.aspect = 1;
    }

    init(container) {
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        this.aspect = width / height;

        this.camera = new THREE.PerspectiveCamera(
            60,           // FOV
            this.aspect,  // Aspect ratio
            0.1,          // Near plane
            1000          // Far plane
        );

        // Set initial position
        this.camera.position.set(0, 5, 12);
        this.camera.lookAt(0, 2, 0);

        return this.camera;
    }

    resize(width, height) {
        this.aspect = width / height;
        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();
    }

    setPosition(x, y, z) {
        this.camera.position.set(x, y, z);
    }

    lookAt(x, y, z) {
        this.camera.lookAt(x, y, z);
    }

    get position() {
        return this.camera.position;
    }
}
