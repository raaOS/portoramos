import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface BlurTextLoopProps {
    text?: string;
    className?: string;
    animateBy?: 'words' | 'letters';
    initialDelay?: number;
    direction?: 'top' | 'bottom';
}

/**
 * BlurTextLoop - Synchronized Exit Animation
 * Entrance: Staggered (letters fall one by one)
 * Exit: Synchronized (all letters blur out together)
 * Loop: Continuous
 */
const BlurTextLoop = ({
    text = '',
    className = '',
    animateBy = 'letters',
    initialDelay = 0,
    direction = 'top',
}: BlurTextLoopProps) => {
    const segments = useMemo(() => {
        if (!text) return [];
        return animateBy === 'words' ? text.split(' ') : text.split('');
    }, [text, animateBy]);

    // Increased distance for more dramatic fall
    const yStart = direction === 'top' ? -100 : 100;
    const yEnd = 0;

    // Animation Timing Configuration
    const stagger = 0.08;          // Delay between each letter's entrance (slightly faster)
    const entranceDuration = 1.0;  // Entrance animation duration
    const holdDuration = 2.5;      // How long text stays clear and visible
    const exitDuration = 1.0;      // Exit fade out duration (synchronized for all)
    const pauseBeforeRepeat = 0.3; // Pause before restarting loop

    // Calculate total cycle duration to fit the last letter
    const totalSegments = segments.length;
    const lastEntranceEndTime = (totalSegments - 1) * stagger + entranceDuration;
    const syncExitStartTime = lastEntranceEndTime + holdDuration;
    const cycleDuration = syncExitStartTime + exitDuration + pauseBeforeRepeat;

    return (
        <span className={className}>
            {segments.map((segment, index) => {
                // Calculate specific timing points for this segment (0 to 1 range)
                const startDelay = index * stagger;
                const entranceEnd = startDelay + entranceDuration;

                // Convert to percentage of total cycle
                const t1 = startDelay / cycleDuration;           // Start Entrance
                const t2 = entranceEnd / cycleDuration;          // End Entrance (Clear)
                const t3 = syncExitStartTime / cycleDuration;    // Start Exit (Synchronized for ALL letters)
                const t4 = (syncExitStartTime + exitDuration) / cycleDuration; // End Exit (Hidden)

                return (
                    <motion.span
                        key={`${segment}-${index}`}
                        className="inline-block will-change-[filter,transform]"
                        style={{ display: 'inline-block' }}
                        initial={{
                            filter: 'blur(10px)',
                            opacity: 0,
                            y: direction === 'top' ? -10 : 10 // Reduced from 30 to 10
                        }}
                        animate={{
                            // Entrance: blur in → Exit: blur out (synchronized)
                            filter: [
                                'blur(10px)',  // 0: Hidden start
                                'blur(10px)',  // t1: Before entrance
                                'blur(0px)',   // t2: Clear (entrance done)
                                'blur(0px)',   // t3: Still clear (hold)
                                'blur(8px)',   // t4: Blur out (exit)
                                'blur(10px)'   // 1: Hidden end
                            ],
                            // Opacity: fade in → fade out (synchronized)
                            opacity: [
                                0,    // 0: Hidden start
                                0,    // t1: Before entrance
                                1,    // t2: Fully visible
                                1,    // t3: Still visible (hold)
                                0,    // t4: Fade out (exit)
                                0     // 1: Hidden end
                            ],
                            // Y position: fall down → move up on exit
                            y: [
                                direction === 'top' ? -10 : 10,  // Reduced from 30
                                direction === 'top' ? -10 : 10,
                                0,
                                0,
                                direction === 'top' ? -5 : 5,    // Reduced from 15
                                direction === 'top' ? -10 : 10   // Reduced from 30
                            ],
                        }}
                        transition={{
                            duration: cycleDuration,
                            delay: initialDelay,
                            times: [0, t1, t2, t3, t4, 1],
                            repeat: Infinity,
                            repeatType: 'loop',
                            repeatDelay: 0,
                            ease: 'easeInOut',
                        }}
                    >
                        {segment}
                        {animateBy === 'words' && index < segments.length - 1 ? '\u00A0' : ''}
                    </motion.span>
                );
            })}
        </span>
    );
};

export default BlurTextLoop;
