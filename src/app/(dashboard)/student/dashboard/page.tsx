import { createClient } from '@/lib/supabase/server'
import { ClassroomCard } from '@/components/classroom-card'
import { JoinClassroomDialog } from '@/components/join-classroom-dialog'
import { School, BookOpen, KeyRound, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let classrooms: any[] = []

  if (user) {
    // Buscar salas onde o aluno está matriculado
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
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER DO DASHBOARD */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Área do Aluno
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acesse suas salas de aula e realize suas avaliações.
          </p>
        </div>
        <div>
          <JoinClassroomDialog />
        </div>
      </div>

      {/* LISTA DE SALAS MATRICULADAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Salas Matriculadas</h2>
          <span className="text-xs font-semibold text-slate-500">
            {classrooms.length} {classrooms.length === 1 ? 'sala' : 'salas'}
          </span>
        </div>

        {classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Você ainda não entrou em nenhuma sala</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
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
    </div>
  )
}
