'use client'

import { useState, useActionState, useEffect } from 'react'
import { updateClassroom, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Edit2, School, X, Check } from 'lucide-react'

interface EditClassroomDialogProps {
  classroom: {
    id: string
    name: string
    description: string | null
    is_active: boolean
    join_code: string
  }
}

export function EditClassroomDialog({ classroom }: EditClassroomDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isActive, setIsActive] = useState(classroom.is_active)
  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    updateClassroom,
    { success: undefined, error: undefined }
  )

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
    }
  }, [state?.success])

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors border border-transparent hover:border-slate-700"
        title="Editar Sala"
      >
        <Edit2 className="h-4 w-4" />
      </button>

      <Modal isOpen={isOpen} onClose={() => !isPending && setIsOpen(false)} maxWidth="max-w-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Editar Sala de Aula</h3>
                  <p className="text-xs text-slate-400 font-mono">Código: {classroom.join_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              <input type="hidden" name="id" value={classroom.id} />
              <input type="hidden" name="is_active" value={isActive ? 'true' : 'false'} />

              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {state.error}
                </div>
              )}

              <div>
                <Input
                  label="Nome da Sala *"
                  name="name"
                  defaultValue={classroom.name}
                  required
                />
              </div>

              <div>
                <Input
                  label="Descrição"
                  name="description"
                  defaultValue={classroom.description || ''}
                  placeholder="Ex: Turma de Terça-feira"
                />
              </div>

              {/* TOGGLE STATUS ATIVA/INATIVA */}
              <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3.5 border border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-white">Status da Sala</p>
                  <p className="text-xs text-slate-400">Permitir que alunos realizem avaliações</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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
                  <Check className="h-4 w-4 mr-1" />
                  Salvar Alterações
                </Button>
              </div>
            </form>
      </Modal>
    </>
  )
}
