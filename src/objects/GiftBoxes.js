import * as THREE from 'three/webgpu';

/**
 * Gift Boxes with opening animation, gold particles, and random rewards
 */
export class GiftBoxes {
    constructor(scene, goldParticles = null) {
        this.scene = scene;
        this.gifts = [];
        this.group = new THREE.Group();
        this.time = 0;
        this.selectedGift = null;
        this.goldParticles = goldParticles;

        // Collision bounds
        this.collisionSpheres = [];

        // Reward types
        this.rewardTypes = ['cube', 'sphere', 'cone', 'torus', 'octahedron'];
    }

    create() {
        // Define 5 different gift box styles
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

            // Create collision sphere
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
        const lidGroup = new THREE.Group();

        // Main box body (bottom part)
        const boxBodyHeight = style.size.h * 0.85;
        const boxGeometry = new THREE.BoxGeometry(style.size.w, boxBodyHeight, style.size.d);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: style.boxColor,
            roughness: 0.4,
            metalness: 0.1
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.castShadow = true;
        box.receiveShadow = true;
        box.position.y = -style.size.h * 0.075;
        giftGroup.add(box);

        // Box interior (darker version for inside look)
        const interiorMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(style.boxColor).multiplyScalar(0.5),
            roughness: 0.6,
            metalness: 0.05,
            side: THREE.BackSide
        });
        const interiorGeometry = new THREE.BoxGeometry(
            style.size.w * 0.95,
            boxBodyHeight * 0.9,
            style.size.d * 0.95
        );
        const interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
        interior.position.y = -style.size.h * 0.075;
        giftGroup.add(interior);

        // Box lid (top part)
        const lidHeight = style.size.h * 0.2;
        const lidGeometry = new THREE.BoxGeometry(
            style.size.w + 0.04,
            lidHeight,
            style.size.d + 0.04
        );
        const lid = new THREE.Mesh(lidGeometry, boxMaterial.clone());
        lid.castShadow = true;
        lid.receiveShadow = true;
        lid.position.y = boxBodyHeight / 2 + lidHeight / 2 - style.size.h * 0.075;
        lidGroup.add(lid);

        // Lid rim (slightly larger border)
        const rimGeometry = new THREE.BoxGeometry(
            style.size.w + 0.08,
            lidHeight * 0.3,
            style.size.d + 0.08
        );
        const rim = new THREE.Mesh(rimGeometry, boxMaterial.clone());
        rim.position.y = lid.position.y - lidHeight / 2 + lidHeight * 0.15;
        lidGroup.add(rim);

        // Horizontal ribbon on lid
        const ribbonThickness = 0.06;
        const ribbonHGeometry = new THREE.BoxGeometry(
            style.size.w + 0.06,
            ribbonThickness,
            style.size.d * 0.15
        );
        const ribbonMaterial = new THREE.MeshStandardMaterial({
            color: style.ribbonColor,
            roughness: 0.3,
            metalness: 0.4
        });
        const ribbonH = new THREE.Mesh(ribbonHGeometry, ribbonMaterial);
        ribbonH.position.y = lid.position.y + lidHeight / 2 - 0.01;
        lidGroup.add(ribbonH);

        // Vertical ribbon on lid
        const ribbonVGeometry = new THREE.BoxGeometry(
            style.size.w * 0.15,
            ribbonThickness,
            style.size.d + 0.06
        );
        const ribbonV = new THREE.Mesh(ribbonVGeometry, ribbonMaterial.clone());
        ribbonV.position.y = lid.position.y + lidHeight / 2 - 0.01;
        lidGroup.add(ribbonV);

        // Vertical ribbon going down the box
        const ribbonVBoxGeometry = new THREE.BoxGeometry(
            style.size.w * 0.15,
            boxBodyHeight * 1.1,
            ribbonThickness
        );
        const ribbonVBox1 = new THREE.Mesh(ribbonVBoxGeometry, ribbonMaterial.clone());
        ribbonVBox1.position.set(0, -style.size.h * 0.075, style.size.d / 2 + ribbonThickness / 2);
        giftGroup.add(ribbonVBox1);

        const ribbonVBox2 = new THREE.Mesh(ribbonVBoxGeometry, ribbonMaterial.clone());
        ribbonVBox2.position.set(0, -style.size.h * 0.075, -style.size.d / 2 - ribbonThickness / 2);
        giftGroup.add(ribbonVBox2);

        // Bow on lid
        const bow = this.createBow(style.ribbonColor);
        bow.position.y = lid.position.y + lidHeight / 2 + 0.05;
        bow.scale.setScalar(style.size.w * 0.4);
        lidGroup.add(bow);

        // Set lid pivot at the front edge for rotation (opens backward away from camera)
        lidGroup.position.y = -lid.position.y;
        const lidPivot = new THREE.Group();
        lidPivot.add(lidGroup);
        lidPivot.position.set(0, lid.position.y, -style.size.d / 2);
        giftGroup.add(lidPivot);

        // Position and rotation
        giftGroup.position.set(style.position.x, style.position.y, style.position.z);
        giftGroup.rotation.y = style.rotation;

        // Store original position for animation
        giftGroup.userData = {
            originalY: style.position.y,
            phase: index * 0.5,
            isHovered: false,
            isSelected: false,
            isOpened: false,
            isOpening: false,
            index: index,
            lidPivot: lidPivot,
            openProgress: 0,
            reward: null
        };

        return {
            group: giftGroup,
            style: style,
            box: box,
            lidPivot: lidPivot
        };
    }

    createBow(color) {
        const bowGroup = new THREE.Group();

        // Bow loops
        const loopGeometry = new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI);
        const bowMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.3
        });

        // Left loop
        const leftLoop = new THREE.Mesh(loopGeometry, bowMaterial);
        leftLoop.rotation.x = Math.PI / 2;
        leftLoop.rotation.z = Math.PI / 4;
        leftLoop.position.x = -0.15;
        bowGroup.add(leftLoop);

        // Right loop
        const rightLoop = new THREE.Mesh(loopGeometry, bowMaterial.clone());
        rightLoop.rotation.x = Math.PI / 2;
        rightLoop.rotation.z = -Math.PI / 4;
        rightLoop.position.x = 0.15;
        bowGroup.add(rightLoop);

        // Center knot
        const knotGeometry = new THREE.SphereGeometry(0.12, 12, 12);
        const knot = new THREE.Mesh(knotGeometry, bowMaterial.clone());
        bowGroup.add(knot);

        // Ribbon tails
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

    checkCollision(raycaster) {
        // Check ray intersection with gift boxes
        const intersects = [];

        this.gifts.forEach((gift, index) => {
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

        // Sort by distance
        intersects.sort((a, b) => a.distance - b.distance);

        return intersects.length > 0 ? intersects[0] : null;
    }

    onHover(giftIndex) {
        this.gifts.forEach((gift, i) => {
            if (i === giftIndex) {
                gift.group.userData.isHovered = true;
            } else {
                gift.group.userData.isHovered = false;
            }
        });
    }

    onSelect(giftIndex, audioManager) {
        const gift = this.gifts[giftIndex];
        if (!gift) return;

        const userData = gift.group.userData;

        if (userData.isOpened || userData.isOpening) return;

        userData.isSelected = true;
        userData.isOpening = true;
        this.selectedGift = gift;

        if (audioManager) {
            audioManager.playBell();
        }

        this.animateOpening(gift, audioManager);
    }

    animateOpening(gift, audioManager) {
        const userData = gift.group.userData;
        const style = gift.style;
        const lidPivot = userData.lidPivot;

        const boxTopY = style.size.h / 2;
        const particlePosition = new THREE.Vector3(
            0,
            boxTopY + 0.3,
            0
        );

        gift.group.updateMatrixWorld();
        gift.group.localToWorld(particlePosition);

        let progress = 0;
        const totalDuration = 2.5;
        const lidOpenDuration = 0.8;
        const particleStartTime = 0.3;
        const rewardStartTime = 0.6;

        let rewardCreated = false;
        let particlesTriggered = false;

        const animate = () => {
            progress += 0.016;
            const t = Math.min(progress / totalDuration, 1);

            if (t >= particleStartTime / totalDuration && !particlesTriggered) {
                particlesTriggered = true;
                if (this.goldParticles) {
                    this.goldParticles.burst(particlePosition, 50);
                }
            }

            const lidT = Math.min(t * totalDuration / lidOpenDuration, 1);
            const easeLid = 1 - Math.pow(1 - lidT, 3);
            lidPivot.rotation.x = easeLid * Math.PI * 0.85;

            if (t >= rewardStartTime / totalDuration && !rewardCreated) {
                rewardCreated = true;
                this.createReward(gift);
            }

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                userData.isOpened = true;
                userData.isOpening = false;
                userData.isSelected = false;

                if (audioManager) {
                    audioManager.playChime();
                }
            }
        };

        animate();
    }

    createReward(gift) {
        const style = gift.style;
        const userData = gift.group.userData;

        const rewardType = this.rewardTypes[Math.floor(Math.random() * this.rewardTypes.length)];
        const rewardSize = Math.min(style.size.w, style.size.h, style.size.d) * 0.5;

        let geometry;
        switch (rewardType) {
            case 'cube':
                geometry = new THREE.BoxGeometry(rewardSize, rewardSize, rewardSize);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(rewardSize * 0.55, 16, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(rewardSize * 0.45, rewardSize * 0.8, 16);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(rewardSize * 0.35, rewardSize * 0.12, 8, 16);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(rewardSize * 0.5);
                break;
            default:
                geometry = new THREE.BoxGeometry(rewardSize, rewardSize, rewardSize);
        }

        const rewardColors = [0xffd700, 0xff6b6b, 0x4ecdc4, 0x9b59b6, 0x3498db];
        const rewardColor = rewardColors[Math.floor(Math.random() * rewardColors.length)];

        const material = new THREE.MeshStandardMaterial({
            color: rewardColor,
            roughness: 0.2,
            metalness: 0.8,
            emissive: rewardColor,
            emissiveIntensity: 0.4
        });

        const reward = new THREE.Mesh(geometry, material);
        reward.castShadow = true;
        const boxBodyHeight = style.size.h * 0.85;
        reward.position.y = boxBodyHeight * 0.3;
        reward.scale.setScalar(0);
        gift.group.add(reward);

        userData.reward = reward;
        userData.rewardPhase = Math.random() * Math.PI * 2;
        userData.rewardStartY = boxBodyHeight * 0.3;
        userData.rewardTargetY = boxBodyHeight * 0.6;

        let progress = 0;
        const duration = 0.6;

        const animate = () => {
            progress += 0.016;
            const t = Math.min(progress / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);

            const scale = ease;
            reward.scale.setScalar(scale);

            const floatUp = t * t;
            reward.position.y = userData.rewardStartY + floatUp * (userData.rewardTargetY - userData.rewardStartY);

            reward.rotation.y = t * Math.PI * 2;

            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    update(deltaTime) {
        this.time += deltaTime;

        this.gifts.forEach((gift) => {
            const userData = gift.group.userData;

            if (!userData.isOpening && !userData.isOpened) {
                const float = Math.sin(this.time * 2 + userData.phase) * 0.03;
                gift.group.position.y = userData.originalY + float;
            }

            if (userData.isHovered && !userData.isOpened && !userData.isOpening) {
                gift.group.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
            } else {
                gift.group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }

            if (userData.reward && userData.isOpened) {
                const reward = userData.reward;
                const floatY = Math.sin(this.time * 3 + userData.rewardPhase) * 0.08;
                reward.position.y = userData.rewardTargetY + floatY;
                reward.rotation.y += deltaTime * 2;
                reward.rotation.x = Math.sin(this.time * 2 + userData.rewardPhase) * 0.2;
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
