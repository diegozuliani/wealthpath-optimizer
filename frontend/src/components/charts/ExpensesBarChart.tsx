'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'

interface DataPoint {
    period: number | string
    value: number
    isProjected?: boolean
}

interface ExpensesBarChartProps {
    data: DataPoint[]
    title?: string
    color?: string
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
        const data = payload[0].payload
        return (
            <div className="bg-background-card border border-border rounded-lg p-3 shadow-lg">
                <p className="text-text-secondary text-sm mb-1">
                    {typeof label === 'number' ? `Período ${label}` : label}
                </p>
                <p className="text-primary font-semibold">
                    {formatCurrency(payload[0].value)}
                </p>
                {data.isProjected && (
                    <p className="text-xs text-text-muted mt-1">Proyectado</p>
                )}
            </div>
        )
    }
    return null
}

export function ExpensesBarChart({
    data,
    title = 'Gastos',
    color = '#8b5cf6',
}: ExpensesBarChartProps) {
    return (
        <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="period"
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 10 }}
                        tickFormatter={formatCurrency}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(39, 39, 42, 0.5)' }} />
                    <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.isProjected ? '#3f3f46' : color}
                                fillOpacity={entry.isProjected ? 0.5 : 1}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
