import * as THREE from 'three/webgpu';

/**
 * Resource Manager - Handles efficient resource loading and memory management
 */
export class ResourceManager {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.loadedTextures = new Map();
        this.loadedGeometries = new Map();
        this.loadedMaterials = new Map();

        // Loading state
        this.totalToLoad = 0;
        this.loaded = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    /**
     * Load a texture with caching
     */
    loadTexture(url, options = {}) {
        // Check cache first
        if (this.loadedTextures.has(url)) {
            return Promise.resolve(this.loadedTextures.get(url));
        }

        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // Apply options
                    if (options.encoding) {
                        texture.colorSpace = options.encoding;
                    }
                    if (options.wrapS) texture.wrapS = options.wrapS;
                    if (options.wrapT) texture.wrapT = options.wrapT;
                    if (options.repeat) texture.repeat.set(options.repeat.x, options.repeat.y);

                    // Enable anisotropic filtering for better quality
                    texture.anisotropy = 4;

                    // Cache the texture
                    this.loadedTextures.set(url, texture);

                    this.loaded++;
                    this.updateProgress();

                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('Error loading texture:', url, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Create or retrieve cached geometry
     */
    getGeometry(type, params) {
        const key = `${type}-${JSON.stringify(params)}`;

        if (this.loadedGeometries.has(key)) {
            return this.loadedGeometries.get(key);
        }

        let geometry;

        switch (type) {
            case 'box':
                geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(params.radiusTop, params.radiusBottom, params.height, params.radialSegments);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(params.radius, params.height, params.radialSegments);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(params.width, params.height, params.widthSegments, params.heightSegments);
                break;
            default:
                throw new Error(`Unknown geometry type: ${type}`);
        }

        this.loadedGeometries.set(key, geometry);
        return geometry;
    }

    /**
     * Create or retrieve cached material
     */
    getMaterial(type, params) {
        const key = `${type}-${JSON.stringify(params)}`;

        if (this.loadedMaterials.has(key)) {
            return this.loadedMaterials.get(key).clone();
        }

        let material;

        switch (type) {
            case 'standard':
                material = new THREE.MeshStandardMaterial(params);
                break;
            case 'basic':
                material = new THREE.MeshBasicMaterial(params);
                break;
            case 'phong':
                material = new THREE.MeshPhongMaterial(params);
                break;
            default:
                throw new Error(`Unknown material type: ${type}`);
        }

        this.loadedMaterials.set(key, material);
        return material;
    }

    /**
     * Preload all resources
     */
    async preload(resourceList) {
        this.totalToLoad = resourceList.length;
        this.loaded = 0;

        const promises = resourceList.map((resource) => {
            switch (resource.type) {
                case 'texture':
                    return this.loadTexture(resource.url, resource.options);
                default:
                    return Promise.resolve();
            }
        });

        await Promise.all(promises);

        if (this.onComplete) {
            this.onComplete();
        }
    }

    updateProgress() {
        const progress = this.totalToLoad > 0 ? (this.loaded / this.totalToLoad) * 100 : 100;

        if (this.onProgress) {
            this.onProgress(progress);
        }
    }

    setOnProgress(callback) {
        this.onProgress = callback;
    }

    setOnComplete(callback) {
        this.onComplete = callback;
    }

    /**
     * Dispose a specific resource
     */
    disposeTexture(url) {
        if (this.loadedTextures.has(url)) {
            const texture = this.loadedTextures.get(url);
            texture.dispose();
            this.loadedTextures.delete(url);
        }
    }

    /**
     * Dispose all resources
     */
    disposeAll() {
        // Dispose textures
        this.loadedTextures.forEach((texture) => {
            texture.dispose();
        });
        this.loadedTextures.clear();

        // Dispose geometries
        this.loadedGeometries.forEach((geometry) => {
            geometry.dispose();
        });
        this.loadedGeometries.clear();

        // Dispose materials
        this.loadedMaterials.forEach((material) => {
            material.dispose();
        });
        this.loadedMaterials.clear();
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        return {
            textures: this.loadedTextures.size,
            geometries: this.loadedGeometries.size,
            materials: this.loadedMaterials.size
        };
    }
}
