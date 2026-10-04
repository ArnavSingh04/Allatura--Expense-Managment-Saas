'use client';

import { Box } from '@mui/material';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type MotionSectionProps = {
  id?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
  sx?: object;
};

export default function MotionSection({ id, 'aria-labelledby': labelledBy, children, sx }: MotionSectionProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      {...(reduced
        ? {}
        : {
            initial: { opacity: 0, y: 22 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.12 },
            transition: { duration: 0.42, ease: [0.22, 0.1, 0.22, 1] },
          })}
      style={{ width: '100%' }}
    >
      <Box component="section" id={id} aria-labelledby={labelledBy} sx={{ width: 1, ...sx }}>
        {children}
      </Box>
    </motion.div>
  );
}
