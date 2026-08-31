'use client'

import { useState, useActionState, useEffect } from 'react'
import { updateQuiz, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Edit2, FileCheck, X, Check } from 'lucide-react'
import { QuizQuestionType, QuizStatus } from '@/types/database.types'

interface EditQuizDialogProps {
  quiz: {
    id: string
    title: string
    description: string | null
    classroom_id: string
    question_type: QuizQuestionType
    status: QuizStatus
  }
  classrooms: { id: string; name: string }[]
}

export function EditQuizDialog({ quiz, classrooms }: EditQuizDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [classroomId, setClassroomId] = useState(quiz.classroom_id)
  const [questionType, setQuestionType] = useState<QuizQuestionType>(quiz.question_type)
  const [status, setStatus] = useState<QuizStatus>(quiz.status)

  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    updateQuiz,
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
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors border border-transparent hover:border-slate-700"
        title="Editar Avaliação"
      >
        <Edit2 className="h-4 w-4" />
      </button>

      <Modal isOpen={isOpen} onClose={() => !isPending && setIsOpen(false)} maxWidth="max-w-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Editar Avaliação</h3>
                  <p className="text-xs text-slate-400">Atualize informações e status de publicação</p>
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
              <input type="hidden" name="id" value={quiz.id} />
              <input type="hidden" name="classroom_id" value={classroomId} />
              <input type="hidden" name="question_type" value={questionType} />
              <input type="hidden" name="status" value={status} />

              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {state.error}
                </div>
              )}

              <div>
                <Input
                  label="Título da Avaliação *"
                  name="title"
                  defaultValue={quiz.title}
                  required
                />
              </div>

              <div>
                <Input
                  label="Descrição"
                  name="description"
                  defaultValue={quiz.description || ''}
                  placeholder="Instruções para a turma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Sala de Aula *
                </label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tipo de Questões
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as QuizQuestionType)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="multiple_choice">Múltipla Escolha</option>
                    <option value="true_false">Verdadeiro ou Falso</option>
                    <option value="mixed">Misto (Múltipla + V/F)</option>
                    <option value="essay">Dissertativa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuizStatus)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                    <option value="finished">Encerrado</option>
                  </select>
                </div>
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
