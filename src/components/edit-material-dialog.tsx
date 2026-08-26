'use client'

import { useState, useActionState, useEffect } from 'react'
import { updateMaterial, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, BookOpen, X, Check, School, AlertCircle } from 'lucide-react'
import { MaterialProcessingStatus } from '@/types/database.types'

interface EditMaterialDialogProps {
  material: {
    id: string
    title: string
    description: string | null
    file_name: string | null
    classroom_id?: string | null
    processing_status: MaterialProcessingStatus
  }
  classrooms?: { id: string; name: string }[]
}

export function EditMaterialDialog({ material, classrooms = [] }: EditMaterialDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [classList, setClassList] = useState<{ id: string; name: string }[]>(classrooms)
  const [classroomId, setClassroomId] = useState(material.classroom_id || '')
  const [status, setStatus] = useState<MaterialProcessingStatus>(material.processing_status)
  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    updateMaterial,
    { success: undefined, error: undefined }
  )

  // Carregar salas dinamicamente do Supabase para garantir que sempre esteja atualizado
  useEffect(() => {
    if (isOpen) {
      const supabase = createClient()
      supabase
        .from('classrooms')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setClassList(data)
          }
        })
    }
  }, [isOpen])

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
    }
  }, [state?.success])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors border border-transparent hover:border-slate-700"
        title="Editar Material"
      >
        <Edit2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 shadow-2xl border border-slate-800 sm:p-8 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Editar Material</h3>
                  <p className="text-xs text-slate-400">Atualize as informações e a turma vinculada</p>
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
              <input type="hidden" name="id" value={material.id} />
              <input type="hidden" name="classroom_id" value={classroomId} />
              <input type="hidden" name="processing_status" value={status} />

              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {state.error}
                </div>
              )}

              {/* SELEÇÃO DINÂMICA DA SALA DE AULA */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-indigo-400" />
                  Turma / Sala de Aula
                </label>
                {classList.length === 0 ? (
                  <div className="rounded-xl border border-amber-800/50 bg-amber-950/40 p-2.5 text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Nenhuma sala encontrada. Crie uma sala na aba &quot;Salas de Aula&quot;.</span>
                  </div>
                ) : (
                  <select
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Material Geral (Todas as Turmas) --</option>
                    {classList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Input
                  label="Título do Material *"
                  name="title"
                  defaultValue={material.title}
                  required
                />
              </div>

              <div>
                <Input
                  label="Descrição"
                  name="description"
                  defaultValue={material.description || ''}
                  placeholder="Ex: Resumo para a prova bimestral"
                />
              </div>

              <div>
                <Input
                  label="Nome do Arquivo"
                  name="file_name"
                  defaultValue={material.file_name || 'documento.pdf'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Status de Processamento
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MaterialProcessingStatus)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ready">Pronto (ready)</option>
                  <option value="pending">Pendente (pending)</option>
                  <option value="processing">Processando (processing)</option>
                  <option value="error">Erro (error)</option>
                </select>
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
          </div>
        </div>
      )}
    </>
  )
}
