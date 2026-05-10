import * as THREE from 'three/webgpu';

/**
 * Gold Particle System for gift box opening effects
 */
export class GoldParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particlesGroup = new THREE.Group();
        this.particles = [];
        this.maxParticles = 500;
        this.enabled = true;
        this.time = 0;
    }

    create() {
        this.scene.add(this.particlesGroup);
        return this.particlesGroup;
    }

    createGoldTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 64, 64);

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
        gradient.addColorStop(0, 'rgba(255, 223, 0, 1.0)');
        gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.9)');
        gradient.addColorStop(0.6, 'rgba(255, 180, 0, 0.5)');
        gradient.addColorStop(0.85, 'rgba(255, 150, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 120, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    emitBurst(position, count = 50) {
        if (!this.enabled) return;

        const goldTexture = this.createGoldTexture();
        const spriteMaterial = new THREE.SpriteMaterial({
            map: goldTexture,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            color: 0xffd700
        });

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                const oldest = this.particles.shift();
                if (oldest && oldest.parent) {
                    oldest.parent.remove(oldest);
                }
                if (oldest && oldest.material) {
                    oldest.material.map?.dispose();
                    oldest.material.dispose();
                }
            }

            const sprite = new THREE.Sprite(spriteMaterial.clone());
            sprite.position.copy(position);

            const size = 0.08 + Math.random() * 0.12;
            sprite.scale.set(size, size, 1);

            const speed = 2 + Math.random() * 4;
            const angle = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(angle) * speed,
                Math.cos(phi) * speed + 1,
                Math.sin(phi) * Math.sin(angle) * speed
            );

            sprite.userData = {
                velocity: velocity,
                lifetime: 1.5 + Math.random() * 1.0,
                maxLifetime: 1.5 + Math.random() * 1.0,
                gravity: -5,
                baseSize: size
            };

            this.particles.push(sprite);
            this.particlesGroup.add(sprite);
        }
    }

    update(deltaTime) {
        if (!this.enabled) return;

        this.time += deltaTime;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const userData = particle.userData;

            userData.velocity.y += userData.gravity * deltaTime;

            particle.position.x += userData.velocity.x * deltaTime;
            particle.position.y += userData.velocity.y * deltaTime;
            particle.position.z += userData.velocity.z * deltaTime;

            userData.lifetime -= deltaTime;

            const alpha = Math.max(0, userData.lifetime / userData.maxLifetime);
            particle.material.opacity = alpha;

            const scale = alpha * 0.8 + 0.2;
            particle.scale.set(userData.baseSize * scale, userData.baseSize * scale, 1);

            if (userData.lifetime <= 0) {
                this.particles.splice(i, 1);
                particle.parent?.remove(particle);
                particle.material.map?.dispose();
                particle.material.dispose();
            }
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.particlesGroup.visible = enabled;
    }

    dispose() {
        for (const particle of this.particles) {
            particle.material.map?.dispose();
            particle.material.dispose();
        }
        this.scene.remove(this.particlesGroup);
        this.particles = [];
    }
}
