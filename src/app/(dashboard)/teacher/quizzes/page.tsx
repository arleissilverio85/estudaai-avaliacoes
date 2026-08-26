import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatQuizStatus } from '@/lib/utils'
import { FileCheck, School } from 'lucide-react'
import { CreateQuizForm } from '@/components/create-quiz-form'

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

  // Buscar avaliações
  const { data: quizzesData } = await supabase
    .from('quizzes')
    .select(`
      *,
      classrooms:classroom_id (
        name
      )
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
            Crie avaliações em rascunho ou publique para suas turmas.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DE CRIAÇÃO DE QUIZ */}
      <CreateQuizForm classrooms={classrooms} initialClassroomId={classroom_id} />

      {/* LISTA DE AVALIAÇÕES */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Avaliações Criadas</h2>

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
            {quizzes.map((q: any) => {
              const statusInfo = formatQuizStatus(q.status)
              return (
                <Card key={q.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold text-white">{q.title}</CardTitle>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <CardDescription className="text-xs flex items-center gap-1 mt-1 text-indigo-400 font-medium">
                      <School className="h-3 w-3" />
                      {q.classrooms?.name || 'Sala Geral'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-400">
                    <p>Tipo: <span className="font-semibold text-slate-200">{q.question_type}</span></p>
                    <p className="text-[11px] text-slate-500">
                      Criada em {new Date(q.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
