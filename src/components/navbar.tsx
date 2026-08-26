'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, LayoutDashboard, BookOpen, FileCheck, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { UserRole } from '@/types/database.types'

interface NavbarProps {
  user: {
    name: string
    email: string
    role: UserRole
  }
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isTeacher = user.role === 'teacher'

  const navLinks = isTeacher
    ? [
        { href: '/teacher/dashboard', label: 'Salas de Aula', icon: LayoutDashboard },
        { href: '/teacher/materials', label: 'Materiais', icon: BookOpen },
        { href: '/teacher/quizzes', label: 'Avaliações', icon: FileCheck },
      ]
    : [
        { href: '/student/dashboard', label: 'Minhas Salas', icon: LayoutDashboard },
      ]

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* LOGO & BADGE */}
          <div className="flex items-center gap-4">
            <Link
              href={isTeacher ? '/teacher/dashboard' : '/student/dashboard'}
              className="flex items-center gap-2 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-105 border border-indigo-500/40">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Estuda<span className="text-indigo-400">Aí</span>
              </span>
            </Link>

            <Badge variant={isTeacher ? 'indigo' : 'success'}>
              {isTeacher ? 'Professor' : 'Aluno'}
            </Badge>
          </div>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* USER INFO & LOGOUT */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-100 leading-tight">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>

            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50">
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Sair</span>
              </Button>
            </form>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-slate-800"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-semibold ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-4 border-t border-slate-800 pt-4">
            <div className="mb-3 px-3">
              <p className="text-sm font-bold text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm" className="w-full justify-center text-rose-400 hover:bg-rose-950/40 border-rose-900/60">
                <LogOut className="h-4 w-4 mr-2" />
                Encerrar Sessão
              </Button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
