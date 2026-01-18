const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface OptimizationParams {
    initialCapital: number
    annualReturn: number
    discountRate: number
    riskAversion: number
    lifeExpectancy: number
    currentAge: number
    inheritanceTarget: number
}

export interface PeriodData {
    period: number
    age: number
    capital: number
    consumption: number
    utility: number
    savings: number
}

export interface OptimizationResult {
    initial_consumption: number
    total_utility: number
    final_capital: number
    horizon: number
    beta: number
    growth_rate: number
    series: PeriodData[]
    avg_consumption: number
    max_consumption: number
    min_consumption: number
}

export interface PreviewResult {
    initial_consumption: number
    beta: number
    growth_rate: number
    horizon: number
}

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `API error: ${response.status}`)
        }

        return response.json()
    }

    /**
     * Run full optimization and get complete time series
     */
    async optimize(params: OptimizationParams): Promise<OptimizationResult> {
        return this.request<OptimizationResult>('/api/v1/optimize', {
            method: 'POST',
            body: JSON.stringify({
                initial_capital: params.initialCapital,
                annual_return: params.annualReturn,
                discount_rate: params.discountRate,
                risk_aversion: params.riskAversion,
                life_expectancy: params.lifeExpectancy,
                current_age: params.currentAge,
                inheritance_target: params.inheritanceTarget,
            }),
        })
    }

    /**
     * Quick preview for slider adjustments
     */
    async preview(params: OptimizationParams): Promise<PreviewResult> {
        return this.request<PreviewResult>('/api/v1/optimize/preview', {
            method: 'POST',
            body: JSON.stringify({
                initial_capital: params.initialCapital,
                annual_return: params.annualReturn,
                discount_rate: params.discountRate,
                risk_aversion: params.riskAversion,
                life_expectancy: params.lifeExpectancy,
                current_age: params.currentAge,
                inheritance_target: params.inheritanceTarget,
            }),
        })
    }

    /**
     * Get default parameter values
     */
    async getDefaults(): Promise<Record<string, any>> {
        return this.request('/api/v1/parameters/defaults')
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; version: string }> {
        return this.request('/health')
    }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for custom instances
export { ApiClient }
