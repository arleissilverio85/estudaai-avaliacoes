'use client'

import { useActionState } from 'react'
import { createMaterial, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Plus } from 'lucide-react'

export function CreateMaterialForm() {
  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    createMaterial,
    { success: undefined, error: undefined }
  )

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-indigo-400" />
        Cadastrar Registro de Material
      </h2>

      {state?.error && (
        <div className="mb-4 rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="mb-4 rounded-xl border border-emerald-800/60 bg-emerald-950/60 p-3 text-xs font-semibold text-emerald-300">
          {state.message}
        </div>
      )}

      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Input
            label="Título do Material *"
            name="title"
            required
            placeholder="Ex: Apostila de Direito Administrativo"
          />
        </div>

        <div>
          <Input
            label="Nome do Arquivo Simulado"
            name="file_name"
            placeholder="Ex: aula_01_constituicao.pdf"
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" variant="primary" size="md" className="w-full font-bold" isLoading={isPending}>
            <BookOpen className="h-4 w-4 mr-1" />
            Adicionar Registro
          </Button>
        </div>
      </form>
    </div>
  )
}
