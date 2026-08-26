'use client'

import { useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login, AuthState } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, LogIn, ArrowRight } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    login,
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
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          A plataforma moderna de criação e aplicação de avaliações
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            {state?.error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                <p className="font-medium">{state.error}</p>
              </div>
            )}

            <div>
              <Input
                label="E-mail"
                type="email"
                name="email"
                required
                placeholder="exemplo@escola.com"
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                label="Senha"
                type="password"
                name="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
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
                <LogIn className="h-5 w-5" />
                Entrar no Sistema
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Não possui uma conta?{' '}
              <Link
                href="/register"
                className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Cadastre-se agora
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
