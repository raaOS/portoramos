/**
 * SoundManager Utility
 * Handles lazy loading and playback of retro sound effects for the OS simulation.
 * Standardized on WAV for maximum compatibility with generated assets.
 */

type SoundType = 'startup' | 'click' | 'window-open' | 'window-close' | 'error' | 'notification' | 'drag' | 'typing' | 'sent' | 'unlock';

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
        sent: '/sounds/notification.wav?v=1.3',
        unlock: '/sounds/click.wav?v=1.3' // Using click sound for unlock "ceklek" effect
    };

    private soundVolumes: Record<string, number> = {};
    private isUnlocked: boolean = false;
    private pendingSounds: Set<SoundType> = new Set();
    private hasPlayedStartup: boolean = false;
    private suppressedSounds: Set<SoundType> = new Set();

    /**
     * Temporarily suppress a sound type for the given duration (ms).
     */
    public suppressSound(type: SoundType, durationMs: number) {
        this.suppressedSounds.add(type);
        setTimeout(() => {
            this.suppressedSounds.delete(type);
            console.log(`[SoundManager] Suppression lifted for "${type}".`);
        }, durationMs);
    }

    private constructor() {
        console.log("%c[SoundManager] v1.5-DEBUG (Autoplay-Ready)", "color: #00ff00; font-weight: bold;");
        if (typeof window !== 'undefined') {
            (window as unknown as { __soundManager: SoundManager }).__soundManager = this; // Attach for easy console debugging
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Unlock the audio context on user interaction WITHOUT playing any sounds.
     * Use this for the "Power On" button click.
     */
    public unlock() {
        if (this.isUnlocked) return;
        console.log('[SoundManager] Unlocking audio context silently...');
        this.isUnlocked = true;
        // Play a zero-volume buffer to secure the interaction context
        try {
            const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
            silentAudio.volume = 0;
            silentAudio.play().catch(() => { });
        } catch {
            // Ignore
        }
    }

    /**
     * Initialize/Unlock the sound system on first user interaction AND flush pending sounds.
     * This is called by interaction listeners when sounds are already queued.
     */
    public init() {
        if (this.isUnlocked && this.pendingSounds.size === 0) return;

        console.log(`[SoundManager] Interaction detected. Unlocking (pending: ${this.pendingSounds.size})...`);

        // 1. Mark as potentially unlocked
        this.isUnlocked = true;

        // 2. Play a tiny silent buffer synchronously to secure the interaction context
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        silentAudio.volume = 0;

        // Use the synchronous part of the event to play
        try {
            silentAudio.play().catch(() => { });

            // 3. IMPORTANT: Directly play the pending startup sound if it exists
            // Doing it here, inside the interaction handler's call stack, is much more reliable than inside a .then()
            if (this.pendingSounds.size > 0) {
                console.log(`[SoundManager] Triggering ${this.pendingSounds.size} pending sounds from interaction stack.`);
                const toPlay = Array.from(this.pendingSounds);
                this.pendingSounds.clear(); // Clear BEFORE playing to avoid re-triggering issues
                toPlay.forEach(type => this.play(type));
            }
        } catch (e) {
            console.error('[SoundManager] Unlock attempt failed:', e);
        }
    }

    /**
     * Load dynamic configuration (overriding defaults)
     */
    public loadConfig(config: Record<string, { path: string, volume: number }>) {
        if (!config) return;

        console.log('[SoundManager] Loading dynamic sound configuration:', config);
        Object.entries(config).forEach(([key, setting]) => {
            const typeKey = key as SoundType;
            if (this.soundPaths[typeKey] !== undefined) {
                const oldPath = this.soundPaths[typeKey];

                // UX Fix: Localization GitHub URL -> Local path
                let path = setting.path;
                if (path.includes('/public/sounds/')) {
                    const filename = path.split('/').pop()?.split('?')[0];
                    const version = path.split('?v=')[1] || '1.3';
                    if (filename) {
                        path = `/sounds/${filename}?v=${version}`;
                        console.log(`[SoundManager] Localized path for ${typeKey}: ${path}`);
                    }
                }

                this.soundPaths[typeKey] = path;

                if (oldPath !== path) {
                    console.log(`[SoundManager] Updating path for ${typeKey}: ${oldPath} -> ${path}`);
                    this.sounds.delete(typeKey);
                }

                this.soundVolumes[typeKey] = setting.volume;
            }
        });
    }

    /**
     * Play a sound by type
     */
    public play(type: SoundType, customVolume?: number) {
        if (this.isMuted) return;

        // Check if this sound is temporarily suppressed
        if (this.suppressedSounds.has(type)) {
            console.log(`[SoundManager] "${type}" is suppressed. Skipping.`);
            return;
        }

        // Protection for startup sound: only play once per session
        if (type === 'startup') {
            if (this.hasPlayedStartup) {
                console.log('[SoundManager] Startup sound already played. Skipping.');
                return;
            }
            // We set it true in the success handler below to allow retries if blocked
        }

        try {
            let audio = this.sounds.get(type);

            if (!audio) {
                const path = this.soundPaths[type];
                if (!path) {
                    console.warn(`[SoundManager] No path defined for sound type: ${type}`);
                    return;
                }
                console.log(`[SoundManager] Creating new Audio for ${type}: ${path}`);
                audio = new Audio(path);
                this.sounds.set(type, audio);
            }

            // Priority: customVolume > Config Volume > Global Default Volume
            const configVolume = this.soundVolumes[type as string];
            const targetVolume = customVolume ?? configVolume ?? this.volume;

            console.log(`[SoundManager] Playing "${type}" at volume ${targetVolume}`);

            // For very large sounds (like startup), avoid cloning on the first play 
            // to ensure metadata is handled correctly.
            let playTarget: HTMLAudioElement;
            if (audio.paused && audio.currentTime === 0) {
                playTarget = audio;
            } else {
                playTarget = audio.cloneNode() as HTMLAudioElement;
            }

            playTarget.volume = targetVolume;
            const playPromise = playTarget.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`[SoundManager] Successfully started playing "${type}"`);
                    if (type === 'startup') {
                        this.hasPlayedStartup = true;
                    }
                }).catch(err => {
                    if (err.name === 'NotAllowedError') {
                        this.pendingSounds.add(type);
                        console.info(`[SoundManager] Autoplay blocked for "${type}". Queued for interaction.`);
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

    /**
     * Clear the cached Audio element for a specific sound type.
     * Call this after uploading a new file to force the next play() to load fresh from disk.
     */
    public clearCache(type: SoundType) {
        if (this.sounds.has(type)) {
            const audio = this.sounds.get(type);
            if (audio) {
                audio.pause();
                audio.src = '';
            }
            this.sounds.delete(type);
            console.log(`[SoundManager] Cache cleared for "${type}".`);
        }
        // Reset startup protection so it can play again on next Power On
        if (type === 'startup') {
            this.hasPlayedStartup = false;
        }
    }
}

export const soundManager = SoundManager.getInstance();
