"use client";
import React, { useId } from "react";
import Particles from "@tsparticles/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getSparklesOptions, SparklesOptionsProps } from "./SparklesConfig";
import { useSparkles } from "./useSparkles";

type ParticlesProps = SparklesOptionsProps & {
  id?: string;
  className?: string;
};

export const SparklesCore = (props: ParticlesProps) => {
  const {
    id,
    className,
    background,
    minSize,
    maxSize,
    speed,
    particleColor,
    particleDensity,
  } = props;

  const { init, controls, particlesLoaded } = useSparkles();
  const generatedId = useId();

  // Get memoized or fresh options
  const options = getSparklesOptions({
    background,
    minSize,
    maxSize,
    speed,
    particleColor,
    particleDensity,
  });

  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      {init && (
        <Particles
          id={id || generatedId}
          className={cn("h-full w-full")}
          particlesLoaded={particlesLoaded}
          options={options}
        />
      )}
    </motion.div>
  );
};
