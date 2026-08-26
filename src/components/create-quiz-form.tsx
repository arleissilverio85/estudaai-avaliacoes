'use client'

import { useActionState } from 'react'
import { createQuizDraft, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileCheck, Plus } from 'lucide-react'

interface CreateQuizFormProps {
  classrooms: { id: string; name: string }[]
  initialClassroomId?: string
}

export function CreateQuizForm({ classrooms, initialClassroomId }: CreateQuizFormProps) {
  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    createQuizDraft,
    { success: undefined, error: undefined }
  )

  if (!classrooms || classrooms.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Você precisa criar ao menos uma sala de aula antes de criar avaliações.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-indigo-600" />
        Criar Nova Avaliação
      </h2>

      {state?.error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Sala de Aula *
          </label>
          <select
            name="classroom_id"
            defaultValue={initialClassroomId || classrooms[0]?.id}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Título da Avaliação *"
            name="title"
            required
            placeholder="Ex: Avaliação Bimestral 1"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Tipo de Questões
          </label>
          <select
            name="question_type"
            defaultValue="multiple_choice"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="multiple_choice">Múltipla Escolha</option>
            <option value="true_false">Verdadeiro ou Falso</option>
            <option value="mixed">Misto (Múltipla + V/F)</option>
            <option value="essay">Dissertativa</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Status Inicial
          </label>
          <select
            name="status"
            defaultValue="published"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="published">Publicado (Visível aos Alunos)</option>
            <option value="draft">Rascunho (Oculto)</option>
            <option value="finished">Encerrado</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md" isLoading={isPending}>
            <FileCheck className="h-4 w-4" />
            Salvar Avaliação
          </Button>
        </div>
      </form>
    </div>
  )
}
