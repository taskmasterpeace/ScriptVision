"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface AnimatedTabIndicatorProps {
  activeTab: string
}

export function AnimatedTabIndicator({ activeTab }: AnimatedTabIndicatorProps) {
  const [position, setPosition] = useState({ left: 0, width: 0 })
  const [phase, setPhase] = useState<"creation" | "production" | "utility">("creation")

  useEffect(() => {
    // Find the active tab element
    const tabElement = document.getElementById(`${activeTab}-tab-trigger`)
    if (tabElement) {
      const rect = tabElement.getBoundingClientRect()
      const parentRect = tabElement.parentElement?.getBoundingClientRect() || { left: 0 }

      setPosition({
        left: rect.left - parentRect.left,
        width: rect.width,
      })
    }

    // Determine the phase
    const creationTabs = ["story-theme", "research", "outline", "write", "enhance"]
    const productionTabs = ["script", "shotlist", "subjects", "styles", "prompts", "musiclab"]

    if (creationTabs.includes(activeTab)) {
      setPhase("creation")
    } else if (productionTabs.includes(activeTab)) {
      setPhase("production")
    } else {
      setPhase("utility")
    }
  }, [activeTab])

  const phaseColors = {
    creation: "bg-purple-500",
    production: "bg-amber-500",
    utility: "bg-gray-500",
  }

  return (
    <motion.div
      className={`absolute bottom-0 h-1 ${phaseColors[phase]} rounded-full`}
      initial={false}
      animate={{
        left: position.left,
        width: position.width,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
    />
  )
}
