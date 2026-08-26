'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { register, AuthState } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, UserCheck, School, ArrowRight, CheckCircle2 } from 'lucide-react'
import { UserRole } from '@/types/database.types'

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('student')
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    register,
    { error: undefined, success: undefined }
  )

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#090d16] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* GLOW DECORATIONS */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-emerald-600/10 blur-[100px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2.5 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/40 transition-transform group-hover:scale-105">
            <GraduationCap className="h-7 w-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Estuda<span className="text-indigo-400">Aí</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Selecione seu perfil e comece a utilizar o EstudaAí
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8">
          {state?.success && state.message ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-lg">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Cadastro Concluído!</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {state.message}
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button variant="primary" size="lg" className="w-full font-bold">
                    Ir para a Página de Login
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3.5 text-sm text-rose-300">
                  <p className="font-medium">{state.error}</p>
                </div>
              )}

              {/* SELEÇÃO DO TIPO DE CONTA */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Eu sou
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all ${
                      role === 'student'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-md shadow-indigo-600/20'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className={`h-6 w-6 mb-1 ${role === 'student' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-sm font-bold">Aluno</span>
                    <span className="text-[11px] text-slate-400">Realizar avaliações</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all ${
                      role === 'teacher'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-md shadow-indigo-600/20'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <School className={`h-6 w-6 mb-1 ${role === 'teacher' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-sm font-bold">Professor</span>
                    <span className="text-[11px] text-slate-400">Criar salas e provas</span>
                  </button>
                </div>
                <input type="hidden" name="role" value={role} />
              </div>

              <div>
                <Input
                  label="Nome Completo"
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Maria Silva ou Prof. Carlos"
                  autoComplete="name"
                />
              </div>

              <div>
                <Input
                  label="E-mail"
                  type="email"
                  name="email"
                  required
                  placeholder="exemplo@dominio.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <Input
                  label="Senha"
                  type="password"
                  name="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  helperText="Use letras, números ou símbolos para maior segurança"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-base font-semibold"
                  isLoading={isPending}
                >
                  Criar Conta como {role === 'teacher' ? 'Professor' : 'Aluno'}
                </Button>
              </div>
            </form>
          )}

          {!state?.success && (
            <div className="mt-6 border-t border-slate-800 pt-6 text-center">
              <p className="text-sm text-slate-400">
                Já tem uma conta?{' '}
                <Link
                  href="/login"
                  className="inline-flex items-center font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Faça login
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
