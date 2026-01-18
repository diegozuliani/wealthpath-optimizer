'use client'

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'

interface DataPoint {
    period: number
    capital: number
    consumption: number
}

interface CapitalChartProps {
    data: DataPoint[]
    title?: string
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

export function CapitalChart({ data, title = 'Evolución del Capital' }: CapitalChartProps) {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
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
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => (
                            <span className="text-text-secondary text-sm">{value}</span>
                        )}
                    />
                    <Area
                        type="monotone"
                        dataKey="capital"
                        name="Capital"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#capitalGradient)"
                    />
                    <Area
                        type="monotone"
                        dataKey="consumption"
                        name="Consumo"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#consumptionGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
