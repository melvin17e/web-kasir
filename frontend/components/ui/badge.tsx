"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
            success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
            danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        }

        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge }
