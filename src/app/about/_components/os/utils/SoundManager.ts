/**
 * SoundManager Utility
 * Handles lazy loading and playback of retro sound effects for the OS simulation.
 * Standardized on WAV for maximum compatibility with generated assets.
 */

type SoundType = 'startup' | 'click' | 'window-open' | 'window-close' | 'error' | 'notification' | 'drag' | 'typing' | 'sent';

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
        drag: '/sounds/drag.wav?v=1.3',
        typing: '/sounds/click.wav?v=1.3',
        sent: '/sounds/notification.wav?v=1.3'
    };

    private soundVolumes: Record<string, number> = {};

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
     * Load dynamic configuration (overriding defaults)
     */
    public loadConfig(config: Record<string, { path: string, volume: number }>) {
        if (!config) return;

        console.log('[SoundManager] Loading dynamic sound configuration...');
        Object.entries(config).forEach(([key, setting]) => {
            const typeKey = key as SoundType;
            if (this.soundPaths[typeKey] !== undefined) {
                // Update internal path
                const oldPath = this.soundPaths[typeKey];
                this.soundPaths[typeKey] = setting.path;

                // If path changed, clear existing cached audio element to force reload
                if (oldPath !== setting.path) {
                    this.sounds.delete(typeKey);
                }

                // Store volume config
                this.soundVolumes[typeKey] = setting.volume;
            }
        });
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
                if (!path) {
                    console.warn(`[SoundManager] No path defined for sound type: ${type}`);
                    return;
                }
                audio = new Audio(path);
                this.sounds.set(type, audio);
            }

            // Always clone the node to allow overlapping sounds of the same type
            const clone = audio.cloneNode() as HTMLAudioElement;

            // Priority: customVolume > Config Volume > Global Default Volume
            const configVolume = this.soundVolumes[type as string];
            clone.volume = customVolume ?? configVolume ?? this.volume;

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
