import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface SavingGoalProps {
    currentAmount: number
    targetAmount: number
    title?: string
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

export function SavingGoal({
    currentAmount,
    targetAmount,
    title = 'Meta de Ahorro',
}: SavingGoalProps) {
    const progress = (currentAmount / targetAmount) * 100

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <p className="text-sm text-text-secondary mt-1">
                        {progress.toFixed(0)}% Progreso
                    </p>
                </div>
                <button className="text-xs text-text-secondary border border-border px-3 py-1.5 rounded-lg hover:bg-background-hover transition-smooth">
                    Ver Reporte
                </button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">
                            {formatCurrency(currentAmount)}
                        </span>
                        <span className="text-text-secondary text-sm">
                            de {formatCurrency(targetAmount)}
                        </span>
                    </div>
                    <Progress value={currentAmount} max={targetAmount} size="lg" showLabel />
                </div>
            </CardContent>
        </Card>
    )
}
