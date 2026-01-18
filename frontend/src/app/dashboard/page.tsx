'use client'

import { useState, useCallback } from 'react'
import { Navbar } from '@/components/dashboard/Navbar'
import { ParametersControl } from '@/components/dashboard/ParametersControl'
import { SavingGoal } from '@/components/dashboard/SavingGoal'
import { TransactionsTable } from '@/components/dashboard/TransactionsTable'
import {
    CapitalChart,
    ConsumptionChart,
    SummaryDonut,
    DonutLegend,
    ExpensesBarChart,
} from '@/components/charts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Default parameters for the optimization model
const defaultParams = {
    initialCapital: 1000000,
    annualReturn: 0.05,
    discountRate: 0.03,
    riskAversion: 2.0,
    lifeExpectancy: 85,
    currentAge: 35,
    inheritanceTarget: 200000,
}

// Generate mock optimization data based on parameters
function generateOptimizationData(params: typeof defaultParams) {
    const T = params.lifeExpectancy - params.currentAge
    const r = params.annualReturn
    const rho = params.discountRate
    const sigma = params.riskAversion

    // Calculate beta and growth rate
    const beta = 1 / (1 + rho)
    const growthRate = Math.pow(beta * (1 + r), 1 / sigma)

    // Simple solver for C1 (initial consumption)
    // This is a simplified version - backend will have the accurate solver
    let K = params.initialCapital
    let C1 = K * 0.04 // Start with 4% rule as approximation

    // Binary search for correct C1
    let low = K * 0.01
    let high = K * 0.15

    for (let i = 0; i < 50; i++) {
        C1 = (low + high) / 2
        K = params.initialCapital

        for (let t = 0; t < T; t++) {
            const C = C1 * Math.pow(growthRate, t)
            K = (K - C) * (1 + r)
        }

        if (K > params.inheritanceTarget) {
            low = C1
        } else {
            high = C1
        }
    }

    // Generate series
    const data = []
    K = params.initialCapital

    for (let t = 0; t <= T; t++) {
        const consumption = C1 * Math.pow(growthRate, t)
        data.push({
            period: t,
            capital: Math.max(0, K),
            consumption: consumption,
        })
        K = (K - consumption) * (1 + r)
    }

    return data
}

// Mock transactions data
const mockTransactions = [
    { id: '1', description: 'Samantha Wilson', date: 'Abr 11', type: 'income' as const, amount: 1640.26, category: 'income' },
    { id: '2', description: 'Grocery en Shop', date: 'Abr 10', type: 'expense' as const, amount: 72.64, category: 'grocery' },
    { id: '3', description: 'Coffee', date: 'Abr 09', type: 'expense' as const, amount: 8.65, category: 'food' },
    { id: '4', description: 'Karen Smith', date: 'Abr 09', type: 'income' as const, amount: 842.50, category: 'income' },
    { id: '5', description: 'Transportation', date: 'Abr 07', type: 'expense' as const, amount: 18.52, category: 'transport' },
]

// Summary donut data
const summaryData = [
    { name: 'Comida y Bebidas', value: 48, color: '#10b981' },
    { name: 'Supermercado', value: 32, color: '#3b82f6' },
    { name: 'Compras', value: 13, color: '#8b5cf6' },
    { name: 'Transporte', value: 7, color: '#f97316' },
]

// Expenses bar data
const expensesBarData = Array.from({ length: 12 }, (_, i) => ({
    period: i + 1,
    value: Math.floor(Math.random() * 800 + 200),
    isProjected: i >= 10,
}))

export default function DashboardPage() {
    const [params, setParams] = useState(defaultParams)
    const [isLoading, setIsLoading] = useState(false)
    const [optimizationData, setOptimizationData] = useState(() =>
        generateOptimizationData(defaultParams)
    )

    const handleParamsChange = useCallback((newParams: typeof defaultParams) => {
        setIsLoading(true)
        setParams(newParams)

        // Simulate API call delay
        setTimeout(() => {
            setOptimizationData(generateOptimizationData(newParams))
            setIsLoading(false)
        }, 100)
    }, [])

    const totalCapital = params.initialCapital
    const totalConsumption = optimizationData.reduce((sum, d) => sum + d.consumption, 0)

    return (
        <div className="min-h-screen bg-background">
            <Navbar userName="Jonathan Hope" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
                        <p className="text-text-secondary mt-1">
                            Hola Jonathan, aquí están tus estadísticas financieras
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        <span className="text-sm text-text-secondary">Mostrando datos</span>
                        <div className="flex items-center gap-2 bg-background-card border border-border rounded-lg px-3 py-1.5">
                            <span className="text-sm text-text-primary">01 Abr, 2024 - 12 Abr, 2024</span>
                            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Charts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Revenue/Capital Chart */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Evolución del Capital</CardTitle>
                                    <CardDescription>Capital y consumo proyectado</CardDescription>
                                </div>
                                <Button variant="outline" size="sm">Ver Reporte</Button>
                            </CardHeader>
                            <CardContent>
                                <CapitalChart data={optimizationData} />
                                <div className="flex items-center justify-center gap-8 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-primary" />
                                        <span className="text-sm text-text-secondary">Capital</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-accent-purple" />
                                        <span className="text-sm text-text-secondary">Consumo</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Expenses Bar Chart */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Consumo por Período</CardTitle>
                                    <CardDescription>Datos del 1-12 Abr, 2024</CardDescription>
                                </div>
                                <Button variant="outline" size="sm">Ver Reporte</Button>
                            </CardHeader>
                            <CardContent>
                                <ExpensesBarChart data={expensesBarData} />
                                <div className="flex items-center justify-center gap-8 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-accent-purple" />
                                        <span className="text-sm text-text-secondary">Consumo</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-border" />
                                        <span className="text-sm text-text-secondary">Comparar con mes anterior</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transactions Table */}
                        <TransactionsTable transactions={mockTransactions} />
                    </div>

                    {/* Right Column - Summary & Controls */}
                    <div className="space-y-6">
                        {/* Summary Donut */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Resumen</CardTitle>
                                    <CardDescription>Datos del 1-12 Abr, 2024</CardDescription>
                                </div>
                                <Button variant="outline" size="sm">Ver Reporte</Button>
                            </CardHeader>
                            <CardContent>
                                <SummaryDonut
                                    data={summaryData}
                                    centerValue="$8,295"
                                    percentageChange={-2.1}
                                />
                                <div className="mt-4">
                                    <DonutLegend data={summaryData} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Saving Goal */}
                        <SavingGoal
                            currentAmount={1052.98}
                            targetAmount={1200}
                            title="Meta de Ahorro"
                        />

                        {/* Parameters Control */}
                        <ParametersControl
                            params={params}
                            onParamsChange={handleParamsChange}
                            isLoading={isLoading}
                        />

                        {/* Blog CTA */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-text-primary">
                                            Visita nuestro blog financiero
                                        </h3>
                                        <p className="text-sm text-text-secondary mt-2">
                                            Tenemos muchos artículos relacionados con finanzas que te
                                            ayudarán a administrar tu dinero.
                                        </p>
                                        <Button variant="secondary" size="sm" className="mt-4">
                                            Visitar Blog
                                        </Button>
                                    </div>
                                    <div className="w-20 h-20 bg-gradient-to-br from-accent-purple to-accent-blue rounded-xl flex items-center justify-center">
                                        <span className="text-3xl">📊</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
