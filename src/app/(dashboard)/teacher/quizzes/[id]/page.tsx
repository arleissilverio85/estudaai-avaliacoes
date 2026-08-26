import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatQuizStatus } from '@/lib/utils'
import { EditQuizDialog } from '@/components/edit-quiz-dialog'
import { QuizReviewClient } from '@/components/quiz-review-client'
import {
  ArrowLeft,
  School,
  FileCheck,
  BookOpen,
  Sparkles,
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
      <div className="print:hidden">
        <Link
          href="/teacher/quizzes"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Avaliações
        </Link>
      </div>

      {/* CABEÇALHO DA AVALIAÇÃO */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md sm:p-8 print:border-slate-300 print:bg-white print:text-black">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 print:hidden">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl print:text-black">
                    {quizData.title}
                  </h1>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border print:hidden ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-sm text-slate-400 print:text-slate-600">
                  Criada em {new Date(quizData.created_at).toLocaleDateString('pt-BR')} • {questions.length} questões
                </p>
              </div>
            </div>

            {quizData.description && (
              <p className="mt-2 text-sm text-slate-300 max-w-3xl print:text-slate-700">
                {quizData.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400 print:hidden">
              <div className="flex items-center gap-1.5 font-medium text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <School className="h-4 w-4 text-indigo-400" />
                <span>Turma: {quizData.classrooms?.name || 'Geral'}</span>
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

          <div className="flex items-center gap-2 print:hidden">
            <EditQuizDialog quiz={quizData} classrooms={classroomList} />
          </div>
        </div>
      </div>

      {/* COMPONENTE INTERATIVO DE VISUALIZAÇÃO E IMPRESSÃO */}
      <QuizReviewClient questions={questions} quizTitle={quizData.title} />
    </div>
  )
}
