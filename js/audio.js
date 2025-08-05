// Quantum Runner - Audio System
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this.musicGainNode = null;
        this.sfxGainNode = null;
        
        this.spatialSounds = [];
        this.listener = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.setupGainNodes();
            this.generateProcedualSounds();
            this.generateProceduralMusic();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    setupGainNodes() {
        if (!this.audioContext) return;
        
        // Master gain node
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.gain.value = this.masterVolume;
        this.masterGainNode.connect(this.audioContext.destination);
        
        // Music gain node
        this.musicGainNode = this.audioContext.createGain();
        this.musicGainNode.gain.value = this.musicVolume;
        this.musicGainNode.connect(this.masterGainNode);
        
        // SFX gain node
        this.sfxGainNode = this.audioContext.createGain();
        this.sfxGainNode.gain.value = this.sfxVolume;
        this.sfxGainNode.connect(this.masterGainNode);
    }
    
    generateProcedualSounds() {
        if (!this.audioContext) return;
        
        // Jump sound
        this.sounds.jump = this.createJumpSound();
        
        // Dash sound
        this.sounds.dash = this.createDashSound();
        
        // Wall jump sound
        this.sounds.wallJump = this.createWallJumpSound();
        
        // Collect sound
        this.sounds.collect = this.createCollectSound();
        
        // Enemy defeat sound
        this.sounds.enemyDefeat = this.createEnemyDefeatSound();
        
        // Phase shift sound
        this.sounds.phaseShift = this.createPhaseShiftSound();
        
        // Time slow sound
        this.sounds.timeSlow = this.createTimeSlowSound();
        
        // Death sound
        this.sounds.death = this.createDeathSound();
        
        // Step sounds
        this.sounds.step1 = this.createStepSound(200);
        this.sounds.step2 = this.createStepSound(180);
    }
    
    createJumpSound() {
        return (pitch = 1, volume = 1) => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200 * pitch, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400 * pitch, this.audioContext.currentTime + 0.1);
            
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            
            gainNode.gain.setValueAtTime(0.3 * volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    createDashSound() {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const noise = this.createWhiteNoise();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            filter.type = 'bandpass';
            filter.frequency.value = 800;
            filter.Q.value = 5;
            
            gainNode.gain.setValueAtTime(0.4 * volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            noise.start();
            noise.stop(this.audioContext.currentTime + 0.15);
        };
    }
    
    createWallJumpSound() {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.25 * volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.25);
        };
    }
    
    createCollectSound() {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime);
            oscillator1.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
            oscillator1.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
            
            oscillator2.type = 'sine';
            oscillator2.frequency.value = 1047;
            
            gainNode.gain.setValueAtTime(0.2 * volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            oscillator1.start();
            oscillator2.start();
            oscillator1.stop(this.audioContext.currentTime + 0.3);
            oscillator2.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    createEnemyDefeatSound() {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const noise = this.createWhiteNoise();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3 * volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            noise.start();
            noise.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    createPhaseShiftSound() {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2 * volume, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }
    
    createTimeSlowSound() {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'triangle';
            oscillator.frequency.value = 60;
            
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            
            gainNode.gain.setValueAtTime(0.15 * volume, this.audioContext.currentTime);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            oscillator.start();
            return { oscillator, gainNode }; // Return for stopping later
        };
    }
    
    createDeathSound() {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1);
            
            gainNode.gain.setValueAtTime(0.3 * volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 1);
        };
    }
    
    createStepSound(frequency) {
        return (volume = 1) => {
            if (!this.audioContext) return;
            
            const noise = this.createWhiteNoise();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            filter.type = 'highpass';
            filter.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0.1 * volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            noise.start();
            noise.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    createWhiteNoise() {
        if (!this.audioContext) return null;
        
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }
    
    generateProceduralMusic() {
        if (!this.audioContext) return;
        
        this.music.theme = this.createThemeMusic();
        this.music.action = this.createActionMusic();
        this.music.ambient = this.createAmbientMusic();
    }
    
    createThemeMusic() {
        // This would be a complex procedural music generator
        // For now, return a simple function that creates musical tones
        return () => {
            if (!this.audioContext) return;
            
            const melody = [523, 659, 784, 659, 523, 392, 523]; // C major scale
            let noteIndex = 0;
            const noteDuration = 0.5;
            
            const playNote = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.value = melody[noteIndex % melody.length];
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noteDuration);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.musicGainNode);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + noteDuration);
                
                noteIndex++;
                
                if (noteIndex < melody.length * 4) {
                    setTimeout(playNote, noteDuration * 1000);
                }
            };
            
            playNote();
        };
    }
    
    createActionMusic() {
        return () => {
            // High-energy action music
            if (!this.audioContext) return;
            
            const bassline = [130, 146, 164, 146]; // Bass notes
            let bassIndex = 0;
            
            const playBass = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'square';
                oscillator.frequency.value = bassline[bassIndex % bassline.length];
                
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.musicGainNode);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.25);
                
                bassIndex++;
                
                setTimeout(playBass, 250);
            };
            
            playBass();
        };
    }
    
    createAmbientMusic() {
        return () => {
            // Atmospheric ambient music
            if (!this.audioContext) return;
            
            const createPad = (frequency, duration) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                oscillator.type = 'sine';
                oscillator.frequency.value = frequency;
                
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 2);
                gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime + duration - 2);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                
                oscillator.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(this.musicGainNode);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + duration);
            };
            
            createPad(130, 8);
            setTimeout(() => createPad(164, 8), 4000);
            setTimeout(() => createPad(196, 8), 8000);
        };
    }
    
    // Public API
    playSound(soundName, volume = 1, pitch = 1) {
        if (this.sounds[soundName]) {
            this.sounds[soundName](pitch, volume);
        }
    }
    
    playSpatialSound(soundName, x, y, volume = 1, pitch = 1) {
        const distance = Math.sqrt(
            Math.pow(x - this.listener.x, 2) + 
            Math.pow(y - this.listener.y, 2)
        );
        
        const maxDistance = 500;
        const spatialVolume = Math.max(0, 1 - (distance / maxDistance)) * volume;
        
        if (spatialVolume > 0.01) {
            this.playSound(soundName, spatialVolume, pitch);
        }
    }
    
    playMusic(musicName) {
        this.stopMusic();
        if (this.music[musicName]) {
            this.currentMusic = musicName;
            this.music[musicName]();
        }
    }
    
    stopMusic() {
        this.currentMusic = null;
        // In a real implementation, we'd need to track and stop all music nodes
    }
    
    setListenerPosition(x, y) {
        this.listener.x = x;
        this.listener.y = y;
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Utils.clamp(volume, 0, 1);
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.musicVolume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Utils.clamp(volume, 0, 1);
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = this.sfxVolume;
        }
    }
    
    // Time slow effect for audio
    setTimeScale(scale) {
        if (this.audioContext) {
            // This would modify playback rate of all active sounds
            // Web Audio API doesn't directly support this, so we'd need
            // to track all active sources and modify them individually
        }
    }
    
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}