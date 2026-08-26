import { createClient } from '@/lib/supabase/server'
import { ClassroomCard } from '@/components/classroom-card'
import { CreateClassroomDialog } from '@/components/create-classroom-dialog'
import { School, Users, FileCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let classrooms: any[] = []
  let totalStudents = 0
  let totalQuizzes = 0

  if (user) {
    // Buscar salas do professor com contagem de alunos e quizzes
    const { data: classroomsData } = await supabase
      .from('classrooms')
      .select(`
        id,
        name,
        description,
        join_code,
        is_active,
        created_at,
        classroom_students (count),
        quizzes (count)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (classroomsData) {
      classrooms = classroomsData.map((c: any) => {
        const studentCount = c.classroom_students?.[0]?.count || 0
        const quizCount = c.quizzes?.[0]?.count || 0
        totalStudents += studentCount
        totalQuizzes += quizCount
        return {
          ...c,
          student_count: studentCount,
          quiz_count: quizCount,
        }
      })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER DO DASHBOARD */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Painel do Professor
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gerencie suas salas de aula, avaliações e acompanhe o engajamento dos alunos.
          </p>
        </div>
        <div>
          <CreateClassroomDialog />
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/30 backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <School className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Salas Criadas</p>
            <p className="text-2xl font-black text-white">{classrooms.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/30 backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Alunos</p>
            <p className="text-2xl font-black text-white">{totalStudents}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/30 backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avaliações</p>
            <p className="text-2xl font-black text-white">{totalQuizzes}</p>
          </div>
        </div>
      </div>

      {/* LISTA DE SALAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Suas Salas de Aula</h2>
          <span className="text-xs font-semibold text-slate-400">
            {classrooms.length} {classrooms.length === 1 ? 'sala cadastrada' : 'salas cadastradas'}
          </span>
        </div>

        {classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <School className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">Nenhuma sala criada ainda</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Crie sua primeira sala para compartilhar o código de acesso com seus alunos e aplicar avaliações.
            </p>
            <div className="mt-6">
              <CreateClassroomDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((classroom) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                isTeacher={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
