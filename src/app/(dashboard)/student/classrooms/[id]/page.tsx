import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, School, FileCheck, PlayCircle, Info } from 'lucide-react'
import { Classroom, Quiz } from '@/types/database.types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentClassroomPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Buscar detalhes da sala (RLS só permite se o aluno estiver matriculado em classroom_students)
  const { data: classroomData } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const classroom = classroomData as Classroom | null

  if (!classroom) {
    notFound()
  }

  // Buscar avaliações publicadas nesta sala (RLS filtra status = 'published')
  const { data: quizzesData } = await supabase
    .from('quizzes')
    .select('*')
    .eq('classroom_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const quizzes = (quizzesData || []) as Quiz[]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* NAVEGAÇÃO VOLTAR */}
      <div>
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Minhas Salas
        </Link>
      </div>

      {/* CABEÇALHO DA SALA */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <School className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {classroom.name}
              </h1>
              <Badge variant="success">Matriculado</Badge>
            </div>
            {classroom.description && (
              <p className="mt-1 text-sm text-slate-300">{classroom.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* AVALIAÇÕES DISPONÍVEIS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Avaliações Disponíveis</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {quizzes.length} avaliações
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">Nenhuma avaliação liberada</h3>
            <p className="mt-1 text-xs text-slate-400">
              O professor ainda não publicou avaliações para esta sala. Fique atento às orientações em aula.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md shadow-black/40 backdrop-blur-md transition-all hover:border-indigo-500/50 hover:shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-white">{quiz.title}</h4>
                    <Badge variant="indigo" className="text-[10px]">Disponível</Badge>
                  </div>
                  {quiz.description && (
                    <p className="text-xs text-slate-400">{quiz.description}</p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Tipo: {quiz.question_type}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" />
                    Etapa 1: Estrutura Base
                  </span>

                  <Button size="sm" variant="emerald" disabled title="Aplicação de testes será na próxima etapa">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Iniciar Avaliação
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
