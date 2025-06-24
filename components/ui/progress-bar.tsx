"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress: number
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "error"
  showPercentage?: boolean
  animated?: boolean
  label?: string
}

export function ProgressBar({
  progress,
  className,
  size = "md",
  variant = "default",
  showPercentage = false,
  animated = true,
  label
}: ProgressBarProps) {
  
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  }
  
  const variantClasses = {
    default: "bg-blue-500",
    success: "bg-green-500", 
    warning: "bg-yellow-500",
    error: "bg-red-500"
  }
  
  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {clampedProgress.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            variantClasses[variant],
            animated && "animate-pulse"
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

// 不確定進度條
export function IndeterminateProgressBar({
  className,
  size = "md"
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2", 
    lg: "h-3"
  }
  
  return (
    <div className={cn(
      "w-full bg-gray-200 rounded-full overflow-hidden",
      sizeClasses[size],
      className
    )}>
      <div 
        className="h-full bg-blue-500 rounded-full animate-pulse"
        style={{
          width: "30%",
          animation: "indeterminate 2s ease-in-out infinite"
        }}
      />
      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  )
}