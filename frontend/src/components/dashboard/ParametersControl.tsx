'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

interface OptimizationParams {
    initialCapital: number
    annualReturn: number
    discountRate: number
    riskAversion: number
    lifeExpectancy: number
    currentAge: number
    inheritanceTarget: number
}

interface ParametersControlProps {
    params: OptimizationParams
    onParamsChange: (params: OptimizationParams) => void
    isLoading?: boolean
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

export function ParametersControl({
    params,
    onParamsChange,
    isLoading = false,
}: ParametersControlProps) {
    const [localParams, setLocalParams] = useState(params)
    const debouncedParams = useDebounce(localParams, 300)

    useEffect(() => {
        if (JSON.stringify(debouncedParams) !== JSON.stringify(params)) {
            onParamsChange(debouncedParams)
        }
    }, [debouncedParams, onParamsChange, params])

    const handleChange = useCallback((key: keyof OptimizationParams, value: number) => {
        setLocalParams((prev) => ({ ...prev, [key]: value }))
    }, [])

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`
        }
        return `$${value}`
    }

    const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

    return (
        <Card className={isLoading ? 'opacity-70' : ''}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Parámetros del Modelo</CardTitle>
                {isLoading && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <Slider
                    label="Capital Inicial (K₀)"
                    value={localParams.initialCapital}
                    min={100000}
                    max={10000000}
                    step={50000}
                    onChange={(value) => handleChange('initialCapital', value)}
                    formatValue={formatCurrency}
                />

                <Slider
                    label="Rendimiento Anual (r)"
                    value={localParams.annualReturn}
                    min={0.01}
                    max={0.15}
                    step={0.005}
                    onChange={(value) => handleChange('annualReturn', value)}
                    formatValue={formatPercent}
                />

                <Slider
                    label="Tasa de Descuento (ρ)"
                    value={localParams.discountRate}
                    min={0.01}
                    max={0.10}
                    step={0.005}
                    onChange={(value) => handleChange('discountRate', value)}
                    formatValue={formatPercent}
                />

                <Slider
                    label="Aversión al Riesgo (σ)"
                    value={localParams.riskAversion}
                    min={0.5}
                    max={5}
                    step={0.1}
                    onChange={(value) => handleChange('riskAversion', value)}
                    formatValue={(v) => v.toFixed(1)}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Slider
                        label="Edad Actual"
                        value={localParams.currentAge}
                        min={20}
                        max={80}
                        step={1}
                        onChange={(value) => handleChange('currentAge', value)}
                        formatValue={(v) => `${v} años`}
                    />

                    <Slider
                        label="Esperanza de Vida"
                        value={localParams.lifeExpectancy}
                        min={localParams.currentAge + 10}
                        max={100}
                        step={1}
                        onChange={(value) => handleChange('lifeExpectancy', value)}
                        formatValue={(v) => `${v} años`}
                    />
                </div>

                <Slider
                    label="Herencia Objetivo (K_T)"
                    value={localParams.inheritanceTarget}
                    min={0}
                    max={5000000}
                    step={25000}
                    onChange={(value) => handleChange('inheritanceTarget', value)}
                    formatValue={formatCurrency}
                />

                {/* Summary */}
                <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-text-muted">Horizonte:</span>
                            <span className="ml-2 text-text-primary font-medium">
                                {localParams.lifeExpectancy - localParams.currentAge} años
                            </span>
                        </div>
                        <div>
                            <span className="text-text-muted">β = 1/(1+ρ):</span>
                            <span className="ml-2 text-text-primary font-medium">
                                {(1 / (1 + localParams.discountRate)).toFixed(3)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
