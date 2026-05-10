import * as THREE from 'three/webgpu';

/**
 * Christmas Tree with realistic appearance and vertex animation
 */
export class ChristmasTree {
    constructor() {
        this.group = new THREE.Group();
        this.time = 0;
        this.ornaments = [];
        this.lights = [];
        this.leafMeshes = [];
        this.branches = [];
    }

    create() {
        this.createTrunk();
        this.createRealisticLeaves();
        this.createStar();
        this.createOrnaments();
        this.createTreeLights();
        this.createGarland();

        this.group.position.set(0, 0, 0);
        return this.group;
    }

    createTrunk() {
        // Realistic tree trunk with bark texture effect
        const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.4, 1.8, 12);

        // Add some irregularity to trunk
        const positions = trunkGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const y = positions[i + 1];
            const noise = Math.sin(y * 8) * 0.02 + Math.cos(y * 12) * 0.015;
            const radius = Math.sqrt(positions[i] ** 2 + positions[i + 2] ** 2);
            if (radius > 0.1) {
                positions[i] *= (1 + noise);
                positions[i + 2] *= (1 + noise);
            }
        }
        trunkGeometry.computeVertexNormals();

        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d2817,
            roughness: 0.95,
            metalness: 0.0
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.group.add(trunk);

        // Decorative pot with rim
        const potGroup = new THREE.Group();

        // Main pot body
        const potGeometry = new THREE.CylinderGeometry(0.7, 0.55, 0.7, 16);
        const potMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b2500,
            roughness: 0.6,
            metalness: 0.15
        });
        const pot = new THREE.Mesh(potGeometry, potMaterial);
        pot.position.y = 0.35;
        potGroup.add(pot);

        // Pot rim
        const rimGeometry = new THREE.TorusGeometry(0.72, 0.08, 8, 24);
        const rim = new THREE.Mesh(rimGeometry, potMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.7;
        potGroup.add(rim);

        // Soil in pot
        const soilGeometry = new THREE.CircleGeometry(0.65, 16);
        const soilMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d1f14,
            roughness: 1.0
        });
        const soil = new THREE.Mesh(soilGeometry, soilMaterial);
        soil.rotation.x = -Math.PI / 2;
        soil.position.y = 0.68;
        potGroup.add(soil);

        potGroup.castShadow = true;
        this.group.add(potGroup);
    }

    createRealisticLeaves() {
        // Create more realistic layered foliage
        const layers = [
            { radius: 2.2, height: 2.8, y: 2.3, segments: 48 },
            { radius: 1.8, height: 2.4, y: 4.3, segments: 40 },
            { radius: 1.4, height: 2.0, y: 6.0, segments: 32 },
            { radius: 1.0, height: 1.6, y: 7.4, segments: 24 },
            { radius: 0.5, height: 1.2, y: 8.5, segments: 16 }
        ];

        layers.forEach((layer, index) => {
            // Main cone with more segments for smoother look
            const geometry = new THREE.ConeGeometry(
                layer.radius,
                layer.height,
                layer.segments,
                6
            );

            // Add organic variation to vertices
            const positions = geometry.attributes.position.array;
            geometry.userData.originalPositions = positions.slice();

            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];

                const radius = Math.sqrt(x * x + z * z);
                if (radius > 0.1) {
                    // Add jagged edges like pine needles
                    const angle = Math.atan2(z, x);
                    const variation = Math.sin(angle * 12) * 0.08 + Math.sin(angle * 24) * 0.04;
                    const heightFactor = (y + layer.height / 2) / layer.height;

                    positions[i] *= (1 + variation * heightFactor);
                    positions[i + 2] *= (1 + variation * heightFactor);
                }
            }
            geometry.computeVertexNormals();

            // Rich green gradient - darker at bottom, lighter at top
            const hue = 0.33 + index * 0.01;
            const saturation = 0.75 - index * 0.03;
            const lightness = 0.18 + index * 0.025;

            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(hue, saturation, lightness),
                roughness: 0.85,
                metalness: 0.0,
                flatShading: false,
                side: THREE.DoubleSide
            });

            const cone = new THREE.Mesh(geometry, material);
            cone.position.y = layer.y;
            cone.castShadow = true;
            cone.receiveShadow = true;
            cone.userData.layerIndex = index;

            this.leafMeshes.push(cone);
            this.group.add(cone);

            // Add secondary detail layer for depth
            if (index < 3) {
                const detailGeom = new THREE.ConeGeometry(
                    layer.radius * 0.92,
                    layer.height * 0.85,
                    layer.segments,
                    4
                );
                const detailMat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(hue - 0.02, saturation + 0.1, lightness - 0.03),
                    roughness: 0.9,
                    metalness: 0.0
                });
                const detailCone = new THREE.Mesh(detailGeom, detailMat);
                detailCone.position.y = layer.y + 0.15;
                detailCone.rotation.y = Math.PI / layer.segments;
                detailCone.castShadow = true;
                this.group.add(detailCone);
            }
        });
    }

    createStar() {
        const starGroup = new THREE.Group();

        // Create proper 5-pointed star
        const starShape = new THREE.Shape();
        const outerRadius = 0.4;
        const innerRadius = 0.18;
        const points = 5;

        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                starShape.moveTo(x, y);
            } else {
                starShape.lineTo(x, y);
            }
        }
        starShape.closePath();

        const extrudeSettings = {
            depth: 0.12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 2
        };

        const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        starGeometry.center();

        const starMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.6,
            roughness: 0.15,
            metalness: 0.9
        });

        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.rotation.x = Math.PI / 2;
        starGroup.add(star);

        // Inner glow sphere
        const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        starGroup.add(glow);

        // Outer glow
        const outerGlowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.15
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        starGroup.add(outerGlow);

        starGroup.position.y = 9.5;
        this.star = starGroup;
        this.group.add(starGroup);

        // Star point light
        const starLight = new THREE.PointLight(0xffd700, 3, 6);
        starLight.position.y = 9.5;
        this.group.add(starLight);
        this.starLight = starLight;
    }

    createOrnaments() {
        // More realistic ornament colors with metallic/glass appearance
        const ornamentStyles = [
            { color: 0xcc0000, metalness: 0.9, roughness: 0.1 },  // Shiny red
            { color: 0x0055aa, metalness: 0.85, roughness: 0.15 }, // Deep blue
            { color: 0xffd700, metalness: 0.95, roughness: 0.05 }, // Gold
            { color: 0xc0c0c0, metalness: 0.95, roughness: 0.1 },  // Silver
            { color: 0x990066, metalness: 0.8, roughness: 0.2 },   // Purple
            { color: 0x006633, metalness: 0.85, roughness: 0.15 }  // Forest green
        ];

        const ornamentPositions = [];

        for (let layer = 0; layer < 5; layer++) {
            const baseY = [2.3, 4.3, 6.0, 7.4, 8.5][layer];
            const radius = [1.8, 1.5, 1.2, 0.85, 0.4][layer];
            const count = [10, 8, 6, 4, 2][layer];

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + layer * 0.4;
                const yOffset = (Math.random() - 0.5) * 0.6;
                const radiusOffset = (Math.random() - 0.5) * 0.15;

                ornamentPositions.push({
                    x: Math.cos(angle) * (radius + radiusOffset),
                    y: baseY - 0.4 + yOffset,
                    z: Math.sin(angle) * (radius + radiusOffset),
                    style: ornamentStyles[Math.floor(Math.random() * ornamentStyles.length)],
                    size: 0.1 + Math.random() * 0.06
                });
            }
        }

        ornamentPositions.forEach((pos) => {
            const ornamentGroup = new THREE.Group();

            // Main ball
            const geometry = new THREE.SphereGeometry(pos.size, 24, 24);
            const material = new THREE.MeshStandardMaterial({
                color: pos.style.color,
                roughness: pos.style.roughness,
                metalness: pos.style.metalness,
                envMapIntensity: 1.2
            });

            const ball = new THREE.Mesh(geometry, material);
            ornamentGroup.add(ball);

            // Cap/hanger
            const capGeometry = new THREE.CylinderGeometry(pos.size * 0.25, pos.size * 0.35, pos.size * 0.2, 8);
            const capMaterial = new THREE.MeshStandardMaterial({
                color: 0xc9a830,
                metalness: 0.9,
                roughness: 0.2
            });
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.y = pos.size;
            ornamentGroup.add(cap);

            ornamentGroup.position.set(pos.x, pos.y, pos.z);
            ornamentGroup.userData.originalY = pos.y;
            ornamentGroup.userData.phase = Math.random() * Math.PI * 2;

            this.ornaments.push(ornamentGroup);
            this.group.add(ornamentGroup);
        });
    }

    createTreeLights() {
        // Warm white fairy lights with colored accent lights
        const lightConfigs = [
            { color: 0xfffaf0, chance: 0.6 },  // Warm white (60%)
            { color: 0xff3333, chance: 0.1 },  // Red
            { color: 0x33ff33, chance: 0.1 },  // Green
            { color: 0x3333ff, chance: 0.1 },  // Blue
            { color: 0xffff33, chance: 0.1 }   // Yellow
        ];

        for (let layer = 0; layer < 5; layer++) {
            const baseY = [2.3, 4.3, 6.0, 7.4, 8.5][layer];
            const radius = [1.9, 1.6, 1.3, 0.95, 0.5][layer];
            const count = [16, 14, 10, 8, 4][layer];

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + layer * 0.3 + Math.random() * 0.2;
                const yOffset = (Math.random() - 0.5) * 0.5;
                const radiusOffset = (Math.random() - 0.3) * 0.2;

                // Select color based on probability
                let rand = Math.random();
                let selectedColor = 0xfffaf0;
                let cumulative = 0;
                for (const config of lightConfigs) {
                    cumulative += config.chance;
                    if (rand < cumulative) {
                        selectedColor = config.color;
                        break;
                    }
                }

                const lightGroup = new THREE.Group();

                // Light bulb
                const bulbGeometry = new THREE.SphereGeometry(0.035, 8, 8);
                const bulbMaterial = new THREE.MeshBasicMaterial({
                    color: selectedColor,
                    transparent: true,
                    opacity: 0.95
                });
                const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
                lightGroup.add(bulb);

                // Glow effect
                const glowGeometry = new THREE.SphereGeometry(0.06, 8, 8);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: selectedColor,
                    transparent: true,
                    opacity: 0.3
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                lightGroup.add(glow);

                lightGroup.position.set(
                    Math.cos(angle) * (radius + radiusOffset),
                    baseY - 0.2 + yOffset,
                    Math.sin(angle) * (radius + radiusOffset)
                );

                lightGroup.userData.baseColor = selectedColor;
                lightGroup.userData.phase = Math.random() * Math.PI * 2;
                lightGroup.userData.bulb = bulb;
                lightGroup.userData.glow = glow;

                this.lights.push(lightGroup);
                this.group.add(lightGroup);
            }
        }
    }

    createGarland() {
        // Create tinsel/garland spiraling around the tree
        const garlandMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.8,
            roughness: 0.3,
            side: THREE.DoubleSide
        });

        const points = [];
        const turns = 4;
        const pointsPerTurn = 32;

        for (let i = 0; i <= turns * pointsPerTurn; i++) {
            const t = i / (turns * pointsPerTurn);
            const y = 2.0 + t * 7;
            const radius = 2.0 - t * 1.5;
            const angle = t * turns * Math.PI * 2;

            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                y,
                Math.sin(angle) * radius
            ));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 128, 0.03, 8, false);
        const garland = new THREE.Mesh(tubeGeometry, garlandMaterial);

        this.group.add(garland);
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Animate star
        if (this.star) {
            this.star.rotation.y += deltaTime * 0.3;
            const pulse = Math.sin(this.time * 2) * 0.08 + 1;
            this.star.scale.setScalar(pulse);

            if (this.starLight) {
                this.starLight.intensity = 3 + Math.sin(this.time * 2.5) * 0.8;
            }
        }

        // Animate ornaments (gentle swinging)
        this.ornaments.forEach((ornament) => {
            const swing = Math.sin(this.time * 1.5 + ornament.userData.phase) * 0.015;
            const bob = Math.sin(this.time * 2 + ornament.userData.phase) * 0.01;
            ornament.position.y = ornament.userData.originalY + bob;
            ornament.rotation.z = swing;
        });

        // Animate tree lights (twinkling)
        this.lights.forEach((light) => {
            const twinkle = Math.sin(this.time * 5 + light.userData.phase) * 0.3 +
                           Math.sin(this.time * 7 + light.userData.phase * 2) * 0.2 + 0.5;

            if (light.userData.bulb) {
                light.userData.bulb.material.opacity = 0.6 + twinkle * 0.4;
            }
            if (light.userData.glow) {
                light.userData.glow.material.opacity = 0.1 + twinkle * 0.25;
                const scale = 0.8 + twinkle * 0.4;
                light.userData.glow.scale.setScalar(scale);
            }
        });

        // Subtle vertex animation for leaves (gentle sway in wind)
        this.leafMeshes.forEach((mesh) => {
            const geometry = mesh.geometry;
            const originalPositions = geometry.userData.originalPositions;
            if (!originalPositions) return;

            const positions = geometry.attributes.position.array;
            const layerIndex = mesh.userData.layerIndex;

            for (let i = 0; i < positions.length; i += 3) {
                const x = originalPositions[i];
                const y = originalPositions[i + 1];
                const z = originalPositions[i + 2];

                const heightRatio = (y + mesh.geometry.parameters.height / 2) / mesh.geometry.parameters.height;

                if (heightRatio > 0.1 && heightRatio < 0.95) {
                    const swayAmount = heightRatio * 0.02 * (1 + layerIndex * 0.3);
                    const swayX = Math.sin(this.time * 0.8 + x * 1.5) * swayAmount;
                    const swayZ = Math.cos(this.time * 0.8 + z * 1.5) * swayAmount * 0.7;

                    positions[i] = x + swayX;
                    positions[i + 2] = z + swayZ;
                }
            }

            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
        });
    }

    setLightsEnabled(enabled) {
        // Toggle tree lights visibility
        this.lights.forEach((light) => {
            light.visible = enabled;
        });

        // Toggle star visibility
        if (this.star) {
            this.star.visible = enabled;
        }
        if (this.starLight) {
            this.starLight.visible = enabled;
        }
    }

    dispose() {
        this.group.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
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
