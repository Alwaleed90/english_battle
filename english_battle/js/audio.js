/**
 * English Battle - Synthesized Audio Effects via Web Audio API
 */
const SoundManager = {
    ctx: null,
    muted: false,
    init() {
        if (window.Storage) this.muted = window.Storage.isMuted();
    },
    getAudioContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) this.ctx = new AudioContextClass();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    },
    toggleMute() {
        this.muted = !this.muted;
        if (window.Storage) window.Storage.setMuted(this.muted);
        return this.muted;
    },
    playTone(frequency, type, duration, delay = 0, gainLevel = 0.15) {
        if (this.muted) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;
        setTimeout(() => {
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(frequency, ctx.currentTime);
                gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (e) {}
        }, delay);
    },
    playTick() { this.playTone(800, 'sine', 0.05, 0, 0.05); },
    playWarning() {
        this.playTone(440, 'triangle', 0.15, 0, 0.12);
        this.playTone(880, 'triangle', 0.15, 100, 0.12);
    },
    playCorrect() {
        this.playTone(523.25, 'sine', 0.15, 0, 0.18);
        this.playTone(659.25, 'sine', 0.15, 120, 0.18);
        this.playTone(783.99, 'sine', 0.18, 240, 0.2);
        this.playTone(1046.50, 'triangle', 0.4, 380, 0.22);
    },
    playWrong() {
        this.playTone(180, 'sawtooth', 0.25, 0, 0.15);
        this.playTone(140, 'sawtooth', 0.35, 180, 0.15);
    },
    playReveal() {
        this.playTone(587.33, 'sine', 0.1, 0, 0.1);
        this.playTone(880.00, 'sine', 0.15, 80, 0.12);
        this.playTone(1174.66, 'triangle', 0.25, 160, 0.15);
    },
    playVictory() {
        if (this.muted) return;
        const notes = [
            { f: 523.25, d: 0.15, t: 0 }, { f: 523.25, d: 0.15, t: 150 },
            { f: 523.25, d: 0.15, t: 300 }, { f: 659.25, d: 0.35, t: 450 },
            { f: 587.33, d: 0.20, t: 750 }, { f: 659.25, d: 0.20, t: 950 },
            { f: 783.99, d: 0.60, t: 1150 }, { f: 1046.50, d: 0.80, t: 1650 }
        ];
        notes.forEach(n => this.playTone(n.f, 'triangle', n.d, n.t, 0.2));
    }
};
SoundManager.init();
window.SoundManager = SoundManager;
