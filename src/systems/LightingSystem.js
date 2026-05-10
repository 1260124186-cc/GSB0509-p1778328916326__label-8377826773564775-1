import * as THREE from 'three/webgpu';

/**
 * Dynamic Lighting System with ambient and point lights
 * Compatible with WebGPU and WebGL renderers
 */
export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.pointLights = [];
        this.time = 0;
        this.enabled = true;
    }

    create() {
        // Ambient light for base illumination
        this.ambientLight = new THREE.AmbientLight(0x404080, 0.5);
        this.scene.add(this.ambientLight);
        this.lights.push(this.ambientLight);

        // Main directional light (moonlight)
        this.moonLight = new THREE.DirectionalLight(0x8888ff, 0.8);
        this.moonLight.position.set(10, 20, 10);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 2048;
        this.moonLight.shadow.mapSize.height = 2048;
        this.moonLight.shadow.camera.near = 0.5;
        this.moonLight.shadow.camera.far = 50;
        this.moonLight.shadow.camera.left = -15;
        this.moonLight.shadow.camera.right = 15;
        this.moonLight.shadow.camera.top = 15;
        this.moonLight.shadow.camera.bottom = -15;
        this.moonLight.shadow.bias = -0.001;
        this.scene.add(this.moonLight);
        this.lights.push(this.moonLight);

        // Hemisphere light for sky/ground ambient
        this.hemiLight = new THREE.HemisphereLight(0x6688cc, 0x443322, 0.5);
        this.scene.add(this.hemiLight);
        this.lights.push(this.hemiLight);

        // Decorative point lights around the scene
        this.createDecoLights();

        // Christmas tree warm light
        this.createTreeSpotlight();

        return this.lights;
    }

    createDecoLights() {
        const decoLightConfigs = [
            { color: 0xff4444, position: { x: -4, y: 2, z: 4 }, intensity: 3 },
            { color: 0x44ff44, position: { x: 4, y: 2, z: 4 }, intensity: 3 },
            { color: 0x4444ff, position: { x: 0, y: 3, z: -3 }, intensity: 3 },
            { color: 0xffff44, position: { x: -3, y: 1, z: -2 }, intensity: 2.5 },
            { color: 0xff44ff, position: { x: 3, y: 1, z: -2 }, intensity: 2.5 }
        ];

        decoLightConfigs.forEach((config, index) => {
            // Point light
            const pointLight = new THREE.PointLight(config.color, config.intensity, 10);
            pointLight.position.set(config.position.x, config.position.y, config.position.z);

            // Store original intensity for animation
            pointLight.userData = {
                baseIntensity: config.intensity,
                phase: index * 0.8,
                flickerSpeed: 2 + Math.random()
            };

            this.scene.add(pointLight);
            this.pointLights.push(pointLight);

            // Visual representation (small glowing sphere)
            const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 0.8
            });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(pointLight.position);
            pointLight.userData.visual = sphere;
            this.scene.add(sphere);
        });
    }

    createTreeSpotlight() {
        // Warm spotlight on the tree
        this.treeSpot = new THREE.SpotLight(0xffeedd, 4);
        this.treeSpot.position.set(0, 15, 8);
        this.treeSpot.target.position.set(0, 3, 0);
        this.treeSpot.angle = Math.PI / 6;
        this.treeSpot.penumbra = 0.5;
        this.treeSpot.decay = 1.5;
        this.treeSpot.distance = 25;

        this.scene.add(this.treeSpot);
        this.scene.add(this.treeSpot.target);
        this.lights.push(this.treeSpot);
    }

    update(deltaTime) {
        if (!this.enabled) return;

        this.time += deltaTime;

        // Animate point lights
        this.pointLights.forEach((light) => {
            const userData = light.userData;

            // Flickering effect
            const flicker = Math.sin(this.time * userData.flickerSpeed + userData.phase) * 0.3 +
                           Math.sin(this.time * userData.flickerSpeed * 2.3 + userData.phase) * 0.1;

            light.intensity = userData.baseIntensity * (0.7 + flicker * 0.3 + 0.3);

            // Update visual sphere
            if (userData.visual) {
                userData.visual.material.opacity = 0.5 + flicker * 0.3 + 0.2;
                const scale = 0.8 + flicker * 0.2 + 0.2;
                userData.visual.scale.setScalar(scale);
            }
        });

        // Subtle moonlight animation
        if (this.moonLight) {
            const moonPulse = Math.sin(this.time * 0.2) * 0.1;
            this.moonLight.intensity = 0.8 + moonPulse;
        }

        // Tree spotlight subtle variation
        if (this.treeSpot) {
            const spotPulse = Math.sin(this.time * 0.5) * 0.3;
            this.treeSpot.intensity = 4 + spotPulse;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;

        // Toggle all main lights
        if (this.ambientLight) {
            this.ambientLight.visible = enabled;
        }
        if (this.moonLight) {
            this.moonLight.visible = enabled;
        }
        if (this.hemiLight) {
            this.hemiLight.visible = enabled;
        }
        if (this.treeSpot) {
            this.treeSpot.visible = enabled;
        }

        // Toggle point lights visibility
        this.pointLights.forEach((light) => {
            light.visible = enabled;
            if (light.userData.visual) {
                light.userData.visual.visible = enabled;
            }
        });
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    setIntensity(multiplier) {
        this.pointLights.forEach((light) => {
            light.userData.baseIntensity = light.userData.baseIntensity * multiplier;
        });
    }

    dispose() {
        this.lights.forEach((light) => {
            this.scene.remove(light);
        });

        this.pointLights.forEach((light) => {
            if (light.userData.visual) {
                light.userData.visual.geometry.dispose();
                light.userData.visual.material.dispose();
                this.scene.remove(light.userData.visual);
            }
            this.scene.remove(light);
        });
    }
}
