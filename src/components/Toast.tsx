import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  visible: boolean
}

export function Toast({ visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 14, x: '-50%', scale: 0.9 }}
          animate={{ opacity: 1, y: 0,  x: '-50%', scale: 1 }}
          exit={{ opacity: 0,   y: 8,   x: '-50%', scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            zIndex: 200,
            background: 'rgba(8, 14, 28, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 9999,
            padding: '10px 22px',
            color: 'rgba(241,245,249,0.88)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Copied to clipboard
        </motion.div>
      )}
    </AnimatePresence>
  )
}
