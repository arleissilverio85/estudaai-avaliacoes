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
    <div className="flex min-h-screen flex-col justify-center bg-[#090d16] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* GLOW DECORATIONS */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />

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
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          A plataforma moderna de criação e aplicação de avaliações
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            {state?.error && (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3.5 text-sm text-rose-300">
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
                <LogIn className="h-5 w-5 mr-1" />
                Entrar no Sistema
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-6 text-center">
            <p className="text-sm text-slate-400">
              Não possui uma conta?{' '}
              <Link
                href="/register"
                className="inline-flex items-center font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-400">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
