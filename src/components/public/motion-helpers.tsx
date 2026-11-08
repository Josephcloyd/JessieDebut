"use client";

import { MotionConfig, motion } from "motion/react";
import { createContext, useContext, type ReactNode } from "react";

export const EASE_ELEGANT = [0.22, 0.61, 0.36, 1] as const;

/** Applies the visitor's reduced-motion preference to every animation inside. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const InvitationOpenedContext = createContext(true);
export const InvitationOpenedProvider = InvitationOpenedContext.Provider;

/** False while the envelope still covers the page, so entrances wait to be seen. */
export function useInvitationOpened(): boolean {
  return useContext(InvitationOpenedContext);
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** A quiet fade used everywhere, so the envelope and timeline stay the memorable moments. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: EASE_ELEGANT, delay }}
    >
      {children}
    </motion.div>
  );
}
