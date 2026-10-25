/**
 * English Battle - Timer Module
 */
class QuizTimer {
    constructor(duration = 30, options = {}) {
        this.duration = duration;
        this.remaining = duration;
        this.isRunning = false;
        this.isPaused = false;
        this.timerId = null;
        this.onTick = options.onTick || (() => {});
        this.onWarning = options.onWarning || (() => {});
        this.onExpire = options.onExpire || (() => {});
        this.onStateChange = options.onStateChange || (() => {});
    }
    start(newDuration = null) {
        if (newDuration !== null) {
            this.duration = newDuration;
            this.remaining = newDuration;
        }
        this.stop();
        if (this.duration <= 0) {
            this.isRunning = true;
            this.isPaused = false;
            this.onTick(Infinity, 100);
            this.onStateChange({ isRunning: true, isPaused: false, untimed: true });
            return;
        }
        this.isRunning = true;
        this.isPaused = false;
        this.onTick(this.remaining, (this.remaining / this.duration) * 100);
        this.onStateChange({ isRunning: true, isPaused: false, untimed: false });
        this.timerId = setInterval(() => {
            if (this.isPaused) return;
            this.remaining--;
            const percentage = Math.max(0, (this.remaining / this.duration) * 100);
            this.onTick(this.remaining, percentage);
            if (this.remaining <= 5 && this.remaining > 0) {
                this.onWarning(this.remaining);
                if (window.SoundManager) window.SoundManager.playWarning();
            } else if (this.remaining > 5 && this.remaining % 5 === 0) {
                if (window.SoundManager) window.SoundManager.playTick();
            }
            if (this.remaining <= 0) {
                this.stop();
                if (window.SoundManager) window.SoundManager.playWrong();
                this.onExpire();
            }
        }, 1000);
    }
    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.onStateChange({ isRunning: true, isPaused: true, untimed: this.duration <= 0 });
        }
    }
    resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.onStateChange({ isRunning: true, isPaused: false, untimed: this.duration <= 0 });
        }
    }
    togglePause() {
        if (this.isPaused) this.resume(); else this.pause();
        return this.isPaused;
    }
    stop() {
        if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
        this.isRunning = false;
        this.isPaused = false;
        this.onStateChange({ isRunning: false, isPaused: false, untimed: this.duration <= 0 });
    }
    getRemainingTime() { return this.remaining; }
    getElapsedSeconds() { return Math.max(0, this.duration - this.remaining); }
}
window.QuizTimer = QuizTimer;
