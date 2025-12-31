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

    // Animation Config
    const stagger = 0.1;
    const totalCycle = 6.0;

    return (
        <span className={className}>
            {segments.map((segment, index) => {
                // Keyframes (Normalized 0-1)
                // 0.0 -> 0.15: Enter (Fade In + Blur Out + Slide Up)
                // 0.15 -> 0.60: Hold (Visible)
                // 0.60 -> 0.75: Exit (Fade Out + Blur In + Slide Up)
                // 0.75 -> 1.00: Pause (Hidden)

                return (
                    <motion.span
                        key={`${segment}-${index}`}
                        className="inline-block"
                        style={{ display: 'inline-block', backfaceVisibility: 'hidden', willChange: 'filter, opacity, transform' }}
                        initial={{
                            filter: 'blur(10px)',
                            opacity: 0,
                            y: direction === 'top' ? 25 : -25
                        }}
                        animate={runAnimation ? {
                            filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)', 'blur(10px)'],
                            opacity: [0, 1, 1, 0, 0],
                            y: [
                                direction === 'top' ? 25 : -25, // Start (Enter Pos)
                                0,                              // End Enter
                                0,                              // Start Exit
                                direction === 'top' ? -25 : 25, // End Exit
                                direction === 'top' ? 25 : -25  // Reset to Start
                            ],
                        } : {
                            filter: 'blur(10px)',
                            opacity: 0,
                            y: direction === 'top' ? 25 : -25
                        }}
                        transition={runAnimation ? {
                            duration: totalCycle,
                            times: [0, 0.15, 0.60, 0.75, 1],
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: "easeInOut",
                            delay: index * stagger // Stagger the start of the loop
                        } : {
                            duration: 0
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
