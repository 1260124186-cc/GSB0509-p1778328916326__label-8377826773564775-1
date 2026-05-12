import * as THREE from 'three/webgpu';

/**
 * Gold Particle System for gift box opening effects
 * Burst-style particles with physics simulation
 */
export class GoldParticles {
    constructor(scene) {
        this.scene = scene;
        this.particlesGroup = new THREE.Group();
        this.particles = [];
        this.particlePool = [];
        this.maxParticles = 500;

        this.gravity = -3.0;
        this.time = 0;

        this.createParticleTexture();
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 64, 64);

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
        gradient.addColorStop(0, 'rgba(255, 223, 0, 1.0)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 180, 0, 0.6)');
        gradient.addColorStop(0.6, 'rgba(255, 150, 0, 0.3)');
        gradient.addColorStop(0.8, 'rgba(255, 120, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();

        this.particleTexture = new THREE.CanvasTexture(canvas);
        this.particleTexture.needsUpdate = true;

        this.spriteMaterial = new THREE.SpriteMaterial({
            map: this.particleTexture,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            color: 0xffd700
        });
    }

    createParticle() {
        const sprite = new THREE.Sprite(this.spriteMaterial.clone());

        sprite.userData = {
            velocity: new THREE.Vector3(),
            life: 0,
            maxLife: 1,
            active: false,
            baseSize: 0.1
        };

        sprite.visible = false;
        this.particlesGroup.add(sprite);

        return sprite;
    }

    initPool() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlePool.push(this.createParticle());
        }
        this.scene.add(this.particlesGroup);
    }

    getParticleFromPool() {
        for (const particle of this.particlePool) {
            if (!particle.userData.active) {
                return particle;
            }
        }

        const particle = this.createParticle();
        this.particlePool.push(particle);
        return particle;
    }

    burst(position, count = 30) {
        const particlesToEmit = Math.min(count, this.maxParticles - this.getActiveParticleCount());

        for (let i = 0; i < particlesToEmit; i++) {
            const particle = this.getParticleFromPool();
            this.emitParticle(particle, position);
        }
    }

    emitParticle(particle, position) {
        const userData = particle.userData;

        particle.position.copy(position);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.5;
        const speed = 2 + Math.random() * 4;

        userData.velocity.set(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed + 1,
            Math.sin(phi) * Math.sin(theta) * speed
        );

        userData.life = 0;
        userData.maxLife = 1.5 + Math.random() * 1.5;
        userData.active = true;
        userData.baseSize = 0.08 + Math.random() * 0.12;

        particle.scale.setScalar(userData.baseSize);
        particle.visible = true;
        particle.material.opacity = 1.0;

        const hue = 0.1 + Math.random() * 0.05;
        particle.material.color.setHSL(hue, 1.0, 0.5 + Math.random() * 0.3);
    }

    getActiveParticleCount() {
        let count = 0;
        for (const particle of this.particlePool) {
            if (particle.userData.active) count++;
        }
        return count;
    }

    update(deltaTime) {
        this.time += deltaTime;

        for (const particle of this.particlePool) {
            const userData = particle.userData;

            if (!userData.active) continue;

            userData.life += deltaTime;

            if (userData.life >= userData.maxLife) {
                userData.active = false;
                particle.visible = false;
                continue;
            }

            userData.velocity.y += this.gravity * deltaTime;

            userData.velocity.x *= 0.98;
            userData.velocity.z *= 0.98;

            particle.position.x += userData.velocity.x * deltaTime;
            particle.position.y += userData.velocity.y * deltaTime;
            particle.position.z += userData.velocity.z * deltaTime;

            const lifeRatio = userData.life / userData.maxLife;
            const fadeOut = 1 - Math.pow(lifeRatio, 2);
            particle.material.opacity = fadeOut;

            const sizeScale = 1 + lifeRatio * 0.5;
            particle.scale.setScalar(userData.baseSize * sizeScale * fadeOut);
        }
    }

    dispose() {
        for (const particle of this.particlePool) {
            particle.material.dispose();
            if (particle.material.map) {
                particle.material.map.dispose();
            }
        }
        this.scene.remove(this.particlesGroup);
        this.particlePool = [];
    }
}
