import * as THREE from 'three/webgpu';
import { RendererManager } from './core/Renderer.js';
import { SceneManager } from './core/Scene.js';
import { CameraManager } from './core/Camera.js';
import { ControlsManager } from './core/Controls.js';
import { ChristmasTree } from './objects/ChristmasTree.js';
import { Ground } from './objects/Ground.js';
import { GiftBoxes } from './objects/GiftBoxes.js';
import { SnowSystem } from './systems/SnowSystem.js';
import { GoldParticles } from './systems/GoldParticles.js';
import { LightingSystem } from './systems/LightingSystem.js';
import { AudioManager } from './systems/AudioManager.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { ResourceManager } from './utils/ResourceManager.js';

/**
 * Christmas 3D Scene - Main Application
 */
class ChristmasApp {
    constructor() {
        // Managers
        this.rendererManager = null;
        this.sceneManager = null;
        this.cameraManager = null;
        this.controlsManager = null;
        this.audioManager = null;
        this.performanceMonitor = null;
        this.resourceManager = null;

        // Objects
        this.christmasTree = null;
        this.ground = null;
        this.giftBoxes = null;

        // Systems
        this.snowSystem = null;
        this.goldParticles = null;
        this.lightingSystem = null;

        // State
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;

        // Raycaster for interactions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Container
        this.container = document.getElementById('canvas-container');
    }

    async init() {
        this.updateLoadingText('Initializing WebGPU...');
        this.updateLoadingBar(5);

        // Initialize resource manager
        this.resourceManager = new ResourceManager();

        // Initialize renderer
        this.rendererManager = new RendererManager(this.container);
        await this.rendererManager.init();
        this.updateLoadingBar(15);
        this.updateLoadingText('Creating scene...');

        // Initialize scene
        this.sceneManager = new SceneManager();
        this.sceneManager.init();
        this.updateLoadingBar(25);

        // Initialize camera
        this.cameraManager = new CameraManager();
        this.cameraManager.init(this.container);
        this.updateLoadingBar(30);

        // Initialize controls
        this.controlsManager = new ControlsManager(
            this.cameraManager.camera,
            this.rendererManager.domElement
        );
        this.updateLoadingBar(35);
        this.updateLoadingText('Creating Christmas tree...');

        // Create ground
        this.ground = new Ground();
        this.sceneManager.add(this.ground.create());
        this.updateLoadingBar(40);

        // Create Christmas tree
        this.christmasTree = new ChristmasTree();
        this.sceneManager.add(this.christmasTree.create());
        this.updateLoadingBar(55);
        this.updateLoadingText('Adding gifts...');

        // Create gold particles system
        this.goldParticles = new GoldParticles(this.sceneManager.scene);
        this.goldParticles.initPool();
        this.updateLoadingBar(62);

        // Create gift boxes
        this.giftBoxes = new GiftBoxes(this.sceneManager.scene, this.goldParticles);
        this.giftBoxes.create();
        this.updateLoadingBar(68);
        this.updateLoadingText('Initializing snow...');

        // Create snow system
        this.snowSystem = new SnowSystem(this.sceneManager.scene);
        this.snowSystem.create();
        this.updateLoadingBar(75);
        this.updateLoadingText('Setting up lighting...');

        // Create lighting system
        this.lightingSystem = new LightingSystem(this.sceneManager.scene);
        this.lightingSystem.create();
        this.updateLoadingBar(85);
        this.updateLoadingText('Initializing audio...');

        // Initialize audio manager
        this.audioManager = new AudioManager();
        this.audioManager.init(this.cameraManager.camera);
        this.updateLoadingBar(90);

        // Initialize performance monitor
        this.performanceMonitor = new PerformanceMonitor();
        this.performanceMonitor.setQualityChangeCallback((quality) => {
            this.adjustQuality(quality);
        });
        this.updateLoadingBar(95);
        this.updateLoadingText('Finalizing...');

        // Setup event listeners
        this.setupEventListeners();
        this.updateLoadingBar(100);

        // Hide loading screen
        setTimeout(() => {
            this.hideLoadingScreen();
            this.start();
        }, 500);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.onResize.bind(this));

        // Mouse/touch interactions
        this.rendererManager.domElement.addEventListener('click', this.onClick.bind(this));
        this.rendererManager.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Track if first interaction has happened
        let firstInteractionHandled = false;
        const musicBtn = document.getElementById('btn-music');
        const snowBtn = document.getElementById('btn-snow');
        const lightsBtn = document.getElementById('btn-lights');
        const fullscreenBtn = document.getElementById('btn-fullscreen');

        // Music button handler
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering first interaction handler
            firstInteractionHandled = true;

            const isPlaying = this.audioManager.toggleMusic();
            musicBtn.classList.toggle('active', isPlaying);
        });

        // Snow button handler
        snowBtn.addEventListener('click', () => {
            const enabled = this.snowSystem.toggle();
            snowBtn.classList.toggle('active', enabled);
        });

        // Lights button handler
        lightsBtn.addEventListener('click', () => {
            const enabled = this.lightingSystem.toggle();
            // Also toggle Christmas tree lights
            if (this.christmasTree) {
                this.christmasTree.setLightsEnabled(enabled);
            }
            lightsBtn.classList.toggle('active', enabled);
        });

        // Fullscreen button handler
        fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Initial button states
        snowBtn.classList.add('active');
        lightsBtn.classList.add('active');

        // First interaction to enable audio (but not if clicking music button)
        const enableAudio = (e) => {
            // Skip if already handled or if clicking the music button
            if (firstInteractionHandled) return;
            if (e.target === musicBtn || musicBtn.contains(e.target)) return;

            firstInteractionHandled = true;
            this.audioManager.startBackgroundMusic();
            musicBtn.classList.add('active');
        };

        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
    }

    onClick(event) {
        // Calculate mouse position
        const rect = this.rendererManager.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.cameraManager.camera);

        // Check gift box collision
        const collision = this.giftBoxes.checkCollision(this.raycaster);
        if (collision) {
            this.giftBoxes.onSelect(collision.giftIndex, this.audioManager);
        }
    }

    onMouseMove(event) {
        // Calculate mouse position
        const rect = this.rendererManager.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.cameraManager.camera);

        // Check gift box hover
        const collision = this.giftBoxes.checkCollision(this.raycaster);
        if (collision) {
            this.giftBoxes.onHover(collision.giftIndex);
            this.rendererManager.domElement.style.cursor = 'pointer';
        } else {
            this.giftBoxes.onHover(-1);
            this.rendererManager.domElement.style.cursor = 'grab';
        }
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.cameraManager.resize(width, height);
        this.rendererManager.resize();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    adjustQuality(quality) {
        const renderer = this.rendererManager.renderer;
        const shadowMap = renderer.shadowMap;

        switch (quality) {
            case 'low':
                // Reduce particle count, disable shadows
                if (shadowMap) {
                    shadowMap.enabled = false;
                }
                this.snowSystem.particleCount = 2000;
                break;
            case 'medium':
                if (shadowMap) {
                    shadowMap.enabled = true;
                    shadowMap.type = THREE.BasicShadowMap;
                }
                this.snowSystem.particleCount = 3500;
                break;
            case 'high':
                if (shadowMap) {
                    shadowMap.enabled = true;
                    shadowMap.type = THREE.PCFSoftShadowMap;
                }
                this.snowSystem.particleCount = 5000;
                break;
        }
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(this.animate.bind(this));

        // Calculate delta time
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 0.1);

        // Update systems
        this.update(this.deltaTime);

        // Render
        this.render();

        // Update performance monitor
        this.performanceMonitor.update();
    }

    update(deltaTime) {
        // Update controls
        this.controlsManager.update(deltaTime);

        // Update Christmas tree animations
        this.christmasTree.update(deltaTime);

        // Update gift boxes
        this.giftBoxes.update(deltaTime);

        // Update snow system
        this.snowSystem.update(deltaTime);

        // Update gold particles system
        this.goldParticles.update(deltaTime);

        // Update lighting system
        this.lightingSystem.update(deltaTime);
    }

    render() {
        this.rendererManager.render(this.sceneManager.scene, this.cameraManager.camera);
    }

    updateLoadingBar(percent) {
        const bar = document.getElementById('loading-bar');
        if (bar) {
            bar.style.width = `${percent}%`;
        }
    }

    updateLoadingText(text) {
        const textEl = document.getElementById('loading-text');
        if (textEl) {
            textEl.textContent = text;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    dispose() {
        this.stop();

        // Dispose all systems and objects
        this.christmasTree?.dispose();
        this.ground?.dispose();
        this.giftBoxes?.dispose();
        this.snowSystem?.dispose();
        this.goldParticles?.dispose();
        this.lightingSystem?.dispose();
        this.audioManager?.dispose();
        this.sceneManager?.dispose();
        this.rendererManager?.dispose();
        this.resourceManager?.disposeAll();
        this.controlsManager?.dispose();
    }
}

// Initialize application
const app = new ChristmasApp();

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init().catch((error) => {
            console.error('Failed to initialize Christmas scene:', error);
        });
    });
} else {
    app.init().catch((error) => {
        console.error('Failed to initialize Christmas scene:', error);
    });
}

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.dispose();
});

// Export for debugging
window.christmasApp = app;
