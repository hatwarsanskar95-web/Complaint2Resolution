'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Sparkles, Brain, Loader2, CheckCircle2 } from 'lucide-react'

// ─── Standard Transitions ──────────────────────────────────────────────
export const TRANSITIONS = {
  spring: { type: 'spring', stiffness: 280, damping: 24 },
  smooth: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  fast: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  page: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
}

// ─── 1. FadeIn Component ──────────────────────────────────────────────
interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.35,
  direction = 'up',
  distance = 14,
  className = '',
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion()

  const directionOffsets = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }

  const offset = shouldReduceMotion ? { x: 0, y: 0 } : directionOffsets[direction]

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.05 : duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── 2. Stagger Container & Items ─────────────────────────────────────
interface StaggerContainerProps {
  children: React.ReactNode
  staggerChildren?: number
  delayChildren?: number
  className?: string
}

export function StaggerContainer({
  children,
  staggerChildren = 0.06,
  delayChildren = 0,
  className = '',
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : staggerChildren,
            delayChildren: shouldReduceMotion ? 0 : delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: shouldReduceMotion ? 0.05 : 0.3, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── 3. Animated Number (Count-up) ────────────────────────────────────
interface AnimatedNumberProps {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  suffix = '',
  prefix = '',
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const started = useRef(false)

  useEffect(() => {
    if (shouldReduceMotion || value === 0) {
      setDisplayValue(value)
      return
    }

    if (started.current) {
      setDisplayValue(value)
      return
    }

    started.current = true
    let startTimestamp: number | null = null
    const startVal = 0
    const endVal = value
    const totalDurationMs = duration * 1000

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / totalDurationMs, 1)
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(startVal + (endVal - startVal) * easeProgress)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayValue(endVal)
      }
    }

    window.requestAnimationFrame(step)
  }, [value, duration, shouldReduceMotion])

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  )
}

// ─── 4. Modal Transition Wrapper ──────────────────────────────────────
interface ModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function ModalWrapper({
  isOpen,
  onClose,
  children,
}: ModalWrapperProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg glass-card p-6 shadow-2xl"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── 5. AI Processing Loading State ───────────────────────────────────
interface AiProcessingProps {
  currentStep?: string
  steps?: string[]
}

const DEFAULT_AI_STEPS = [
  'Analyzing photographic evidence with Gemini Multimodal...',
  'Extracting civic category and subcategory taxonomy...',
  'Evaluating safety severity & SLA duration...',
  'Routing to competent municipal department queue...',
]

export function AiProcessingIndicator({
  steps = DEFAULT_AI_STEPS,
}: AiProcessingProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % steps.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-5">
      {/* Orb / Pulse */}
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-indigo-600/30 to-violet-600/30 border border-blue-500/30 animate-ai-pulse flex items-center justify-center">
          <Brain className="w-10 h-10 text-blue-400 animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-w-md">
        <div className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Gemini Intelligence Engine</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={activeStepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm font-medium text-slate-200"
          >
            {steps[activeStepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-2 mt-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeStepIndex
                ? 'w-6 bg-blue-500'
                : i < activeStepIndex
                ? 'w-1.5 bg-blue-400/40'
                : 'w-1.5 bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── 6. Skeleton Loaders ──────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-5 w-full mt-1" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-2 w-full mt-2 rounded-full" />
    </div>
  )
}

export function SkeletonMetric() {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className="skeleton w-11 h-11 rounded-xl shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="skeleton h-7 w-14" />
        <div className="skeleton h-3.5 w-24" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]">
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton h-4 w-16" />
    </div>
  )
}

// ─── 7. Page Transition ────────────────────────────────────────────────
export function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
      transition={{ duration: shouldReduceMotion ? 0.05 : 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── 8. Animated Interactive Button ────────────────────────────────────
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  className?: string
  isLoading?: boolean
}

export function AnimatedButton({
  children,
  className = '',
  isLoading = false,
  disabled,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.button
      whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
      {...(props as any)}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}

// ─── 9. Animated Card ──────────────────────────────────────────────────
export function AnimatedCard({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverEffect?: boolean
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      whileHover={shouldReduceMotion || !hoverEffect ? {} : { y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`transition-shadow duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ─── 10. Scroll Reveal ─────────────────────────────────────────────────
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: shouldReduceMotion ? 0.05 : 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

