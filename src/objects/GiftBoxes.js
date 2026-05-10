import * as THREE from 'three/webgpu';

/**
 * Gift Boxes with open animation, rewards, and particle effects
 */
export class GiftBoxes {
    constructor(scene, goldParticleSystem) {
        this.scene = scene;
        this.gifts = [];
        this.group = new THREE.Group();
        this.time = 0;
        this.selectedGift = null;
        this.goldParticleSystem = goldParticleSystem;
        this.openingGifts = new Map();

        this.collisionSpheres = [];
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

        const boxBodyGroup = new THREE.Group();
        const boxGeometry = new THREE.BoxGeometry(style.size.w, style.size.h, style.size.d);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: style.boxColor,
            roughness: 0.4,
            metalness: 0.1
        });
        const boxBody = new THREE.Mesh(boxGeometry, boxMaterial);
        boxBody.castShadow = true;
        boxBody.receiveShadow = true;
        boxBodyGroup.add(boxBody);

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
        ribbonH.position.y = -style.size.h / 2 + ribbonThickness / 2 + 0.02;
        boxBodyGroup.add(ribbonH);

        const ribbonVGeometry = new THREE.BoxGeometry(
            style.size.w * 0.15,
            ribbonThickness,
            style.size.d + 0.02
        );
        const ribbonV = new THREE.Mesh(ribbonVGeometry, ribbonMaterial.clone());
        ribbonV.position.y = -style.size.h / 2 + ribbonThickness / 2 + 0.02;
        boxBodyGroup.add(ribbonV);

        giftGroup.add(boxBodyGroup);

        const lidGroup = new THREE.Group();
        const lidGeometry = new THREE.BoxGeometry(style.size.w + 0.04, 0.08, style.size.d + 0.04);
        const lid = new THREE.Mesh(lidGeometry, boxMaterial.clone());
        lid.castShadow = true;
        lidGroup.add(lid);

        const lidRibbonH = new THREE.Mesh(ribbonHGeometry.clone(), ribbonMaterial.clone());
        lidRibbonH.position.y = 0.04;
        lidGroup.add(lidRibbonH);

        const lidRibbonV = new THREE.Mesh(ribbonVGeometry.clone(), ribbonMaterial.clone());
        lidRibbonV.position.y = 0.04;
        lidGroup.add(lidRibbonV);

        const bow = this.createBow(style.ribbonColor);
        bow.position.y = 0.15;
        bow.scale.setScalar(style.size.w * 0.4);
        lidGroup.add(bow);

        lidGroup.position.y = style.size.h / 2 + 0.04;
        lidGroup.userData.originalY = style.size.h / 2 + 0.04;
        lidGroup.userData.pivot = new THREE.Vector3(0, 0, -style.size.d / 2 - 0.02);
        giftGroup.add(lidGroup);

        giftGroup.position.set(style.position.x, style.position.y, style.position.z);
        giftGroup.rotation.y = style.rotation;

        giftGroup.userData = {
            originalY: style.position.y,
            phase: index * 0.5,
            isHovered: false,
            isSelected: false,
            isOpened: false,
            index: index
        };

        return {
            group: giftGroup,
            lidGroup: lidGroup,
            boxBodyGroup: boxBodyGroup,
            style: style,
            box: boxBody,
            reward: null
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

    createRandomReward() {
        const rewardTypes = ['sphere', 'cube', 'cylinder', 'cone', 'torus'];
        const colors = [0xffd700, 0xff69b4, 0x00ffff, 0xff6347, 0x9370db, 0x32cd32];
        const type = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];

        let geometry;
        switch (type) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.15, 16, 16);
                break;
            case 'cube':
                geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(0.12, 0.25, 12);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(0.1, 0.04, 8, 16);
                break;
        }

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.2,
            metalness: 0.6,
            emissive: color,
            emissiveIntensity: 0.3
        });

        const reward = new THREE.Mesh(geometry, material);
        reward.castShadow = true;
        reward.userData = {
            type: type,
            color: color,
            floatOffset: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 2
        };

        return reward;
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
            if (i === giftIndex && !gift.group.userData.isOpened) {
                gift.group.userData.isHovered = true;
            } else {
                gift.group.userData.isHovered = false;
            }
        });
    }

    onSelect(giftIndex, audioManager) {
        const gift = this.gifts[giftIndex];
        if (!gift || gift.group.userData.isOpened || this.openingGifts.has(giftIndex)) return;

        gift.group.userData.isSelected = true;
        this.selectedGift = gift;

        if (audioManager) {
            audioManager.playChime();
        }

        this.openGiftBox(gift, giftIndex);
    }

    openGiftBox(gift, giftIndex) {
        const lidGroup = gift.lidGroup;
        const style = gift.style;

        const reward = this.createRandomReward();
        reward.position.set(0, 0.1, 0);
        reward.scale.set(0, 0, 0);
        gift.group.add(reward);
        gift.reward = reward;

        const animationState = {
            lidProgress: 0,
            rewardProgress: 0,
            particlesTriggered: false,
            lidDuration: 0.6,
            rewardDelay: 0.3,
            rewardDuration: 0.5
        };

        this.openingGifts.set(giftIndex, {
            gift: gift,
            state: animationState
        });

        this.animateOpening(giftIndex, animationState);
    }

    animateOpening(giftIndex, state) {
        const openingData = this.openingGifts.get(giftIndex);
        if (!openingData) return;

        const gift = openingData.gift;
        const lidGroup = gift.lidGroup;
        const style = gift.style;

        const delta = 0.016;

        if (state.lidProgress < 1) {
            state.lidProgress = Math.min(state.lidProgress + delta / state.lidDuration, 1);
            const t = this.easeOutCubic(state.lidProgress);
            const rotationAngle = t * Math.PI * 0.75;

            const originalY = style.size.h / 2 + 0.04;
            const pivotZ = style.size.d / 2 + 0.02;

            const localPivot = new THREE.Vector3(0, 0, pivotZ);
            const lidOffset = new THREE.Vector3(0, 0, -pivotZ);
            lidOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rotationAngle);

            lidGroup.position.x = localPivot.x + lidOffset.x;
            lidGroup.position.y = localPivot.y + originalY + lidOffset.y;
            lidGroup.position.z = localPivot.z + lidOffset.z;

            lidGroup.rotation.x = -rotationAngle;
        }

        if (state.lidProgress >= 0.3 && state.rewardProgress < 1) {
            if (!state.particlesTriggered && this.goldParticleSystem) {
                state.particlesTriggered = true;
                const worldPos = new THREE.Vector3();
                gift.group.getWorldPosition(worldPos);
                worldPos.y += style.size.h / 2 + 0.5;
                this.goldParticleSystem.emitBurst(worldPos, 80);
            }

            state.rewardProgress = Math.min(state.rewardProgress + delta / state.rewardDuration, 1);
            const t = this.easeOutElastic(state.rewardProgress);
            if (gift.reward) {
                gift.reward.scale.setScalar(t);
                gift.reward.position.y = 0.1 + t * 0.5;
            }
        }

        if (state.lidProgress < 1 || state.rewardProgress < 1) {
            requestAnimationFrame(() => this.animateOpening(giftIndex, state));
        } else {
            gift.group.userData.isOpened = true;
            gift.group.userData.isSelected = false;
            this.openingGifts.delete(giftIndex);
        }
    }

    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        if (x === 0) return 0;
        if (x === 1) return 1;
        return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    update(deltaTime) {
        this.time += deltaTime;

        this.gifts.forEach((gift) => {
            const userData = gift.group.userData;

            if (!userData.isSelected && !userData.isOpened) {
                const float = Math.sin(this.time * 2 + userData.phase) * 0.03;
                gift.group.position.y = userData.originalY + float;
            }

            if (userData.isHovered) {
                gift.group.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
            } else {
                gift.group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }

            if (gift.reward && userData.isOpened) {
                const baseY = 0.6;
                gift.reward.position.y = baseY + Math.sin(this.time * 2 + gift.reward.userData.floatOffset) * 0.05;
                gift.reward.rotation.y += gift.reward.userData.rotationSpeed * deltaTime;
                gift.reward.rotation.x += gift.reward.userData.rotationSpeed * deltaTime * 0.5;
            }
        });
    }

    dispose() {
        this.gifts.forEach((gift) => {
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
    }
}
