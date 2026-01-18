import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
    value: number
    max?: number
    className?: string
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function Progress({
    value,
    max = 100,
    className,
    showLabel = false,
    size = 'md',
}: ProgressProps) {
    const percentage = Math.min((value / max) * 100, 100)

    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    }

    return (
        <div className={cn('relative w-full', className)}>
            <div className={cn('w-full bg-border rounded-full overflow-hidden', sizeClasses[size])}>
                <div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out animate-progress"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div
                    className="absolute -top-1 transform -translate-x-1/2"
                    style={{ left: `${percentage}%` }}
                >
                    <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-glow" />
                </div>
            )}
        </div>
    )
}
