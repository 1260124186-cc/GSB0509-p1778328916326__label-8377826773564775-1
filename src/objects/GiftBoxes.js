import * as THREE from 'three/webgpu';

/**
 * Gift Boxes with different styles and collision detection
 */
export class GiftBoxes {
    constructor(scene) {
        this.scene = scene;
        this.gifts = [];
        this.group = new THREE.Group();
        this.time = 0;
        this.selectedGift = null;

        // Collision bounds
        this.collisionSpheres = [];
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

        // Main box
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

        // Horizontal ribbon
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

        // Vertical ribbon
        const ribbonVGeometry = new THREE.BoxGeometry(
            style.size.w * 0.15,
            ribbonThickness,
            style.size.d + 0.02
        );
        const ribbonV = new THREE.Mesh(ribbonVGeometry, ribbonMaterial.clone());
        ribbonV.position.y = style.size.h / 2 + ribbonThickness / 2 - 0.02;
        giftGroup.add(ribbonV);

        // Bow
        const bow = this.createBow(style.ribbonColor);
        bow.position.y = style.size.h / 2 + 0.1;
        bow.scale.setScalar(style.size.w * 0.4);
        giftGroup.add(bow);

        // Position and rotation
        giftGroup.position.set(style.position.x, style.position.y, style.position.z);
        giftGroup.rotation.y = style.rotation;

        // Store original position for animation
        giftGroup.userData = {
            originalY: style.position.y,
            phase: index * 0.5,
            isHovered: false,
            isSelected: false,
            index: index
        };

        return {
            group: giftGroup,
            style: style,
            box: box
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

        gift.group.userData.isSelected = true;
        this.selectedGift = gift;

        // Play interaction sound
        if (audioManager) {
            audioManager.playInteraction();
        }

        // Animate the gift
        this.animateSelection(gift);
    }

    animateSelection(gift) {
        // Simple selection animation - jump and spin
        const startY = gift.group.userData.originalY;
        const targetY = startY + 0.5;
        const startRotation = gift.group.rotation.y;
        const targetRotation = startRotation + Math.PI * 2;

        let progress = 0;
        const duration = 0.5;

        const animate = () => {
            progress += 0.016; // ~60fps
            const t = Math.min(progress / duration, 1);

            // Ease out bounce
            const easeOutBounce = (x) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (x < 1 / d1) {
                    return n1 * x * x;
                } else if (x < 2 / d1) {
                    return n1 * (x -= 1.5 / d1) * x + 0.75;
                } else if (x < 2.5 / d1) {
                    return n1 * (x -= 2.25 / d1) * x + 0.9375;
                } else {
                    return n1 * (x -= 2.625 / d1) * x + 0.984375;
                }
            };

            // Jump arc
            const jumpT = Math.sin(t * Math.PI);
            gift.group.position.y = startY + jumpT * 0.5;

            // Spin
            gift.group.rotation.y = startRotation + t * Math.PI * 2;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                gift.group.position.y = startY;
                gift.group.userData.isSelected = false;
            }
        };

        animate();
    }

    update(deltaTime) {
        this.time += deltaTime;

        this.gifts.forEach((gift) => {
            const userData = gift.group.userData;

            // Gentle floating animation
            const float = Math.sin(this.time * 2 + userData.phase) * 0.03;
            if (!userData.isSelected) {
                gift.group.position.y = userData.originalY + float;
            }

            // Hover effect - scale up
            if (userData.isHovered) {
                gift.group.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
            } else {
                gift.group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
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
