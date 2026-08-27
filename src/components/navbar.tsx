'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, LogOut, Camera, User } from 'lucide-react'
import { UserRole } from '@/types/database.types'

interface NavbarProps {
  user: {
    name: string
    email: string
    role: UserRole
    avatarUrl?: string | null
  }
}

export function Navbar({ user }: NavbarProps) {
  const [avatar, setAvatar] = useState<string | null>(user.avatarUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isTeacher = user.role === 'teacher'

  // Carregar avatar salvo localmente para o usuário
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem(`estudaai_avatar_${user.email}`)
      if (savedAvatar) {
        setAvatar(savedAvatar)
      }
    }
  }, [user.email])

  // Tratar upload de foto pelo celular ou PC
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar se é imagem
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).')
      return
    }

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatar(result)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`estudaai_avatar_${user.email}`, result)
      }
    }
    reader.readAsDataURL(file)
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* LOGO & IDENTIFICAÇÃO DO PAPEL */}
          <div className="flex items-center gap-3">
            <Link
              href={isTeacher ? '/teacher/dashboard' : '/student/dashboard'}
              className="flex items-center gap-2.5 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-105 border border-indigo-500/40">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Estuda<span className="text-indigo-400">Aí</span>
              </span>
            </Link>

            <Badge variant={isTeacher ? 'indigo' : 'success'} className="hidden sm:inline-flex">
              {isTeacher ? 'Professor' : 'Aluno'}
            </Badge>
          </div>

          {/* ÁREA DO USUÁRIO COM AVATAR CLICÁVEL & LOGOUT */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* NOME E EMAIL DO USUÁRIO */}
            <div className="text-right">
              <p className="text-sm font-bold text-slate-100 leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {user.email}
              </p>
            </div>

            {/* AVATAR COM FOTO REDONDA CLICÁVEL */}
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                aria-label="Upload de foto de perfil"
              />

              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-2 border-indigo-500/40 bg-slate-900 shadow-md transition-all group-hover:border-indigo-400 group-hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Clique para trocar sua foto de perfil"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-indigo-900 to-indigo-700 text-xs font-black text-white">
                    {initials}
                  </div>
                )}

                {/* OVERLAY INDICANDO AÇÃO DE CÂMERA AO PASSAR O MOUSE / TOQUE */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </button>
            </div>

            {/* BOTÃO DE LOGOUT */}
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 sm:px-3 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all rounded-xl"
                title="Encerrar Sessão"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5 text-xs font-semibold">Sair</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
