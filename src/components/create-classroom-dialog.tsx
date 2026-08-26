'use client'

import { useState, useActionState, useEffect } from 'react'
import { createClassroom, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, School, X, Sparkles } from 'lucide-react'

export function CreateClassroomDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    createClassroom,
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
        className="font-semibold shadow-md"
      >
        <Plus className="h-4 w-4" />
        Nova Sala de Aula
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Criar Nova Sala</h3>
                  <p className="text-xs text-slate-500">Gere um código de acesso para seus alunos</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              {state?.error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {state.error}
                </div>
              )}

              <div>
                <Input
                  label="Nome da Disciplina / Turma *"
                  name="name"
                  required
                  placeholder="Ex: Direito Constitucional - Turma B"
                />
              </div>

              <div>
                <Input
                  label="Descrição (Opcional)"
                  name="description"
                  placeholder="Ex: Aulas às terças-feiras, sala 204"
                />
              </div>

              <div>
                <Input
                  label="Código Personalizado (Opcional)"
                  name="join_code"
                  placeholder="Ex: DIR4821 (deixe vazio para gerar automático)"
                  helperText="Se não preencher, o sistema gerará um código único automaticamente."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  <Sparkles className="h-4 w-4" />
                  Criar Sala
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
