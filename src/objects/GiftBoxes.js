import * as THREE from 'three/webgpu';

const REWARD_TYPES = [
    { geometry: 'Icosahedron', color: 0xffd700, emissive: 0xffa500, label: '金星' },
    { geometry: 'Octahedron', color: 0xff4444, emissive: 0xff0000, label: '红宝石' },
    { geometry: 'Torus', color: 0x44ff44, emissive: 0x00ff00, label: '翡翠环' },
    { geometry: 'Dodecahedron', color: 0x4488ff, emissive: 0x0044ff, label: '蓝宝石' },
    { geometry: 'Cone', color: 0xff88ff, emissive: 0xff00ff, label: '紫水晶' },
    { geometry: 'Tetrahedron', color: 0xffd700, emissive: 0xcc8800, label: '金钻' }
];

export class GiftBoxes {
    constructor(scene) {
        this.scene = scene;
        this.gifts = [];
        this.group = new THREE.Group();
        this.time = 0;
        this.selectedGift = null;
        this.collisionSpheres = [];
        this.goldParticleSystems = [];
        this.rewardObjects = [];
        this.openAnimations = [];
    }

    create() {
        const styles = [
            {
                boxColor: 0xff4444,
                ribbonColor: 0xffd700,
                size: { w: 0.8, h: 0.7, d: 0.8 },
                position: { x: -2.5, y: 0.35, z: 2 },
                rotation: 0.3
            },
            {
                boxColor: 0x4488ff,
                ribbonColor: 0xc0c0c0,
                size: { w: 0.6, h: 0.9, d: 0.6 },
                position: { x: 2, y: 0.45, z: 2.5 },
                rotation: -0.2
            },
            {
                boxColor: 0x44bb44,
                ribbonColor: 0xff6666,
                size: { w: 1.0, h: 0.5, d: 0.7 },
                position: { x: 0.5, y: 0.25, z: 3 },
                rotation: 0.1
            },
            {
                boxColor: 0xffd700,
                ribbonColor: 0x8b0000,
                size: { w: 0.5, h: 0.5, d: 0.5 },
                position: { x: -1.5, y: 0.25, z: 3.2 },
                rotation: -0.4
            },
            {
                boxColor: 0x9933ff,
                ribbonColor: 0xffffff,
                size: { w: 0.7, h: 0.8, d: 0.7 },
                position: { x: 1.5, y: 0.4, z: 1.5 },
                rotation: 0.5
            }
        ];

        styles.forEach((style, index) => {
            const gift = this.createGiftBox(style, index);
            this.gifts.push(gift);
            this.group.add(gift.group);

            const maxDim = Math.max(style.size.w, style.size.h, style.size.d);
            this.collisionSpheres.push({
                center: new THREE.Vector3(style.position.x, style.position.y, style.position.z),
                radius: maxDim * 0.7,
                giftIndex: index
            });
        });

        this.scene.add(this.group);
        return this.group;
    }

    createGiftBox(style, index) {
        const giftGroup = new THREE.Group();

        const boxGeometry = new THREE.BoxGeometry(style.size.w, style.size.h, style.size.d);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: style.boxColor,
            roughness: 0.4,
            metalness: 0.1
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.castShadow = true;
        box.receiveShadow = true;
        giftGroup.add(box);

        const ribbonThickness = 0.06;
        const ribbonHGeometry = new THREE.BoxGeometry(
            style.size.w + 0.02,
            ribbonThickness,
            style.size.d * 0.15
        );
        const ribbonMaterial = new THREE.MeshStandardMaterial({
            color: style.ribbonColor,
            roughness: 0.3,
            metalness: 0.4
        });
        const ribbonH = new THREE.Mesh(ribbonHGeometry, ribbonMaterial);
        ribbonH.position.y = style.size.h / 2 + ribbonThickness / 2 - 0.02;
        giftGroup.add(ribbonH);

        const ribbonVGeometry = new THREE.BoxGeometry(
            style.size.w * 0.15,
            ribbonThickness,
            style.size.d + 0.02
        );
        const ribbonV = new THREE.Mesh(ribbonVGeometry, ribbonMaterial.clone());
        ribbonV.position.y = style.size.h / 2 + ribbonThickness / 2 - 0.02;
        giftGroup.add(ribbonV);

        const lidPivot = new THREE.Group();
        lidPivot.position.y = style.size.h / 2;
        giftGroup.add(lidPivot);

        const lidHeight = style.size.h * 0.15;
        const lidGeometry = new THREE.BoxGeometry(style.size.w + 0.04, lidHeight, style.size.d + 0.04);
        const lidMaterial = new THREE.MeshStandardMaterial({
            color: style.boxColor,
            roughness: 0.4,
            metalness: 0.1
        });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = lidHeight / 2;
        lid.castShadow = true;
        lidPivot.add(lid);

        const lidRibbonHGeometry = new THREE.BoxGeometry(
            style.size.w + 0.06,
            ribbonThickness * 0.8,
            style.size.d * 0.15
        );
        const lidRibbonH = new THREE.Mesh(lidRibbonHGeometry, ribbonMaterial.clone());
        lidRibbonH.position.y = lidHeight + ribbonThickness * 0.4;
        lidPivot.add(lidRibbonH);

        const lidRibbonVGeometry = new THREE.BoxGeometry(
            style.size.w * 0.15,
            ribbonThickness * 0.8,
            style.size.d + 0.06
        );
        const lidRibbonV = new THREE.Mesh(lidRibbonVGeometry, ribbonMaterial.clone());
        lidRibbonV.position.y = lidHeight + ribbonThickness * 0.4;
        lidPivot.add(lidRibbonV);

        const bow = this.createBow(style.ribbonColor);
        bow.position.y = lidHeight + 0.1;
        bow.scale.setScalar(style.size.w * 0.4);
        lidPivot.add(bow);

        const innerLight = new THREE.PointLight(0xffd700, 0, 3);
        innerLight.position.y = style.size.h * 0.3;
        giftGroup.add(innerLight);

        giftGroup.position.set(style.position.x, style.position.y, style.position.z);
        giftGroup.rotation.y = style.rotation;

        giftGroup.userData = {
            originalY: style.position.y,
            phase: index * 0.5,
            isHovered: false,
            isSelected: false,
            isOpened: false,
            isAnimating: false,
            index: index
        };

        return {
            group: giftGroup,
            style: style,
            box: box,
            lidPivot: lidPivot,
            lid: lid,
            innerLight: innerLight,
            rewardMesh: null,
            rewardObject: null
        };
    }

    createBow(color) {
        const bowGroup = new THREE.Group();

        const loopGeometry = new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI);
        const bowMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.3
        });

        const leftLoop = new THREE.Mesh(loopGeometry, bowMaterial);
        leftLoop.rotation.x = Math.PI / 2;
        leftLoop.rotation.z = Math.PI / 4;
        leftLoop.position.x = -0.15;
        bowGroup.add(leftLoop);

        const rightLoop = new THREE.Mesh(loopGeometry, bowMaterial.clone());
        rightLoop.rotation.x = Math.PI / 2;
        rightLoop.rotation.z = -Math.PI / 4;
        rightLoop.position.x = 0.15;
        bowGroup.add(rightLoop);

        const knotGeometry = new THREE.SphereGeometry(0.12, 12, 12);
        const knot = new THREE.Mesh(knotGeometry, bowMaterial.clone());
        bowGroup.add(knot);

        const tailGeometry = new THREE.PlaneGeometry(0.15, 0.4);
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.3,
            side: THREE.DoubleSide
        });

        const leftTail = new THREE.Mesh(tailGeometry, tailMaterial);
        leftTail.rotation.x = -0.3;
        leftTail.rotation.z = 0.3;
        leftTail.position.set(-0.1, -0.15, 0.05);
        bowGroup.add(leftTail);

        const rightTail = new THREE.Mesh(tailGeometry, tailMaterial.clone());
        rightTail.rotation.x = -0.3;
        rightTail.rotation.z = -0.3;
        rightTail.position.set(0.1, -0.15, 0.05);
        bowGroup.add(rightTail);

        return bowGroup;
    }

    createRewardMesh(rewardType, style) {
        let geometry;
        const size = Math.min(style.size.w, style.size.d) * 0.2;

        switch (rewardType.geometry) {
            case 'Icosahedron':
                geometry = new THREE.IcosahedronGeometry(size, 0);
                break;
            case 'Octahedron':
                geometry = new THREE.OctahedronGeometry(size, 0);
                break;
            case 'Torus':
                geometry = new THREE.TorusGeometry(size * 0.7, size * 0.25, 12, 24);
                break;
            case 'Dodecahedron':
                geometry = new THREE.DodecahedronGeometry(size, 0);
                break;
            case 'Cone':
                geometry = new THREE.ConeGeometry(size * 0.7, size * 1.4, 6);
                break;
            case 'Tetrahedron':
                geometry = new THREE.TetrahedronGeometry(size, 0);
                break;
            default:
                geometry = new THREE.IcosahedronGeometry(size, 0);
        }

        const material = new THREE.MeshStandardMaterial({
            color: rewardType.color,
            emissive: rewardType.emissive,
            emissiveIntensity: 0.3,
            roughness: 0.2,
            metalness: 0.8
        });

        return new THREE.Mesh(geometry, material);
    }

    createGoldParticleSystem(position) {
        const particleCount = 60;
        const group = new THREE.Group();
        group.position.copy(position);

        const texture = this.createGoldParticleTexture();

        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 1.0,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                color: new THREE.Color().setHSL(0.1 + Math.random() * 0.08, 1.0, 0.5 + Math.random() * 0.3)
            });

            const sprite = new THREE.Sprite(spriteMaterial);
            const size = 0.03 + Math.random() * 0.06;
            sprite.scale.set(size, size, 1);

            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI * 0.6;
            const speed = 0.5 + Math.random() * 1.5;

            sprite.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(elevation) * speed,
                    Math.sin(elevation) * speed * 1.5 + 0.5,
                    Math.sin(angle) * Math.cos(elevation) * speed
                ),
                life: 1.0,
                decay: 0.3 + Math.random() * 0.5,
                baseSize: size
            };

            sprite.position.set(0, 0, 0);
            particles.push(sprite);
            group.add(sprite);
        }

        this.scene.add(group);

        const system = {
            group: group,
            particles: particles,
            elapsed: 0,
            duration: 2.5,
            active: true
        };

        this.goldParticleSystems.push(system);
        return system;
    }

    createGoldParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 64, 64);

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
        gradient.addColorStop(0, 'rgba(255, 223, 0, 1.0)');
        gradient.addColorStop(0.15, 'rgba(255, 200, 0, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 165, 0, 0.5)');
        gradient.addColorStop(0.7, 'rgba(255, 140, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();

        const innerGradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 12);
        innerGradient.addColorStop(0, 'rgba(255, 255, 200, 1.0)');
        innerGradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.6)');
        innerGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(32, 32, 12, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    checkCollision(raycaster) {
        const intersects = [];

        this.gifts.forEach((gift, index) => {
            if (gift.group.userData.isOpened) return;

            const box = gift.box;
            const intersection = raycaster.intersectObject(box);

            if (intersection.length > 0) {
                intersects.push({
                    distance: intersection[0].distance,
                    giftIndex: index,
                    point: intersection[0].point
                });
            }
        });

        intersects.sort((a, b) => a.distance - b.distance);

        return intersects.length > 0 ? intersects[0] : null;
    }

    onHover(giftIndex) {
        this.gifts.forEach((gift, i) => {
            gift.group.userData.isHovered = (i === giftIndex && !gift.group.userData.isOpened);
        });
    }

    onSelect(giftIndex, audioManager, snowSystem) {
        const gift = this.gifts[giftIndex];
        if (!gift) return;
        if (gift.group.userData.isOpened || gift.group.userData.isAnimating) return;

        gift.group.userData.isSelected = true;
        gift.group.userData.isAnimating = true;
        this.selectedGift = gift;

        if (audioManager) {
            audioManager.playGiftOpen();
        }

        this.animateOpen(gift, snowSystem);
    }

    animateOpen(gift, snowSystem) {
        const lidPivot = gift.lidPivot;
        const style = gift.style;
        const group = gift.group;

        const targetAngle = -Math.PI * 0.75;
        const duration = 0.8;
        let elapsed = 0;

        const rewardType = REWARD_TYPES[Math.floor(Math.random() * REWARD_TYPES.length)];
        const rewardMesh = this.createRewardMesh(rewardType, style);
        rewardMesh.position.y = style.size.h * 0.3;
        rewardMesh.scale.set(0, 0, 0);
        group.add(rewardMesh);
        gift.rewardMesh = rewardMesh;
        gift.rewardObject = rewardType;

        const innerLight = gift.innerLight;

        const animation = {
            gift: gift,
            elapsed: 0,
            duration: duration,
            targetAngle: targetAngle,
            phase: 'opening',
            rewardRiseDuration: 0.6,
            rewardRiseElapsed: 0,
            rewardFloatTime: 0,
            snowSystem: snowSystem
        };

        this.openAnimations.push(animation);
    }

    updateOpenAnimations(deltaTime) {
        for (let i = this.openAnimations.length - 1; i >= 0; i--) {
            const anim = this.openAnimations[i];
            const gift = anim.gift;

            if (anim.phase === 'opening') {
                anim.elapsed += deltaTime;
                const t = Math.min(anim.elapsed / anim.duration, 1);
                const easeOut = 1 - Math.pow(1 - t, 3);

                gift.lidPivot.rotation.x = anim.targetAngle * easeOut;

                gift.innerLight.intensity = easeOut * 2.0;

                if (t >= 1) {
                    anim.phase = 'rewardRise';
                    anim.elapsed = 0;

                    const worldPos = new THREE.Vector3();
                    gift.group.getWorldPosition(worldPos);
                    worldPos.y += gift.style.size.h;
                    this.createGoldParticleSystem(worldPos);

                    if (anim.snowSystem) {
                        anim.snowSystem.burstAt(worldPos, 15);
                    }
                }
            } else if (anim.phase === 'rewardRise') {
                anim.rewardRiseElapsed += deltaTime;
                const t = Math.min(anim.rewardRiseElapsed / anim.rewardRiseDuration, 1);

                const overshoot = 1.0 + 0.2 * Math.sin(t * Math.PI);
                const scaleVal = t < 0.8 ? t / 0.8 * overshoot : 1.0 + (1.0 - t) / 0.2 * (overshoot - 1.0);
                gift.rewardMesh.scale.setScalar(scaleVal);

                const targetY = gift.style.size.h + 0.15;
                const easeOutBack = t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2;
                gift.rewardMesh.position.y = gift.style.size.h * 0.3 + (targetY - gift.style.size.h * 0.3) * easeOutBack;

                if (t >= 1) {
                    anim.phase = 'rewardFloat';
                    gift.group.userData.isAnimating = false;
                    gift.group.userData.isOpened = true;
                    gift.group.userData.isSelected = false;
                }
            } else if (anim.phase === 'rewardFloat') {
                anim.rewardFloatTime += deltaTime;
                if (gift.rewardMesh) {
                    gift.rewardMesh.rotation.y += deltaTime * 1.5;
                    gift.rewardMesh.rotation.x = Math.sin(anim.rewardFloatTime * 2) * 0.15;
                    const baseY = gift.style.size.h + 0.15;
                    gift.rewardMesh.position.y = baseY + Math.sin(anim.rewardFloatTime * 3) * 0.03;
                }

                if (anim.rewardFloatTime > 8) {
                    anim.phase = 'fadeOut';
                    anim.elapsed = 0;
                    anim.duration = 1.0;
                }
            } else if (anim.phase === 'fadeOut') {
                anim.elapsed += deltaTime;
                const t = Math.min(anim.elapsed / anim.duration, 1);

                if (gift.rewardMesh) {
                    gift.rewardMesh.position.y += deltaTime * 0.3;
                    const s = 1 - t;
                    gift.rewardMesh.scale.setScalar(Math.max(0, s));
                    gift.rewardMesh.material.opacity = s;
                    gift.rewardMesh.material.transparent = true;
                }

                gift.innerLight.intensity = 2.0 * (1 - t);

                if (t >= 1) {
                    if (gift.rewardMesh) {
                        gift.group.remove(gift.rewardMesh);
                        gift.rewardMesh.geometry.dispose();
                        gift.rewardMesh.material.dispose();
                        gift.rewardMesh = null;
                    }

                    anim.phase = 'closing';
                    anim.elapsed = 0;
                    anim.duration = 0.6;
                }
            } else if (anim.phase === 'closing') {
                anim.elapsed += deltaTime;
                const t = Math.min(anim.elapsed / anim.duration, 1);
                const easeIn = t * t;

                gift.lidPivot.rotation.x = anim.targetAngle * (1 - easeIn);
                gift.innerLight.intensity = 0;

                if (t >= 1) {
                    gift.lidPivot.rotation.x = 0;
                    gift.innerLight.intensity = 0;
                    gift.group.userData.isOpened = false;
                    gift.group.userData.isAnimating = false;
                    this.openAnimations.splice(i, 1);
                }
            }
        }
    }

    updateGoldParticles(deltaTime) {
        for (let i = this.goldParticleSystems.length - 1; i >= 0; i--) {
            const system = this.goldParticleSystems[i];
            system.elapsed += deltaTime;

            if (system.elapsed >= system.duration) {
                this.scene.remove(system.group);
                system.particles.forEach(p => {
                    p.material.dispose();
                    if (p.material.map) p.material.map.dispose();
                });
                this.goldParticleSystems.splice(i, 1);
                continue;
            }

            const globalProgress = system.elapsed / system.duration;

            for (const sprite of system.particles) {
                const vel = sprite.userData.velocity;

                vel.y -= 1.5 * deltaTime;

                sprite.position.x += vel.x * deltaTime;
                sprite.position.y += vel.y * deltaTime;
                sprite.position.z += vel.z * deltaTime;

                sprite.userData.life -= sprite.userData.decay * deltaTime;

                const life = Math.max(0, sprite.userData.life);
                sprite.material.opacity = life;

                const currentSize = sprite.userData.baseSize * (0.5 + life * 0.5);
                sprite.scale.set(currentSize, currentSize, 1);
            }
        }
    }

    resetGift(giftIndex) {
        const gift = this.gifts[giftIndex];
        if (!gift) return;

        if (gift.rewardMesh) {
            gift.group.remove(gift.rewardMesh);
            gift.rewardMesh.geometry.dispose();
            gift.rewardMesh.material.dispose();
            gift.rewardMesh = null;
        }

        gift.lidPivot.rotation.x = 0;
        gift.innerLight.intensity = 0;
        gift.group.userData.isOpened = false;
        gift.group.userData.isAnimating = false;
    }

    update(deltaTime) {
        this.time += deltaTime;

        this.updateOpenAnimations(deltaTime);
        this.updateGoldParticles(deltaTime);

        this.gifts.forEach((gift) => {
            const userData = gift.group.userData;

            const float = Math.sin(this.time * 2 + userData.phase) * 0.03;
            if (!userData.isSelected && !userData.isAnimating) {
                gift.group.position.y = userData.originalY + float;
            }

            if (userData.isHovered && !userData.isOpened) {
                gift.group.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
            } else if (!userData.isAnimating) {
                gift.group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }
        });
    }

    dispose() {
        this.gifts.forEach((gift) => {
            if (gift.rewardMesh) {
                gift.rewardMesh.geometry.dispose();
                gift.rewardMesh.material.dispose();
            }
            gift.group.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        });

        this.goldParticleSystems.forEach(system => {
            this.scene.remove(system.group);
            system.particles.forEach(p => {
                p.material.dispose();
                if (p.material.map) p.material.map.dispose();
            });
        });
        this.goldParticleSystems = [];
        this.openAnimations = [];
    }
}
