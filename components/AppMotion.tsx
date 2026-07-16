"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      transition={{ delay, duration: 0.65, ease }}
      viewport={{ amount: 0.12, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 190, damping: 24 });
  const springY = useSpring(rotateY, { stiffness: 190, damping: 24 });

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    rotateX.set(((event.clientY - rect.top) / rect.height - 0.5) * -4);
    rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * 5);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      className={className}
      onMouseLeave={reset}
      onMouseMove={handleMove}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.div>
  );
}

export function AppBackdrop() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 35, 0], y: [0, -24, 0] }}
          className="absolute -left-28 top-24 size-72 rounded-full bg-[#635bff]/10 blur-3xl"
          transition={{ duration: 13, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          animate={{ x: [0, -28, 0], y: [0, 24, 0] }}
          className="absolute -right-24 bottom-12 size-80 rounded-full bg-sky-300/15 blur-3xl"
          transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
    </>
  );
}
