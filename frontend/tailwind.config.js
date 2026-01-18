/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Dark theme palette based on design
                background: {
                    DEFAULT: '#0f0f14',
                    card: '#1a1a24',
                    hover: '#252532',
                },
                primary: {
                    DEFAULT: '#10b981',
                    hover: '#059669',
                    light: '#34d399',
                },
                accent: {
                    purple: '#8b5cf6',
                    blue: '#3b82f6',
                    pink: '#ec4899',
                    orange: '#f97316',
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#a1a1aa',
                    muted: '#71717a',
                },
                border: {
                    DEFAULT: '#27272a',
                    light: '#3f3f46',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '0.75rem',
                lg: '1rem',
                xl: '1.5rem',
            },
            boxShadow: {
                card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
                glow: '0 0 20px rgba(16, 185, 129, 0.15)',
            },
        },
    },
    plugins: [],
}
