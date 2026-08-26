'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateQuizWithAI, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, FileCheck, X, BookOpen, School, BrainCircuit, Sliders, Check } from 'lucide-react'

interface GenerateQuizAiDialogProps {
  classrooms: { id: string; name: string }[]
  materials: { id: string; title: string; file_name?: string | null }[]
  initialClassroomId?: string
}

export function GenerateQuizAiDialog({ classrooms, materials, initialClassroomId }: GenerateQuizAiDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
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
                  <p className="text-xs text-slate-400">Questões criadas estritamente a partir do seu material</p>
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

              {/* SELEÇÃO DE SALA E MATERIAL */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-indigo-400" />
                    Turma / Sala de Aula *
                  </label>
                  <select
                    name="classroom_id"
                    defaultValue={initialClassroomId || classrooms[0]?.id}
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
                    Material Didático Base *
                  </label>
                  <select
                    name="material_id"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Input
                  label="Título da Avaliação (Opcional)"
                  name="title"
                  placeholder="Ex: Prova 1 - Direito Constitucional (ou deixe vazio para gerar automático)"
                />
              </div>

              {/* TIPO DE QUESTÃO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Tipo de Questões
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'multiple_choice', label: 'Múltipla Escolha', desc: '4 alternativas' },
                    { id: 'true_false', label: 'Verdadeiro / Falso', desc: 'Assertivas' },
                    { id: 'mixed', label: 'Misto', desc: 'Mescla ambos' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQuestionType(t.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        questionType === t.id
                          ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-md shadow-indigo-600/20'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-slate-400">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* QUANTIDADE DE QUESTÕES (5 a 15) */}
              <div className="space-y-2 rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                    Quantidade de Questões
                  </label>
                  <span className="font-mono text-base font-black text-indigo-400">
                    {questionCount} questões
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="15"
                  step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>5 questões</span>
                  <span>10 questões</span>
                  <span>15 questões</span>
                </div>
              </div>

              {/* NÍVEL DE DIFICULDADE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nível de Dificuldade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'easy', label: 'Fácil', desc: 'Conceitos diretos', color: 'border-emerald-500/60 text-emerald-300' },
                    { id: 'medium', label: 'Médio', desc: 'Interpretação e prática', color: 'border-indigo-500/60 text-indigo-300' },
                    { id: 'hard', label: 'Difícil', desc: 'Análise e cenários', color: 'border-amber-500/60 text-amber-300' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        difficulty === d.id
                          ? `border-2 bg-slate-800/80 shadow-md ${d.color}`
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <p className="text-xs font-bold">{d.label}</p>
                      <p className="text-[10px] text-slate-400">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Status Inicial da Avaliação
                </label>
                <select
                  name="status"
                  defaultValue="draft"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="draft">Rascunho (Permite revisar as questões antes dos alunos acessarem)</option>
                  <option value="published">Publicado Imediatamente (Visível para os alunos da turma)</option>
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
                  className="font-bold px-6 shadow-lg shadow-indigo-600/30"
                >
                  <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
                  {isPending ? 'IA Consultando Material...' : 'Gerar Prova com GPT-4o-mini'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
