import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'WealthPath Optimizer',
    description: 'Optimización de consumo financiero basado en el Modelo de Bellman',
    keywords: ['finanzas', 'optimización', 'consumo', 'bellman', 'euler'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es" className="dark">
            <body className="bg-background min-h-screen antialiased">
                {children}
            </body>
        </html>
    )
}
