/**
 * Performance Monitor - Tracks FPS and performance metrics
 */
export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsHistory = [];
        this.maxHistoryLength = 60;

        // DOM elements
        this.fpsElement = document.getElementById('fps-value');

        // Performance thresholds
        this.lowFpsThreshold = 30;
        this.targetFps = 60;

        // Adaptive quality settings
        this.qualityLevel = 'high';
        this.onQualityChange = null;
    }

    update() {
        this.frameCount++;

        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        // Update FPS every second
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastTime = currentTime;

            // Update history
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > this.maxHistoryLength) {
                this.fpsHistory.shift();
            }

            // Update display
            this.updateDisplay();

            // Check for quality adjustment
            this.checkQualityAdjustment();
        }
    }

    updateDisplay() {
        if (this.fpsElement) {
            this.fpsElement.textContent = this.fps;

            // Color code based on performance
            if (this.fps >= 55) {
                this.fpsElement.style.color = '#6bcf6b'; // Green
            } else if (this.fps >= 30) {
                this.fpsElement.style.color = '#ffd93d'; // Yellow
            } else {
                this.fpsElement.style.color = '#ff6b6b'; // Red
            }
        }
    }

    checkQualityAdjustment() {
        // Calculate average FPS over recent history
        if (this.fpsHistory.length < 10) return;

        const recentFps = this.fpsHistory.slice(-10);
        const avgFps = recentFps.reduce((a, b) => a + b, 0) / recentFps.length;

        let newQuality = this.qualityLevel;

        if (avgFps < this.lowFpsThreshold && this.qualityLevel !== 'low') {
            newQuality = 'low';
        } else if (avgFps < 45 && this.qualityLevel === 'high') {
            newQuality = 'medium';
        } else if (avgFps >= 55 && this.qualityLevel === 'low') {
            newQuality = 'medium';
        } else if (avgFps >= 58 && this.qualityLevel === 'medium') {
            newQuality = 'high';
        }

        if (newQuality !== this.qualityLevel) {
            this.qualityLevel = newQuality;
            if (this.onQualityChange) {
                this.onQualityChange(newQuality);
            }
        }
    }

    getAverageFps() {
        if (this.fpsHistory.length === 0) return 60;
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }

    getQualityLevel() {
        return this.qualityLevel;
    }

    setQualityChangeCallback(callback) {
        this.onQualityChange = callback;
    }

    reset() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsHistory = [];
    }
}
