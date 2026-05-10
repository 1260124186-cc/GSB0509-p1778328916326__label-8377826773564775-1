import * as THREE from 'three/webgpu';
const { WebGPURenderer } = THREE;

/**
 * Renderer Manager - Handles WebGPU/WebGL rendering with proper fallback
 */
export class RendererManager {
    constructor(container) {
        this.container = container;
        this.renderer = null;
        this.isWebGPU = false;
        this.canvas = null;
    }

    async init() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);

        // Check WebGPU support
        const hasWebGPU = navigator.gpu !== undefined;

        if (hasWebGPU) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    // Create WebGPURenderer with native WebGPU backend
                    this.renderer = new WebGPURenderer({
                        canvas: this.canvas,
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance',
                        forceWebGL: false  // Use native WebGPU
                    });

                    // Initialize the renderer - this is required for WebGPU
                    await this.renderer.init();

                    this.isWebGPU = true;
                    this.setupRenderer();

                    console.log('Using WebGPU renderer (native)');
                    const rendererTypeEl = document.getElementById('renderer-type');
                    if (rendererTypeEl) {
                        rendererTypeEl.textContent = 'WebGPU';
                    }

                    return this.renderer;
                }
            } catch (error) {
                console.warn('WebGPU initialization failed:', error);
                // Clean up failed renderer
                if (this.renderer) {
                    try {
                        this.renderer.dispose();
                    } catch (e) {
                        // Ignore dispose errors
                    }
                    this.renderer = null;
                }
                // Remove and recreate canvas
                if (this.canvas && this.canvas.parentNode) {
                    this.canvas.parentNode.removeChild(this.canvas);
                }
                this.canvas = document.createElement('canvas');
                this.container.appendChild(this.canvas);
            }
        }

        // Fallback: Use WebGPURenderer with WebGL backend
        // This provides better compatibility while still using the new architecture
        try {
            this.renderer = new WebGPURenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance',
                forceWebGL: true  // Use WebGL backend
            });

            await this.renderer.init();

            this.isWebGPU = false;
            this.setupRenderer();

            console.log('Using WebGPU renderer (WebGL backend)');
            const rendererTypeEl = document.getElementById('renderer-type');
            if (rendererTypeEl) {
                rendererTypeEl.textContent = 'WebGL';
            }

            return this.renderer;
        } catch (error) {
            console.warn('WebGPURenderer with WebGL backend failed:', error);
            // Final fallback to classic WebGLRenderer
            return this.initClassicWebGLRenderer();
        }
    }

    initClassicWebGLRenderer() {
        // Remove and recreate canvas if needed
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.isWebGPU = false;
        this.setupRenderer();

        console.log('Using classic WebGL renderer');
        const rendererTypeEl = document.getElementById('renderer-type');
        if (rendererTypeEl) {
            rendererTypeEl.textContent = 'WebGL (Classic)';
        }

        return this.renderer;
    }

    setupRenderer() {
        const { width, height, pixelRatio } = this.getViewportSize();

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Shadow map configuration
        if (this.renderer.shadowMap) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Performance optimizations
        if (this.renderer.info) {
            this.renderer.info.autoReset = false;
        }
    }

    getViewportSize() {
        return {
            width: this.container.clientWidth || window.innerWidth,
            height: this.container.clientHeight || window.innerHeight,
            pixelRatio: window.devicePixelRatio
        };
    }

    resize() {
        const { width, height, pixelRatio } = this.getViewportSize();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    async renderAsync(scene, camera) {
        // WebGPURenderer supports async rendering
        if (this.renderer.renderAsync) {
            await this.renderer.renderAsync(scene, camera);
        } else {
            this.renderer.render(scene, camera);
        }
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }

    get domElement() {
        return this.canvas;
    }
}
