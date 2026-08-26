'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateQuizWithAI, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, FileCheck, X, BookOpen, School, BrainCircuit, Sliders, Check, AlertCircle } from 'lucide-react'

interface GenerateQuizAiDialogProps {
  classrooms: { id: string; name: string }[]
  materials: { id: string; title: string; file_name?: string | null; classroom_id?: string | null }[]
  initialClassroomId?: string
}

export function GenerateQuizAiDialog({ classrooms, materials, initialClassroomId }: GenerateQuizAiDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    initialClassroomId || classrooms[0]?.id || ''
  )
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'mixed'>('multiple_choice')
  
  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    generateQuizWithAI,
    { success: undefined, error: undefined }
  )

  useEffect(() => {
    if (state?.success && state.data?.quizId) {
      setIsOpen(false)
      router.push(`/teacher/quizzes/${state.data.quizId}`)
    }
  }, [state?.success, state?.data?.quizId, router])

  // Filtrar materiais compatíveis com a sala selecionada (materiais da sala + materiais gerais)
  const availableMaterials = materials.filter(
    (m) => !m.classroom_id || m.classroom_id === selectedClassroomId
  )

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    availableMaterials[0]?.id || ''
  )

  // Atualizar o material selecionado ao mudar de sala
  useEffect(() => {
    if (availableMaterials.length > 0) {
      // Se o material atual não pertence à nova lista, seleciona o primeiro disponível
      if (!availableMaterials.some((m) => m.id === selectedMaterialId)) {
        setSelectedMaterialId(availableMaterials[0].id)
      }
    } else {
      setSelectedMaterialId('')
    }
  }, [selectedClassroomId, availableMaterials, selectedMaterialId])

  if (materials.length === 0) {
    return (
      <Button
        onClick={() => alert('Você precisa enviar ao menos um material didático antes de gerar avaliações por IA. Acesse a aba Materiais para fazer o upload.')}
        variant="primary"
        size="md"
        className="font-bold shadow-lg shadow-indigo-600/30"
      >
        <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
        Gerar Prova com IA
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="md"
        className="font-bold shadow-lg shadow-indigo-600/30"
      >
        <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
        Gerar Prova com IA
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 p-6 shadow-2xl border border-slate-800 sm:p-8 text-left my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/40">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Gerador de Avaliações com IA
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                      GPT-4o-mini
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Questões criadas estritamente a partir do material da turma</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              <input type="hidden" name="question_count" value={questionCount} />
              <input type="hidden" name="difficulty" value={difficulty} />
              <input type="hidden" name="question_type" value={questionType} />

              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {state.error}
                </div>
              )}

              {/* SELEÇÃO DINÂMICA DE SALA E MATERIAL */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-indigo-400" />
                    1. Selecione a Turma / Sala *
                  </label>
                  <select
                    name="classroom_id"
                    value={selectedClassroomId}
                    onChange={(e) => setSelectedClassroomId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                    2. Material da Turma *
                  </label>
                  {availableMaterials.length === 0 ? (
                    <div className="rounded-xl border border-amber-800/40 bg-amber-950/40 p-2.5 text-xs text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Nenhum material vinculado a esta turma.</span>
                    </div>
                  ) : (
                    <select
                      name="material_id"
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      {availableMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} {m.classroom_id ? '' : '(Geral)'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <Input
                  label="Título Personalizado da Prova (Opcional)"
                  name="title"
                  placeholder="Ex: Avaliação Bimestral - Direito Administrativo"
                />
              </div>

              {/* CONTROLE 1: NÚMERO DE QUESTÕES (5 A 15) */}
              <div className="space-y-2 rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                    Quantidade de Questões
                  </label>
                  <span className="rounded-lg bg-indigo-600/30 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300 border border-indigo-500/40">
                    {questionCount} Questões
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="15"
                  step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>5 (Rápida)</span>
                  <span>10 (Padrão)</span>
                  <span>15 (Completa)</span>
                </div>
              </div>

              {/* CONTROLE 2: FORMATO DAS QUESTÕES */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Tipo de Questões
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionType('multiple_choice')}
                    className={`rounded-xl p-3 text-left border transition-all text-xs font-semibold ${
                      questionType === 'multiple_choice'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-md shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">Múltipla Escolha</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">4 alternativas (A-D) sortidas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('true_false')}
                    className={`rounded-xl p-3 text-left border transition-all text-xs font-semibold ${
                      questionType === 'true_false'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-md shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">Verdadeiro ou Falso</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">2 opções (V / F)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('mixed')}
                    className={`rounded-xl p-3 text-left border transition-all text-xs font-semibold ${
                      questionType === 'mixed'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-md shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">Misto</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Mescla de formatos</div>
                  </button>
                </div>
              </div>

              {/* CONTROLE 3: NÍVEL DE DIFICULDADE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nível de Dificuldade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`rounded-xl p-2.5 text-center border transition-all text-xs font-bold ${
                      difficulty === 'easy'
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Fácil
                  </button>

                  <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className={`rounded-xl p-2.5 text-center border transition-all text-xs font-bold ${
                      difficulty === 'medium'
                        ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Médio
                  </button>

                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`rounded-xl p-2.5 text-center border transition-all text-xs font-bold ${
                      difficulty === 'hard'
                        ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Difícil
                  </button>
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
                  disabled={availableMaterials.length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {isPending ? 'Elaborando Questões...' : 'Gerar Avaliação Agora'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
