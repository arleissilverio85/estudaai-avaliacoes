import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatQuizStatus } from '@/lib/utils'
import { EditQuizDialog } from '@/components/edit-quiz-dialog'
import {
  ArrowLeft,
  School,
  FileCheck,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Calendar,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuizReviewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Buscar o quiz com dados da sala e do material
  const { data: quizData } = await (supabase.from('quizzes') as any)
    .select(`
      *,
      classrooms:classroom_id (
        id,
        name
      ),
      materials:material_id (
        id,
        title,
        file_name
      )
    `)
    .eq('id', id)
    .eq('teacher_id', user?.id || '')
    .maybeSingle()

  if (!quizData) {
    notFound()
  }

  // 2. Buscar as questões e alternativas
  const { data: questionsData } = await (supabase.from('questions') as any)
    .select(`
      id,
      question_text,
      question_type,
      order_index,
      explanation,
      question_options (
        id,
        option_text,
        is_correct,
        order_index
      )
    `)
    .eq('quiz_id', id)
    .order('order_index', { ascending: true })

  const questions = (questionsData || []).map((q: any) => ({
    ...q,
    options: (q.question_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
  }))

  const statusInfo = formatQuizStatus(quizData.status)
  const classroomList = quizData.classrooms ? [{ id: quizData.classrooms.id, name: quizData.classrooms.name }] : []

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* NAVEGAÇÃO VOLTAR */}
      <div>
        <Link
          href="/teacher/quizzes"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Avaliações
        </Link>
      </div>

      {/* CABEÇALHO DA AVALIAÇÃO */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {quizData.title}
                  </h1>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Criada em {new Date(quizData.created_at).toLocaleDateString('pt-BR')} • {questions.length} questões
                </p>
              </div>
            </div>

            {quizData.description && (
              <p className="mt-2 text-sm text-slate-300 max-w-3xl">
                {quizData.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-medium text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <School className="h-4 w-4 text-indigo-400" />
                <span>Sala: {quizData.classrooms?.name || 'Geral'}</span>
              </div>

              {quizData.materials && (
                <div className="flex items-center gap-1.5 font-medium text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  <span>Base: {quizData.materials.title}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-medium text-indigo-300 bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-500/30">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Gerada com GPT-4o-mini</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditQuizDialog quiz={quizData} classrooms={classroomList} />
          </div>
        </div>
      </div>

      {/* LISTA DAS QUESTÕES GERADAS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-400" />
            Questões da Prova ({questions.length})
          </h2>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">Nenhuma questão gerada para esta avaliação</h3>
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((q: any, qIndex: number) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-black/30 backdrop-blur-md space-y-4"
              >
                {/* ENUNCIADO */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/20 text-sm font-black text-indigo-300 border border-indigo-500/30 shrink-0">
                      {qIndex + 1}
                    </span>
                    <p className="text-base font-semibold text-white leading-relaxed">
                      {q.question_text}
                    </p>
                  </div>
                </div>

                {/* ALTERNATIVAS */}
                <div className="grid grid-cols-1 gap-2.5 pt-2 pl-11">
                  {q.options.map((opt: any, optIndex: number) => {
                    const letter = String.fromCharCode(65 + optIndex)
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center justify-between rounded-xl p-3 text-sm transition-all ${
                          opt.is_correct
                            ? 'border-2 border-emerald-500/80 bg-emerald-950/40 text-emerald-100 shadow-sm'
                            : 'border border-slate-800 bg-slate-950/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                              opt.is_correct
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="font-medium">{opt.option_text}</span>
                        </div>

                        {opt.is_correct && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Gabarito Correto
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* JUSTIFICATIVA PEDAGÓGICA */}
                {q.explanation && (
                  <div className="ml-11 mt-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 text-xs text-indigo-200">
                    <p className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      Justificativa da IA (Baseada no Material):
                    </p>
                    <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
