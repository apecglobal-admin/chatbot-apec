"use client"

import { useEffect, useState } from "react"

export function WalkingRobot() {
  const [position, setPosition] = useState(0)
  const [direction, setDirection] = useState<"left" | "right">("right")
  const [legPhase, setLegPhase] = useState(0)

  useEffect(() => {
    const walkInterval = setInterval(() => {
      setPosition((prev) => {
        const maxPosition = typeof window !== "undefined" ? window.innerWidth - 100 : 800
        if (direction === "right" && prev >= maxPosition) {
          setDirection("left")
          return prev - 3
        } else if (direction === "left" && prev <= 0) {
          setDirection("right")
          return prev + 3
        }
        return direction === "right" ? prev + 3 : prev - 3
      })
      setLegPhase((prev) => (prev + 1) % 4)
    }, 50)

    return () => clearInterval(walkInterval)
  }, [direction])

  return (
    <div
      className="absolute bottom-0 transition-transform"
      style={{
        left: `${position}px`,
        transform: `scaleX(${direction === "left" ? -1 : 1})`,
      }}
    >
      <svg
        width="80"
        height="100"
        viewBox="0 0 80 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Robot Head */}
        <rect
          x="15"
          y="5"
          width="50"
          height="35"
          rx="8"
          className="fill-primary"
        />
        {/* Antenna */}
        <line
          x1="40"
          y1="5"
          x2="40"
          y2="-5"
          className="stroke-primary"
          strokeWidth="3"
        />
        <circle cx="40" cy="-8" r="5" className="fill-accent" />
        
        {/* Eyes */}
        <circle cx="28" cy="22" r="6" className="fill-background" />
        <circle cx="52" cy="22" r="6" className="fill-background" />
        <circle
          cx={28 + (direction === "right" ? 2 : -2)}
          cy="22"
          r="3"
          className="fill-foreground"
        />
        <circle
          cx={52 + (direction === "right" ? 2 : -2)}
          cy="22"
          r="3"
          className="fill-foreground"
        />
        
        {/* Mouth */}
        <rect x="30" y="30" width="20" height="4" rx="2" className="fill-accent" />
        
        {/* Neck */}
        <rect x="35" y="40" width="10" height="8" className="fill-muted-foreground" />
        
        {/* Body */}
        <rect
          x="18"
          y="48"
          width="44"
          height="30"
          rx="6"
          className="fill-primary"
        />
        {/* Body Panel */}
        <rect
          x="28"
          y="55"
          width="24"
          height="16"
          rx="3"
          className="fill-secondary"
        />
        {/* Buttons */}
        <circle cx="35" cy="62" r="3" className="fill-accent animate-pulse" />
        <circle cx="45" cy="62" r="3" className="fill-ring" />
        
        {/* Arms */}
        <rect
          x="5"
          y="50"
          width="13"
          height="6"
          rx="3"
          className="fill-muted-foreground"
          style={{
            transformOrigin: "18px 53px",
            transform: `rotate(${legPhase % 2 === 0 ? -15 : 15}deg)`,
          }}
        />
        <rect
          x="62"
          y="50"
          width="13"
          height="6"
          rx="3"
          className="fill-muted-foreground"
          style={{
            transformOrigin: "62px 53px",
            transform: `rotate(${legPhase % 2 === 0 ? 15 : -15}deg)`,
          }}
        />
        
        {/* Legs */}
        <rect
          x="25"
          y="78"
          width="10"
          height="22"
          rx="3"
          className="fill-muted-foreground"
          style={{
            transformOrigin: "30px 78px",
            transform: `rotate(${
              legPhase === 0 ? -20 : legPhase === 1 ? 0 : legPhase === 2 ? 20 : 0
            }deg)`,
          }}
        />
        <rect
          x="45"
          y="78"
          width="10"
          height="22"
          rx="3"
          className="fill-muted-foreground"
          style={{
            transformOrigin: "50px 78px",
            transform: `rotate(${
              legPhase === 0 ? 20 : legPhase === 1 ? 0 : legPhase === 2 ? -20 : 0
            }deg)`,
          }}
        />
        
        {/* Feet */}
        <ellipse
          cx="30"
          cy="100"
          rx="8"
          ry="4"
          className="fill-primary"
          style={{
            transformOrigin: "30px 78px",
            transform: `rotate(${
              legPhase === 0 ? -20 : legPhase === 1 ? 0 : legPhase === 2 ? 20 : 0
            }deg)`,
          }}
        />
        <ellipse
          cx="50"
          cy="100"
          rx="8"
          ry="4"
          className="fill-primary"
          style={{
            transformOrigin: "50px 78px",
            transform: `rotate(${
              legPhase === 0 ? 20 : legPhase === 1 ? 0 : legPhase === 2 ? -20 : 0
            }deg)`,
          }}
        />
      </svg>
    </div>
  )
}
