import * as THREE from 'three/webgpu';

/**
 * Audio Manager - Handles background music and interaction sounds
 * Optimized for performance with pre-generated audio buffers
 */
export class AudioManager {
    constructor() {
        this.listener = null;
        this.audioLoader = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.isPlaying = false;
        this.isInitialized = false;
        this.isMusicReady = false;

        // Web Audio context
        this.audioContext = null;
        this.gainNode = null;
        this.backgroundSource = null;
        this.musicBuffer = null;
        this.musicGain = null;

        // Prevent concurrent operations
        this.isGenerating = false;
        this.pendingPlay = false;
    }

    init(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.audioLoader = new THREE.AudioLoader();

        // Create audio context lazily (will be created on first user interaction)
        this.isInitialized = true;

        return this;
    }

    /**
     * Ensure audio context is ready (must be called from user interaction)
     */
    async ensureAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume;
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (!this.bellsBuffer) {
            this.bellsBuffer = this.generateBellSound();
            this.clickBuffer = this.generateClickSound();
            this.chimeBuffer = this.generateChimeSound();
            this.giftOpenBuffer = this.generateGiftOpenSound();
        }
    }

    generateBellSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.5;
        const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                const fundamental = 880;
                const decay = Math.exp(-t * 3);

                let sample = 0;
                sample += Math.sin(2 * Math.PI * fundamental * t) * 0.5;
                sample += Math.sin(2 * Math.PI * fundamental * 2 * t) * 0.25;
                sample += Math.sin(2 * Math.PI * fundamental * 2.76 * t) * 0.15;
                sample += Math.sin(2 * Math.PI * fundamental * 4.07 * t) * 0.1;

                data[i] = sample * decay * 0.3;
            }
        }

        return buffer;
    }

    generateClickSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.15;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 1200 - t * 5000;
            const decay = Math.exp(-t * 30);
            data[i] = Math.sin(2 * Math.PI * freq * t) * decay * 0.5;
        }

        return buffer;
    }

    generateChimeSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 3;
        const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        const notes = [523.25, 587.33, 659.25, 783.99, 880];

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                let sample = 0;

                notes.forEach((freq, index) => {
                    const noteStart = index * 0.3;
                    if (t > noteStart) {
                        const noteT = t - noteStart;
                        const decay = Math.exp(-noteT * 1.5);
                        sample += Math.sin(2 * Math.PI * freq * noteT) * decay * 0.15;
                        sample += Math.sin(2 * Math.PI * freq * 2 * noteT) * decay * 0.05;
                    }
                });

                data[i] = sample * 0.4;
            }
        }

        return buffer;
    }

    /**
     * Generate background music asynchronously using chunks to avoid blocking UI
     */
    async generateBackgroundMusicAsync() {
        if (this.isGenerating) return;
        if (this.musicBuffer) return; // Already generated

        this.isGenerating = true;

        const sampleRate = this.audioContext.sampleRate;
        const duration = 16;
        const totalSamples = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, totalSamples, sampleRate);

        const noteFreq = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
            'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99
        };

        const melody = [
            { note: 'E5', start: 0, dur: 0.3 },
            { note: 'E5', start: 0.4, dur: 0.3 },
            { note: 'E5', start: 0.8, dur: 0.6 },
            { note: 'E5', start: 1.6, dur: 0.3 },
            { note: 'E5', start: 2.0, dur: 0.3 },
            { note: 'E5', start: 2.4, dur: 0.6 },
            { note: 'E5', start: 3.2, dur: 0.3 },
            { note: 'G5', start: 3.6, dur: 0.3 },
            { note: 'C5', start: 4.0, dur: 0.3 },
            { note: 'D5', start: 4.4, dur: 0.3 },
            { note: 'E5', start: 4.8, dur: 1.0 },
            { note: 'F5', start: 6.0, dur: 0.3 },
            { note: 'F5', start: 6.4, dur: 0.3 },
            { note: 'F5', start: 6.8, dur: 0.4 },
            { note: 'F5', start: 7.3, dur: 0.3 },
            { note: 'F5', start: 7.7, dur: 0.3 },
            { note: 'E5', start: 8.1, dur: 0.3 },
            { note: 'E5', start: 8.5, dur: 0.3 },
            { note: 'E5', start: 8.9, dur: 0.2 },
            { note: 'E5', start: 9.2, dur: 0.2 },
            { note: 'D5', start: 9.6, dur: 0.3 },
            { note: 'D5', start: 10.0, dur: 0.3 },
            { note: 'E5', start: 10.4, dur: 0.3 },
            { note: 'D5', start: 10.8, dur: 0.6 },
            { note: 'G5', start: 11.6, dur: 1.0 },
            { note: 'E5', start: 12.8, dur: 0.3 },
            { note: 'E5', start: 13.2, dur: 0.3 },
            { note: 'E5', start: 13.6, dur: 0.6 },
            { note: 'G5', start: 14.4, dur: 0.3 },
            { note: 'C5', start: 14.8, dur: 0.4 },
            { note: 'E5', start: 15.4, dur: 0.5 }
        ];

        const bass = [
            { note: 'C4', start: 0, dur: 1.5 },
            { note: 'G4', start: 1.6, dur: 1.5 },
            { note: 'C4', start: 3.2, dur: 1.5 },
            { note: 'G4', start: 4.8, dur: 1.5 },
            { note: 'F4', start: 6.0, dur: 1.5 },
            { note: 'C4', start: 7.6, dur: 1.5 },
            { note: 'G4', start: 9.2, dur: 1.5 },
            { note: 'C4', start: 10.8, dur: 1.5 },
            { note: 'G4', start: 12.4, dur: 1.5 },
            { note: 'C4', start: 14.0, dur: 2.0 }
        ];

        // Generate in chunks to avoid blocking the main thread
        const chunkSize = sampleRate; // 1 second at a time
        const data0 = buffer.getChannelData(0);
        const data1 = buffer.getChannelData(1);

        for (let chunkStart = 0; chunkStart < totalSamples; chunkStart += chunkSize) {
            const chunkEnd = Math.min(chunkStart + chunkSize, totalSamples);

            // Process this chunk
            for (let i = chunkStart; i < chunkEnd; i++) {
                const t = i / sampleRate;
                let sample = 0;

                // Melody
                for (const { note, start, dur } of melody) {
                    if (t >= start && t < start + dur + 0.3) {
                        const noteT = t - start;
                        const freq = noteFreq[note];
                        const env = Math.exp(-noteT * 3) * Math.min(noteT * 20, 1);
                        sample += Math.sin(2 * Math.PI * freq * noteT) * env * 0.25;
                        sample += Math.sin(2 * Math.PI * freq * 2 * noteT) * env * 0.1;
                        sample += Math.sin(2 * Math.PI * freq * 3 * noteT) * env * 0.05;
                    }
                }

                // Bass
                for (const { note, start, dur } of bass) {
                    if (t >= start && t < start + dur + 0.2) {
                        const noteT = t - start;
                        const freq = noteFreq[note];
                        const env = Math.exp(-noteT * 0.5) * Math.min(noteT * 5, 1) * 0.15;
                        sample += Math.sin(2 * Math.PI * freq * noteT) * env;
                        sample += Math.sin(2 * Math.PI * freq * 0.5 * noteT) * env * 0.5;
                    }
                }

                // Sleigh bells (simplified - less frequent for performance)
                const bellInterval = 0.5;
                const bellT = t % bellInterval;
                if (bellT < 0.05) {
                    const bellEnv = Math.exp(-bellT * 60) * 0.08;
                    sample += Math.sin(2 * Math.PI * 2500 * bellT) * bellEnv;
                    sample += Math.sin(2 * Math.PI * 3200 * bellT) * bellEnv * 0.7;
                    sample += (Math.random() - 0.5) * bellEnv * 0.2;
                }

                // Soft limiting
                sample = Math.tanh(sample * 1.5) * 0.6;
                data0[i] = sample;
                data1[i] = sample * 0.95;
            }

            // Yield to the browser to keep UI responsive
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        this.musicBuffer = buffer;
        this.isMusicReady = true;
        this.isGenerating = false;

        // If there was a pending play request, play now
        if (this.pendingPlay) {
            this.pendingPlay = false;
            this.playMusicBuffer();
        }
    }

    /**
     * Play the pre-generated music buffer
     */
    playMusicBuffer() {
        if (!this.musicBuffer || this.isPlaying) return;

        this.backgroundSource = this.audioContext.createBufferSource();
        this.backgroundSource.buffer = this.musicBuffer;
        this.backgroundSource.loop = true;

        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = this.volume * 0.3;

        this.backgroundSource.connect(this.musicGain);
        this.musicGain.connect(this.audioContext.destination);

        this.backgroundSource.start();
        this.isPlaying = true;

        // Handle when source ends (if loop is turned off)
        this.backgroundSource.onended = () => {
            if (this.isPlaying) {
                this.isPlaying = false;
            }
        };
    }

    async startBackgroundMusic() {
        if (this.isPlaying) return;
        if (!this.enabled) return;

        await this.ensureAudioContext();

        // If music is ready, play immediately
        if (this.isMusicReady && this.musicBuffer) {
            this.playMusicBuffer();
            return;
        }

        // Otherwise, start generating and mark as pending
        this.pendingPlay = true;
        this.generateBackgroundMusicAsync();
    }

    stopBackgroundMusic() {
        this.pendingPlay = false;

        if (this.backgroundSource && this.isPlaying) {
            try {
                this.backgroundSource.stop();
            } catch (e) {
                // Source may already be stopped
            }
            this.backgroundSource = null;
            this.isPlaying = false;
        }
    }

    toggleMusic() {
        if (this.isPlaying) {
            this.stopBackgroundMusic();
            return false;
        } else {
            this.startBackgroundMusic();
            // Return true if playing or will play soon
            return true;
        }
    }

    generateGiftOpenSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.2;
        const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                let sample = 0;

                const whooshFreq = 200 + t * 3000;
                const whooshEnv = Math.exp(-t * 4) * Math.min(t * 30, 1);
                sample += (Math.random() * 2 - 1) * whooshEnv * 0.15;
                sample += Math.sin(2 * Math.PI * whooshFreq * t) * whooshEnv * 0.1;

                const sparkleStart = 0.15;
                if (t > sparkleStart) {
                    const st = t - sparkleStart;
                    const sparkleFreqs = [1200, 1800, 2400, 3000, 3600];
                    sparkleFreqs.forEach((freq, idx) => {
                        const noteStart = idx * 0.08;
                        if (st > noteStart) {
                            const nt = st - noteStart;
                            const env = Math.exp(-nt * 5) * Math.min(nt * 40, 1);
                            sample += Math.sin(2 * Math.PI * freq * nt) * env * 0.08;
                        }
                    });
                }

                const revealStart = 0.3;
                if (t > revealStart) {
                    const rt = t - revealStart;
                    const revealEnv = Math.exp(-rt * 2) * Math.min(rt * 10, 1);
                    sample += Math.sin(2 * Math.PI * 523.25 * rt) * revealEnv * 0.15;
                    sample += Math.sin(2 * Math.PI * 659.25 * rt) * revealEnv * 0.1;
                    sample += Math.sin(2 * Math.PI * 783.99 * rt) * revealEnv * 0.08;
                    sample += Math.sin(2 * Math.PI * 1046.5 * rt) * revealEnv * 0.05;
                }

                sample = Math.tanh(sample * 2) * 0.5;
                data[i] = sample;
            }
        }

        return buffer;
    }

    async playInteraction() {
        if (!this.enabled) return;

        await this.ensureAudioContext();
        if (!this.clickBuffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.clickBuffer;

        const gain = this.audioContext.createGain();
        gain.gain.value = this.volume * 0.5;

        source.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start();
    }

    async playBell() {
        if (!this.enabled) return;

        await this.ensureAudioContext();
        if (!this.bellsBuffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.bellsBuffer;

        const gain = this.audioContext.createGain();
        gain.gain.value = this.volume * 0.4;

        source.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start();
    }

    async playChime() {
        if (!this.enabled) return;

        await this.ensureAudioContext();
        if (!this.chimeBuffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.chimeBuffer;

        const gain = this.audioContext.createGain();
        gain.gain.value = this.volume * 0.3;

        source.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start();
    }

    async playGiftOpen() {
        if (!this.enabled) return;

        await this.ensureAudioContext();
        if (!this.giftOpenBuffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.giftOpenBuffer;

        const gain = this.audioContext.createGain();
        gain.gain.value = this.volume * 0.6;

        source.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start();

        this.playBell();
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
        if (this.musicGain) {
            this.musicGain.gain.value = this.volume * 0.3;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopBackgroundMusic();
        }
    }

    dispose() {
        this.stopBackgroundMusic();
        this.pendingPlay = false;

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.musicBuffer = null;
        this.bellsBuffer = null;
        this.clickBuffer = null;
        this.chimeBuffer = null;
        this.giftOpenBuffer = null;
    }
}
