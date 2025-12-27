"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useAnimation, Variant } from "framer-motion";

interface RevealProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    duration?: number;
    yOffset?: number;
    className?: string;
    overflowVisible?: boolean;
}

export const Reveal = ({
    children,
    width = "fit-content",
    delay = 0.25,
    duration = 0.5,
    yOffset = 20, // Reduced from 75 to 20 to prevent CLS
    className = "",
    overflowVisible = false,
}: RevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const mainControls = useAnimation();

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible");
        }
    }, [isInView, mainControls]);

    return (
        <div ref={ref} style={{ position: "relative", width, overflow: overflowVisible ? "visible" : "hidden" }} className={className}>
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: yOffset },
                    visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                animate={mainControls}
                transition={{ duration, delay, ease: "easeOut" }}
                style={{ willChange: "transform, opacity" }} // Optimize animations
            >
                {children}
            </motion.div>
        </div>
    );
};

export const StaggerContainer = ({
    children,
    className = "",
    staggerDelay = 0.1,
}: {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={controls}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem = ({
    children,
    className = "",
    yOffset = 20,
}: {
    children: React.ReactNode;
    className?: string;
    yOffset?: number;
}) => {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: yOffset },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
            }}
        >
            {children}
        </motion.div>
    );
};
