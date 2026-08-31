'use client'

import { useState, useActionState, useEffect } from 'react'
import { joinClassroomByCode, JoinResponse } from '@/app/(dashboard)/student/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { KeyRound, School, X } from 'lucide-react'

export function JoinClassroomDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<JoinResponse, FormData>(
    joinClassroomByCode,
    { success: undefined, error: undefined }
  )

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
    }
  }, [state?.success])

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="md"
        className="font-semibold shadow-lg shadow-indigo-600/30"
      >
        <KeyRound className="h-4 w-4 mr-1" />
        Entrar em uma Sala
      </Button>

      <Modal isOpen={isOpen} onClose={() => !isPending && setIsOpen(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Entrar na Sala de Aula</h3>
                  <p className="text-xs text-slate-400">Digite o código fornecido pelo seu professor</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {state.error}
                </div>
              )}

              <div>
                <Input
                  label="Código da Sala *"
                  name="code"
                  required
                  placeholder="Ex: DIR4821 ou EST1234"
                  className="font-mono uppercase tracking-widest text-center text-lg font-bold text-indigo-300 border-indigo-500/40 bg-slate-950"
                  helperText="Exemplo fornecido pelo professor"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPending}
                >
                  <KeyRound className="h-4 w-4 mr-1" />
                  Entrar na Turma
                </Button>
              </div>
            </form>
      </Modal>
    </>
  )
}
