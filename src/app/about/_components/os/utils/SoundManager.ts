/**
 * SoundManager Utility
 * Handles lazy loading and playback of retro sound effects for the OS simulation.
 * Standardized on WAV for maximum compatibility with generated assets.
 */

type SoundType = 'startup' | 'click' | 'window-open' | 'window-close' | 'error' | 'notification' | 'drag';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<SoundType, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;
    private volume: number = 0.5;

    private soundPaths: Record<SoundType, string> = {
        startup: '/sounds/startup.wav?v=1.3',
        click: '/sounds/click.wav?v=1.3',
        'window-open': '/sounds/window-open.wav?v=1.3',
        'window-close': '/sounds/window-close.wav?v=1.3',
        error: '/sounds/error.wav?v=1.3',
        notification: '/sounds/notification.wav?v=1.3',
        drag: '/sounds/drag.wav?v=1.3'
    };

    private constructor() {
        console.log("%c[SoundManager] v1.3-STABLE (PCM-WAV)", "color: #00ff00; font-weight: bold;");
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Initialize the sound system.
     */
    public init() {
        console.log('[SoundManager] Sound system ready (lazy load).');
    }

    /**
     * Play a sound by type
     */
    public play(type: SoundType, customVolume?: number) {
        if (this.isMuted) return;

        try {
            let audio = this.sounds.get(type);

            // Lazy load if not exists in memory
            if (!audio) {
                const path = this.soundPaths[type];
                audio = new Audio(path);
                this.sounds.set(type, audio);
            }

            // Always clone the node to allow overlapping sounds of the same type
            const clone = audio.cloneNode() as HTMLAudioElement;
            clone.volume = customVolume ?? this.volume;

            const playPromise = clone.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    // Browsers block autoplay if no interaction has occurred
                    if (err.name === 'NotAllowedError') {
                        // Expected failure if user hasn't interacted yet
                        return;
                    }
                    console.warn(`[SoundManager] Playback failed for "${type}":`, err.message);
                });
            }
        } catch (e) {
            console.error(`[SoundManager] Critical error playing "${type}":`, e);
        }
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
    }

    public setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(sound => {
            sound.volume = this.volume;
        });
    }

    public getIsMuted(): boolean {
        return this.isMuted;
    }
}

export const soundManager = SoundManager.getInstance();
