import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Transaction {
    id: string
    description: string
    date: string
    type: 'income' | 'expense'
    amount: number
    category?: string
}

interface TransactionsTableProps {
    transactions: Transaction[]
    title?: string
    dateRange?: string
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value)
}

const getCategoryColor = (type: 'income' | 'expense', category?: string) => {
    if (type === 'income') return 'bg-primary'

    const colors: Record<string, string> = {
        food: 'bg-accent-orange',
        grocery: 'bg-primary',
        shopping: 'bg-accent-pink',
        transport: 'bg-accent-blue',
        default: 'bg-accent-purple',
    }

    return colors[category?.toLowerCase() || 'default'] || colors.default
}

const getCategoryInitial = (description: string) => {
    return description.charAt(0).toUpperCase()
}

export function TransactionsTable({
    transactions,
    title = 'Transacciones Diarias',
    dateRange = 'Datos del 1-12 Abr, 2024',
}: TransactionsTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <p className="text-sm text-text-secondary mt-1">{dateRange}</p>
                </div>
                <Button variant="outline" size="sm">
                    Ver Reporte
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-xs font-medium text-text-muted pb-3 pr-4">
                                    Descripción
                                </th>
                                <th className="text-left text-xs font-medium text-text-muted pb-3 pr-4">
                                    Fecha
                                </th>
                                <th className="text-left text-xs font-medium text-text-muted pb-3 pr-4">
                                    Tipo
                                </th>
                                <th className="text-right text-xs font-medium text-text-muted pb-3">
                                    Monto
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="border-b border-border/50 hover:bg-background-hover transition-smooth"
                                >
                                    <td className="py-4 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-full ${getCategoryColor(tx.type, tx.category)} flex items-center justify-center`}
                                            >
                                                <span className="text-white text-sm font-medium">
                                                    {getCategoryInitial(tx.description)}
                                                </span>
                                            </div>
                                            <span className="text-sm text-text-primary">
                                                {tx.description}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <span className="text-sm text-text-secondary">{tx.date}</span>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <span
                                            className={`text-sm ${tx.type === 'income' ? 'text-primary' : 'text-text-secondary'
                                                }`}
                                        >
                                            {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <span
                                            className={`text-sm font-medium ${tx.type === 'income' ? 'text-primary' : 'text-text-primary'
                                                }`}
                                        >
                                            {tx.type === 'income' ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
