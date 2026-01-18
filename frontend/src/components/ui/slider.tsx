'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
    value: number
    min: number
    max: number
    step?: number
    label: string
    unit?: string
    onChange: (value: number) => void
    className?: string
    formatValue?: (value: number) => string
}

export function Slider({
    value,
    min,
    max,
    step = 1,
    label,
    unit = '',
    onChange,
    className,
    formatValue,
}: SliderProps) {
    const displayValue = formatValue ? formatValue(value) : `${value}${unit}`
    const percentage = ((value - min) / (max - min)) * 100

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-text-secondary">{label}</label>
                <span className="text-sm font-semibold text-primary">{displayValue}</span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #27272a ${percentage}%, #27272a 100%)`,
                    }}
                />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
                <span>{formatValue ? formatValue(min) : `${min}${unit}`}</span>
                <span>{formatValue ? formatValue(max) : `${max}${unit}`}</span>
            </div>
        </div>
    )
}
