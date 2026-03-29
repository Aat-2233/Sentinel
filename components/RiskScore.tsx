'use client'

import { useEffect, useState, useRef } from 'react'
import type { RiskLevel } from '@/types'

interface RiskScoreProps {
  score: number
  level: RiskLevel
}

function getScoreColor(score: number) {
  if (score < 30) return '#10B981'
  if (score < 60) return '#F59E0B'
  if (score < 80) return '#EF4444'
  return '#DC2626'
}

function getLevelBg(level: RiskLevel) {
  switch (level) {
    case 'LOW': return 'bg-success/20 text-success'
    case 'MEDIUM': return 'bg-warning/20 text-warning'
    case 'HIGH': return 'bg-danger/20 text-danger'
    case 'CRITICAL': return 'bg-critical/20 text-critical'
  }
}

export default function RiskScore({ score, level }: RiskScoreProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [dashOffset, setDashOffset] = useState(565)
  const animationRef = useRef<number | null>(null)

  const radius = 90
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  useEffect(() => {
    // Animate score count up
    const duration = 1200
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayScore(Math.round(eased * score))
      setDashOffset(circumference - eased * (score / 100) * circumference)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Small delay before animation starts
    const timeout = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate)
    }, 300)

    return () => {
      clearTimeout(timeout)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [score, circumference, targetOffset])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Ring */}
      <div className="relative w-[200px] h-[200px]">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1E2D40"
            strokeWidth="8"
          />
          {/* Score ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-none"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>

        {/* Score number overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-6xl font-bold tabular-nums"
            style={{ color }}
          >
            {displayScore}
          </span>
        </div>
      </div>

      {/* Risk level pill */}
      <div className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-widest ${getLevelBg(level)}`}>
        {level} RISK
      </div>
    </div>
  )
}
