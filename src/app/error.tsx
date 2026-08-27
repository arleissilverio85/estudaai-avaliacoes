'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-xl font-black text-white">Ops! Algo deu errado</h2>
        <p className="mt-2 text-xs text-slate-400">
          {error.message || 'Ocorreu uma instabilidade momentânea ao processar a requisição.'}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            onClick={() => reset()}
            variant="primary"
            size="md"
            className="w-full justify-center font-bold shadow-lg shadow-indigo-600/30"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>

          <Link href="/teacher/dashboard">
            <Button variant="outline" size="md" className="w-full justify-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o Painel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
