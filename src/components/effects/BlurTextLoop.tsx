import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

interface BlurTextLoopProps {
    text?: string;
    className?: string;
    animateBy?: 'words' | 'letters';
    initialDelay?: number;
    direction?: 'top' | 'bottom';
    totalSegmentCount?: number; // Prop for synchronization
}

/**
 * BlurTextLoop - Synchronized Exit Animation
 * Revised Cycle: Start Visible (Hold) -> Exit -> Pause -> Enter -> Loop
 */
const BlurTextLoop = ({
    text = '',
    className = '',
    animateBy = 'letters',
    initialDelay = 0,
    direction = 'top',
    totalSegmentCount,
}: BlurTextLoopProps) => {
    // State to trigger animation ONLY after mount
    const [runAnimation, setRunAnimation] = useState(false);

    useEffect(() => {
        // Start animation immediately after mount
        setRunAnimation(true);
    }, []);

    const segments = useMemo(() => {
        if (!text) return [];
        return animateBy === 'words' ? text.split(' ') : text.split('');
    }, [text, animateBy]);

    // Animation Timing - Cinematic Video Style
    const stagger = 0.2;
    const entranceDuration = 3.0;
    const holdDuration = 1.5;
    const exitDuration = 0.5;
    const pauseBeforeRepeat = 0;

    const effectiveTotalSegments = totalSegmentCount || segments.length;
    const lastEntranceEndTime = (effectiveTotalSegments - 1) * stagger + entranceDuration;
    const syncExitStartTime = lastEntranceEndTime + holdDuration;
    const cycleDuration = syncExitStartTime + exitDuration + pauseBeforeRepeat;

    return (
        <span className={className}>
            {segments.map((segment, index) => {
                const startEnterTime = index * stagger;
                const endEnterTime = startEnterTime + entranceDuration;
                const t1 = startEnterTime / cycleDuration;
                const t2 = endEnterTime / cycleDuration;
                const t3 = syncExitStartTime / cycleDuration;
                const t4 = (syncExitStartTime + exitDuration) / cycleDuration;

                const startY = direction === 'top' ? -25 : 25;
                const endY = direction === 'top' ? 10 : -10;

                return (
                    <motion.span
                        key={`${segment}-${index}`}
                        className="inline-block"
                        style={{ display: 'inline-block', backfaceVisibility: 'hidden' }}
                        // INITIAL STATE: If animation hasn't started, sit mostly visible (or blur in).
                        // To avoid "disappearing", we set initial to be the "visible" state if runAnimation is false?
                        // Actually, framer motion 'initial' effectively only runs on mount.
                        // We use the 'animate' prop to control state switch.
                        initial={{
                            filter: 'blur(0px)',
                            opacity: 1,
                            y: 0
                        }}
                        animate={runAnimation ? {
                            filter: ['blur(0px)', 'blur(0px)', 'blur(5px)', 'blur(5px)', 'blur(10px)', 'blur(10px)', 'blur(0px)'],
                            opacity: [1, 1, 0, 0, 0, 0, 1], // Start Visible -> Hold -> Exit -> Pause -> Enter
                            y: [0, 0, endY, endY, startY, startY, 0],
                        } : {
                            filter: 'blur(0px)',
                            opacity: 1,
                            y: 0
                        }}
                        transition={runAnimation ? {
                            duration: cycleDuration,
                            times: [0, t1, t2, t3, t4, 1],
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: [
                                "linear",
                                [0.2, 0.65, 0.3, 0.9],
                                "linear",
                                [0.4, 0, 1, 1],
                                "linear"
                            ],
                            delay: startEnterTime > 0 ? 0 : 0 // Handle stagger inside keyframes
                        } : {
                            duration: 0 // Instant reset if not running
                        }}
                    >
                        {segment === ' ' ? '\u00A0' : segment}
                        {animateBy === 'words' && index < segments.length - 1 ? '\u00A0' : ''}
                    </motion.span>
                );
            })}
        </span>
    );
};

export default BlurTextLoop;
