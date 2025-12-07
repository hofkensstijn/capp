"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import CountUp from "react-countup";

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className={className}>
      {isInView ? (
        <CountUp
          end={value}
          duration={1.5}
          separator=","
          decimals={0}
          decimal="."
        />
      ) : (
        <span>0</span>
      )}
    </div>
  );
}
