'use client'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'

interface SummaryData {
    name: string
    value: number
    color: string
}

interface SummaryDonutProps {
    data: SummaryData[]
    centerValue: string
    centerLabel?: string
    percentageChange?: number
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-background-card border border-border rounded-lg p-3 shadow-lg">
                <p className="text-text-primary font-medium">{data.name}</p>
                <p className="text-text-secondary text-sm">{data.value.toFixed(1)}%</p>
            </div>
        )
    }
    return null
}

export function SummaryDonut({
    data,
    centerValue,
    centerLabel = '',
    percentageChange,
}: SummaryDonutProps) {
    return (
        <div className="w-full h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-text-primary">{centerValue}</span>
                {centerLabel && (
                    <span className="text-xs text-text-secondary">{centerLabel}</span>
                )}
                {percentageChange !== undefined && (
                    <span className={`text-xs font-medium ${percentageChange >= 0 ? 'text-primary' : 'text-accent-pink'}`}>
                        {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    )
}

// Legend component for the donut chart
export function DonutLegend({ data }: { data: SummaryData[] }) {
    return (
        <div className="space-y-2">
            {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-text-secondary">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                        {item.value.toFixed(0)}%
                    </span>
                </div>
            ))}
        </div>
    )
}
