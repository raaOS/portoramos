/**
 * SoundManager Utility
 * Handles preloading and playback of retro sound effects for the OS simulation.
 */

type SoundType = 'startup' | 'click' | 'window-open' | 'window-close' | 'error' | 'notification' | 'drag';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<SoundType, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;
    private volume: number = 0.5;
    private initialized: boolean = false;

    private soundPaths: Record<SoundType, string> = {
        startup: '/sounds/startup.wav',
        click: '/sounds/click.wav',
        'window-open': '/sounds/window-open.wav',
        'window-close': '/sounds/window-close.wav',
        error: '/sounds/error.wav',
        notification: '/sounds/notification.wav',
        drag: '/sounds/drag.wav'
    };

    private constructor() { }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Preload all sounds. Should be called after user interaction.
     */
    public init() {
        if (this.initialized) return;

        Object.entries(this.soundPaths).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = this.volume;
            this.sounds.set(key as SoundType, audio);
        });

        this.initialized = true;
        console.log('[SoundManager] Initialized and preloaded sounds.');
    }

    /**
     * Play a sound by type
     */
    public play(type: SoundType, customVolume?: number) {
        if (this.isMuted) return;

        // Auto-init on first play if not already initialized
        if (!this.initialized) {
            this.init();
        }

        const sound = this.sounds.get(type);
        if (sound) {
            // Clone the node to allow overlapping sounds of the same type
            const clone = sound.cloneNode() as HTMLAudioElement;
            clone.volume = customVolume ?? this.volume;
            clone.play().catch(err => {
                // Browsers block autoplay if no interaction has occurred
                console.warn(`[SoundManager] Could not play sound "${type}":`, err.message);
            });
        } else {
            // Lazy load if not preloaded (fallback)
            const audio = new Audio(this.soundPaths[type]);
            audio.volume = customVolume ?? this.volume;
            audio.play().catch(err => console.warn(`[SoundManager] Failed to play lazy sound "${type}":`, err.message));
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
