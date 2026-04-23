import { useState, useEffect } from "react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useAnimation } from "motion/react";
import type { Container } from "@tsparticles/engine";

export function useSparkles() {
    const [init, setInit] = useState(false);
    const controls = useAnimation();

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container) => {
        if (container) {
            controls.start({
                opacity: 1,
                transition: {
                    duration: 1,
                },
            });
        }
    };

    return { init, controls, particlesLoaded };
}
