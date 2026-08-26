import { createClient } from '@/lib/supabase/server'
import { FileCheck } from 'lucide-react'
import { CreateQuizForm } from '@/components/create-quiz-form'
import { QuizCard } from '@/components/quiz-card'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ classroom_id?: string }>
}

export default async function TeacherQuizzesPage({ searchParams }: Props) {
  const { classroom_id } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Buscar todas as salas do professor para o dropdown
  const { data: classroomsData } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('teacher_id', user?.id || '')
    .order('name', { ascending: true })

  const classrooms = (classroomsData || []).map((c: any) => ({
    id: c.id as string,
    name: c.name as string,
  }))

  // Buscar avaliações com histórico de tentativas vinculadas
  const { data: quizzesData } = await supabase
    .from('quizzes')
    .select(`
      *,
      classrooms:classroom_id (
        name
      ),
      attempts (count)
    `)
    .eq('teacher_id', user?.id || '')
    .order('created_at', { ascending: false })

  const quizzes = (quizzesData || []) as any[]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Avaliações e Provas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Crie, publique, edite, exclua e visualize o histórico de avaliações geradas.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DE CRIAÇÃO DE QUIZ */}
      <CreateQuizForm classrooms={classrooms} initialClassroomId={classroom_id} />

      {/* LISTA DE AVALIAÇÕES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Histórico de Avaliações</h2>
          <span className="text-xs font-semibold text-slate-400">
            {quizzes.length} {quizzes.length === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">Nenhuma avaliação cadastrada</h3>
            <p className="mt-1 text-xs text-slate-400">
              Crie uma avaliação acima para testar a associação com salas de aula e status RLS.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} classrooms={classrooms} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
