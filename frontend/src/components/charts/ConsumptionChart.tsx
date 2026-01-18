'use client'

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'

interface DataPoint {
    period: number
    consumption: number
    optimalConsumption?: number
}

interface ConsumptionChartProps {
    data: DataPoint[]
    title?: string
    showOptimal?: boolean
}

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background-card border border-border rounded-lg p-3 shadow-lg">
                <p className="text-text-secondary text-sm mb-2">Período {label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export function ConsumptionChart({
    data,
    title = 'Consumo Óptimo',
    showOptimal = true
}: ConsumptionChartProps) {
    const avgConsumption = data.length > 0
        ? data.reduce((sum, d) => sum + d.consumption, 0) / data.length
        : 0

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                        dataKey="period"
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        tickFormatter={(value) => `Año ${value}`}
                    />
                    <YAxis
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                        y={avgConsumption}
                        stroke="#f97316"
                        strokeDasharray="5 5"
                        label={{
                            value: 'Promedio',
                            fill: '#f97316',
                            fontSize: 12,
                            position: 'right',
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="consumption"
                        name="Consumo"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />
                    {showOptimal && (
                        <Line
                            type="monotone"
                            dataKey="optimalConsumption"
                            name="Consumo Óptimo"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
