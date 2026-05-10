import * as THREE from 'three/webgpu';

/**
 * Ground plane with snow texture
 */
export class Ground {
    constructor() {
        this.mesh = null;
    }

    create() {
        // Create ground plane
        const geometry = new THREE.PlaneGeometry(50, 50, 50, 50);

        // Add some vertex displacement for snow mounds
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 1];

            // Create gentle snow mounds using noise-like function
            const height = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.2 +
                          Math.sin(x * 0.7 + 1) * Math.cos(z * 0.5) * 0.1;

            positions[i + 2] = height;
        }

        geometry.computeVertexNormals();

        // Snow material
        const material = new THREE.MeshStandardMaterial({
            color: 0xf0f5ff,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: false
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0;
        this.mesh.receiveShadow = true;

        return this.mesh;
    }

    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
