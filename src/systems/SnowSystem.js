import * as THREE from 'three/webgpu';

/**
 * Snow Particle System with physics simulation
 * Uses Sprite-based particles for WebGPU compatibility
 */
export class SnowSystem {
    constructor(scene) {
        this.scene = scene;
        this.snowGroup = new THREE.Group();
        this.snowflakes = [];
        this.particleCount = 800; // Reduced for sprite-based system
        this.enabled = true;
        this.time = 0;

        // Physics parameters
        this.gravity = -2.0;
        this.windStrength = 0.5;
        this.turbulence = 0.3;

        // Bounds
        this.bounds = {
            x: { min: -15, max: 15 },
            y: { min: -2, max: 20 },
            z: { min: -15, max: 15 }
        };
    }

    create() {
        // Create snowflake texture
        const snowTexture = this.createSnowflakeTexture();

        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: snowTexture,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            color: 0xffffff
        });

        // Create snowflakes as sprites
        for (let i = 0; i < this.particleCount; i++) {
            const sprite = new THREE.Sprite(spriteMaterial.clone());

            // Random initial position
            sprite.position.set(
                Math.random() * (this.bounds.x.max - this.bounds.x.min) + this.bounds.x.min,
                Math.random() * (this.bounds.y.max - this.bounds.y.min) + this.bounds.y.min,
                Math.random() * (this.bounds.z.max - this.bounds.z.min) + this.bounds.z.min
            );

            // Random size
            const size = 0.05 + Math.random() * 0.1;
            sprite.scale.set(size, size, 1);

            // Store velocity and phase data
            sprite.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    -0.5 - Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.2
                ),
                phase: Math.random() * Math.PI * 2,
                baseSize: size
            };

            this.snowflakes.push(sprite);
            this.snowGroup.add(sprite);
        }

        this.scene.add(this.snowGroup);

        // Update particle count display
        const particleCountEl = document.getElementById('particle-count');
        if (particleCountEl) {
            particleCountEl.textContent = this.particleCount.toLocaleString();
        }

        return this.snowGroup;
    }

    createSnowflakeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Clear canvas with transparency
        ctx.clearRect(0, 0, 64, 64);

        // Create soft circular gradient for snowflake
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    resetSnowflake(sprite) {
        // Reset position to top
        sprite.position.set(
            Math.random() * (this.bounds.x.max - this.bounds.x.min) + this.bounds.x.min,
            this.bounds.y.max + Math.random() * 3,
            Math.random() * (this.bounds.z.max - this.bounds.z.min) + this.bounds.z.min
        );

        // Reset velocity
        sprite.userData.velocity.set(
            (Math.random() - 0.5) * 0.2,
            -0.5 - Math.random() * 0.5,
            (Math.random() - 0.5) * 0.2
        );
    }

    update(deltaTime) {
        if (!this.enabled) return;

        this.time += deltaTime;

        for (const sprite of this.snowflakes) {
            const vel = sprite.userData.velocity;
            const phase = sprite.userData.phase;

            // Apply gravity
            vel.y += this.gravity * deltaTime;

            // Apply wind (sinusoidal pattern)
            const windX = Math.sin(this.time * 0.5 + phase) * this.windStrength;
            const windZ = Math.cos(this.time * 0.3 + phase * 1.5) * this.windStrength * 0.5;

            vel.x += windX * deltaTime;
            vel.z += windZ * deltaTime;

            // Apply turbulence
            vel.x += (Math.random() - 0.5) * this.turbulence * deltaTime;
            vel.z += (Math.random() - 0.5) * this.turbulence * deltaTime;

            // Terminal velocity
            vel.y = Math.max(vel.y, -3);

            // Damping for horizontal movement
            vel.x *= 0.99;
            vel.z *= 0.99;

            // Update position
            sprite.position.x += vel.x * deltaTime;
            sprite.position.y += vel.y * deltaTime;
            sprite.position.z += vel.z * deltaTime;

            // Wrap around horizontally
            if (sprite.position.x < this.bounds.x.min) sprite.position.x = this.bounds.x.max;
            if (sprite.position.x > this.bounds.x.max) sprite.position.x = this.bounds.x.min;
            if (sprite.position.z < this.bounds.z.min) sprite.position.z = this.bounds.z.max;
            if (sprite.position.z > this.bounds.z.max) sprite.position.z = this.bounds.z.min;

            // Reset if below ground
            if (sprite.position.y < this.bounds.y.min) {
                this.resetSnowflake(sprite);
            }
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.snowGroup.visible = enabled;
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    setWindStrength(strength) {
        this.windStrength = strength;
    }

    burstAt(position, count = 15) {
        if (!this.enabled) return;

        const burstCount = Math.min(count, this.snowflakes.length);
        for (let i = 0; i < burstCount; i++) {
            const sprite = this.snowflakes[i];
            if (!sprite) continue;

            sprite.position.set(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + Math.random() * 0.3,
                position.z + (Math.random() - 0.5) * 0.5
            );

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 2.0;
            sprite.userData.velocity.set(
                Math.cos(angle) * speed * 0.5,
                speed,
                Math.sin(angle) * speed * 0.5
            );

            const burstSize = sprite.userData.baseSize * 1.5;
            sprite.scale.set(burstSize, burstSize, 1);
        }
    }

    setParticleCount(count) {
        const particleCountEl = document.getElementById('particle-count');
        if (particleCountEl) {
            particleCountEl.textContent = this.particleCount.toLocaleString();
        }
    }

    dispose() {
        for (const sprite of this.snowflakes) {
            sprite.material.dispose();
            if (sprite.material.map) {
                sprite.material.map.dispose();
            }
        }
        this.scene.remove(this.snowGroup);
        this.snowflakes = [];
    }
}
