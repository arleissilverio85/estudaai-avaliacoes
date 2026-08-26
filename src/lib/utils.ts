import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera um código de sala amigável no formato 3 ou 4 letras maiúsculas + 4 números (ex: MAT4821, DIR3029, SALA5912)
 */
export function generateJoinCode(prefix: string = "EST"): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || "EST"
  const numbers = Math.floor(1000 + Math.random() * 9000).toString()
  return `${cleanPrefix}${numbers}`.slice(0, 10)
}

export function formatRole(role: string): string {
  switch (role) {
    case 'teacher':
      return 'Professor'
    case 'student':
      return 'Aluno'
    default:
      return role
  }
}

export function formatQuizStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'draft':
      return { label: 'Rascunho', color: 'bg-amber-100 text-amber-800 border-amber-300' }
    case 'published':
      return { label: 'Publicado', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    case 'finished':
      return { label: 'Encerrado', color: 'bg-slate-100 text-slate-800 border-slate-300' }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' }
  }
}

export function formatMaterialStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', color: 'bg-slate-100 text-slate-700 border-slate-300' }
    case 'processing':
      return { label: 'Processando', color: 'bg-blue-100 text-blue-700 border-blue-300' }
    case 'ready':
      return { label: 'Pronto', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' }
    case 'error':
      return { label: 'Erro', color: 'bg-rose-100 text-rose-700 border-rose-300' }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' }
  }
}
