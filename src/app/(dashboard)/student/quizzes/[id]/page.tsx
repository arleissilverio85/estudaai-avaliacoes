import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileCheck, School } from 'lucide-react'
import { QuizTakingClient } from '@/components/quiz-taking-client'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentQuizTakingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Buscar a avaliação garantindo que está publicada e que o aluno pertence à sala
  const { data: quizData } = await (supabase.from('quizzes') as any)
    .select(`
      *,
      classrooms:classroom_id (
        id,
        name
      )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!quizData) {
    notFound()
  }

  // 2. Buscar as questões e alternativas (sem expor is_correct para o aluno durante o teste)
  const { data: questionsData } = await (supabase.from('questions') as any)
    .select(`
      id,
      question_text,
      question_type,
      order_index,
      question_options (
        id,
        option_text,
        order_index
      )
    `)
    .eq('quiz_id', id)
    .order('order_index', { ascending: true })

  const questions = (questionsData || []).map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type,
    order_index: q.order_index,
    options: (q.question_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* NAVEGAÇÃO VOLTAR */}
      <div>
        <Link
          href={`/student/classrooms/${quizData.classroom_id}`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a Sala
        </Link>
      </div>

      {/* CABEÇALHO DA PROVA */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {quizData.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mt-0.5">
                  <School className="h-3.5 w-3.5" />
                  <span>Turma: {quizData.classrooms?.name || 'Geral'}</span>
                </div>
              </div>
            </div>

            {quizData.description && (
              <p className="mt-2 text-sm text-slate-300 max-w-3xl">
                {quizData.description}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total de Questões
            </span>
            <p className="font-mono text-xl font-black text-indigo-400">
              {questions.length} Questões
            </p>
          </div>
        </div>
      </div>

      {/* CLIENT INTERATIVO DE RESPOSTAS */}
      <QuizTakingClient
        quizId={quizData.id}
        quizTitle={quizData.title}
        classroomName={quizData.classrooms?.name}
        questions={questions}
      />
    </div>
  )
}
