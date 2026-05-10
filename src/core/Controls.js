import * as THREE from 'three/webgpu';

/**
 * Controls Manager - Handles mouse/touch camera controls
 */
export class ControlsManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = true;

        // Orbit parameters
        this.target = new THREE.Vector3(0, 2, 0);
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();

        // Damping
        this.dampingFactor = 0.05;
        this.rotateSpeed = 0.5;
        this.zoomSpeed = 1.0;

        // Constraints
        this.minDistance = 5;
        this.maxDistance = 25;
        this.minPolarAngle = 0.3;  // ~17 degrees
        this.maxPolarAngle = Math.PI / 2 - 0.1;

        // State
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.autoRotate = true;
        this.autoRotateSpeed = 0.3;

        // Touch
        this.touchStart = { x: 0, y: 0 };
        this.touchStartDistance = 0;

        this.init();
    }

    init() {
        // Calculate initial spherical coordinates
        const offset = new THREE.Vector3();
        offset.copy(this.camera.position).sub(this.target);
        this.spherical.setFromVector3(offset);

        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        // Mouse events
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

        // Touch events
        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Prevent context menu
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(event) {
        if (!this.enabled) return;
        event.preventDefault();

        this.isMouseDown = true;
        this.autoRotate = false;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    onMouseMove(event) {
        if (!this.enabled || !this.isMouseDown) return;

        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;

        this.rotateLeft(deltaX * this.rotateSpeed * 0.01);
        this.rotateUp(deltaY * this.rotateSpeed * 0.01);

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    onMouseUp() {
        this.isMouseDown = false;
        // Resume auto-rotate after a delay
        setTimeout(() => {
            if (!this.isMouseDown) {
                this.autoRotate = true;
            }
        }, 3000);
    }

    onMouseWheel(event) {
        if (!this.enabled) return;
        event.preventDefault();

        const delta = event.deltaY > 0 ? 1.1 : 0.9;
        this.dollyInOut(delta);
    }

    onTouchStart(event) {
        if (!this.enabled) return;
        event.preventDefault();

        this.autoRotate = false;

        if (event.touches.length === 1) {
            this.touchStart.x = event.touches[0].clientX;
            this.touchStart.y = event.touches[0].clientY;
        } else if (event.touches.length === 2) {
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }

    onTouchMove(event) {
        if (!this.enabled) return;
        event.preventDefault();

        if (event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - this.touchStart.x;
            const deltaY = event.touches[0].clientY - this.touchStart.y;

            this.rotateLeft(deltaX * this.rotateSpeed * 0.01);
            this.rotateUp(deltaY * this.rotateSpeed * 0.01);

            this.touchStart.x = event.touches[0].clientX;
            this.touchStart.y = event.touches[0].clientY;
        } else if (event.touches.length === 2) {
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const delta = this.touchStartDistance / distance;
            this.dollyInOut(delta);

            this.touchStartDistance = distance;
        }
    }

    onTouchEnd() {
        setTimeout(() => {
            this.autoRotate = true;
        }, 3000);
    }

    rotateLeft(angle) {
        this.sphericalDelta.theta -= angle;
    }

    rotateUp(angle) {
        this.sphericalDelta.phi -= angle;
    }

    dollyInOut(scale) {
        this.spherical.radius *= scale;
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
    }

    update(deltaTime = 0.016) {
        if (!this.enabled) return;

        // Auto rotate
        if (this.autoRotate) {
            this.rotateLeft(this.autoRotateSpeed * deltaTime);
        }

        // Apply damping
        this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
        this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;

        // Constrain polar angle
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));

        // Apply spherical coordinates to camera position
        const offset = new THREE.Vector3();
        offset.setFromSpherical(this.spherical);
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);

        // Decay delta
        this.sphericalDelta.theta *= (1 - this.dampingFactor);
        this.sphericalDelta.phi *= (1 - this.dampingFactor);
    }

    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.domElement.removeEventListener('mouseup', this.onMouseUp);
        this.domElement.removeEventListener('wheel', this.onMouseWheel);
        this.domElement.removeEventListener('touchstart', this.onTouchStart);
        this.domElement.removeEventListener('touchmove', this.onTouchMove);
        this.domElement.removeEventListener('touchend', this.onTouchEnd);
    }
}
