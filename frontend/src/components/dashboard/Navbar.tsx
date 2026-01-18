'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    Settings,
    User,
    TrendingUp,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/optimization', label: 'Optimización', icon: TrendingUp },
    { href: '/dashboard/savings', label: 'Ahorros', icon: Wallet },
    { href: '/dashboard/cards', label: 'Tarjetas', icon: CreditCard },
    { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
    { href: '/dashboard/account', label: 'Cuenta', icon: User },
]

interface NavbarProps {
    userName?: string
    userAvatar?: string
}

export function Navbar({ userName = 'Usuario', userAvatar }: NavbarProps) {
    const pathname = usePathname()

    return (
        <nav className="sticky top-0 z-50 glass border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">W</span>
                            </div>
                            <span className="text-text-primary font-semibold hidden sm:block">
                                WealthPath
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.slice(0, 5).map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-smooth',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-medium text-text-primary">
                                {userName}
                            </span>
                            <span className="text-xs text-text-secondary">Premium</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-semibold">
                                    {userName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
