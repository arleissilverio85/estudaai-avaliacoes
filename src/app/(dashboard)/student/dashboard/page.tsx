import { createClient } from '@/lib/supabase/server'
import { ClassroomCard } from '@/components/classroom-card'
import { JoinClassroomDialog } from '@/components/join-classroom-dialog'
import { StudentHistoryTable, StudentHistoryItem } from '@/components/student-history-table'
import { KeyRound, History, School } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let classrooms: any[] = []
  let historyItems: StudentHistoryItem[] = []

  if (user) {
    // 1. Buscar salas onde o aluno está matriculado
    const { data: enrollments } = await supabase
      .from('classroom_students')
      .select(`
        id,
        joined_at,
        classrooms:classroom_id (
          id,
          name,
          description,
          join_code,
          is_active,
          created_at,
          quizzes (count)
        )
      `)
      .eq('student_id', user.id)
      .order('joined_at', { ascending: false })

    if (enrollments) {
      classrooms = enrollments
        .filter((e: any) => e.classrooms !== null)
        .map((e: any) => {
          const c = e.classrooms
          return {
            ...c,
            quiz_count: c.quizzes?.[0]?.count || 0,
          }
        })
    }

    // 2. Buscar histórico de tentativas/avaliações do aluno
    const { data: attemptsData } = await (supabase.from('attempts') as any)
      .select(`
        id,
        score,
        started_at,
        finished_at,
        quiz_id,
        quizzes:quiz_id (
          id,
          title,
          question_count,
          classrooms:classroom_id (
            id,
            name
          )
        ),
        answers:answers (
          id,
          is_correct
        )
      `)
      .eq('student_id', user.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })

    if (attemptsData) {
      historyItems = attemptsData.map((att: any) => {
        const answersList = att.answers || []
        const totalAnswers = att.quizzes?.question_count || (answersList.length) || 10
        let correctCount = answersList.filter((a: any) => a.is_correct).length
        if (answersList.length === 0 && att.score !== null && totalAnswers > 0) {
          correctCount = Math.round((Number(att.score) / 10) * totalAnswers)
        }
        const wrongCount = Math.max(0, totalAnswers - correctCount)

        return {
          id: att.id,
          quizId: att.quiz_id,
          quizTitle: att.quizzes?.title || 'Avaliação',
          classroomName: att.quizzes?.classrooms?.name || 'Geral',
          score: Number(att.score) || 0,
          totalQuestions: totalAnswers,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          finishedAt: att.finished_at || new Date().toISOString(),
        }
      })
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* HEADER DO DASHBOARD */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Área do Aluno
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Acesse suas salas de aula, acompanhe seu histórico de notas e mostre seu progresso.
          </p>
        </div>
        <div>
          <JoinClassroomDialog />
        </div>
      </div>

      {/* SEÇÃO 1: LISTA DE SALAS MATRICULADAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Minhas Salas de Aula</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {classrooms.length} {classrooms.length === 1 ? 'sala' : 'salas'}
          </span>
        </div>

        {classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">Você ainda não entrou em nenhuma sala</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Peça o código de acesso (ex: DIR4821) ao seu professor para ingressar na turma.
            </p>
            <div className="mt-6">
              <JoinClassroomDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((classroom) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                isTeacher={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: HISTÓRICO DE PROVAS & NOTAS DO ALUNO */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">📜 Meu Histórico de Avaliações & Acertos</h2>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 border border-slate-700">
            {historyItems.length} {historyItems.length === 1 ? 'concluída' : 'concluídas'}
          </span>
        </div>

        <StudentHistoryTable history={historyItems} />
      </div>
    </div>
  )
}

