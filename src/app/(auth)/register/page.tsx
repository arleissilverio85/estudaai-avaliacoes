'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { register, AuthState } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, UserCheck, School, ArrowRight } from 'lucide-react'
import { UserRole } from '@/types/database.types'

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('student')
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    register,
    { error: undefined, success: undefined }
  )

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
            <GraduationCap className="h-7 w-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Estuda<span className="text-indigo-600">Aí</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Selecione seu perfil e comece a utilizar o EstudaAí
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                <p className="font-medium">{state.error}</p>
              </div>
            )}

            {/* SELEÇÃO DO TIPO DE CONTA */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Eu sou
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all ${
                    role === 'student'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <UserCheck className={`h-6 w-6 mb-1 ${role === 'student' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold">Aluno</span>
                  <span className="text-[11px] text-slate-500">Realizar avaliações</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all ${
                    role === 'teacher'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <School className={`h-6 w-6 mb-1 ${role === 'teacher' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold">Professor</span>
                  <span className="text-[11px] text-slate-500">Criar salas e provas</span>
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

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Faça login
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
