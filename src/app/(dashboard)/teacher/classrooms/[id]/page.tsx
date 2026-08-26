import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatQuizStatus } from '@/lib/utils'
import { Classroom, Quiz, Material } from '@/types/database.types'
import { EditClassroomDialog } from '@/components/edit-classroom-dialog'
import { EditQuizDialog } from '@/components/edit-quiz-dialog'
import { UploadMaterialDialog } from '@/components/upload-material-dialog'
import { GenerateQuizAiDialog } from '@/components/generate-quiz-ai-dialog'
import { MaterialCard } from '@/components/material-card'
import {
  ArrowLeft,
  Users,
  FileCheck,
  Plus,
  School,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClassroomDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Buscar detalhes da sala garantindo que pertence ao professor
  const { data: classroomData } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user?.id || '')
    .maybeSingle()

  const classroom = classroomData as Classroom | null

  if (!classroom) {
    notFound()
  }

  // 2. Buscar alunos matriculados
  const { data: studentsData } = await supabase
    .from('classroom_students')
    .select(`
      id,
      joined_at,
      profiles:student_id (
        id,
        name,
        email
      )
    `)
    .eq('classroom_id', id)
    .order('joined_at', { ascending: false })

  // 3. Buscar materiais vinculados a esta sala
  const { data: materialsData } = await (supabase.from('materials') as any)
    .select('*')
    .eq('teacher_id', user?.id || '')
    .or(`classroom_id.eq.${id},classroom_id.is.null`)
    .order('created_at', { ascending: false })

  // 4. Buscar avaliações criadas para esta sala
  const { data: quizzesData } = await (supabase.from('quizzes') as any)
    .select('*')
    .eq('classroom_id', id)
    .order('created_at', { ascending: false })

  const quizzes = (quizzesData || []) as Quiz[]
  const materials = (materialsData || []) as Material[]

  const students = (studentsData || []).map((s: any) => ({
    id: s.id,
    joined_at: s.joined_at,
    name: s.profiles?.name || 'Aluno',
    email: s.profiles?.email || '',
  }))

  const classroomList = [{ id: classroom.id, name: classroom.name }]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* NAVEGAÇÃO VOLTAR */}
      <div>
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Salas de Aula
        </Link>
      </div>

      {/* CABEÇALHO DA SALA */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <School className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {classroom.name}
                  </h1>
                  <EditClassroomDialog classroom={classroom} />
                </div>
                <p className="text-sm text-slate-400">
                  Criada em {new Date(classroom.created_at).toLocaleDateString('pt-BR')} • {students.length} alunos
                </p>
              </div>
            </div>

            {classroom.description && (
              <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                {classroom.description}
              </p>
            )}
          </div>

          {/* CÓDIGO DE ACESSO */}
          <div className="flex flex-col items-start md:items-end gap-1.5 rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Código de Acesso dos Alunos
            </span>
            <span className="font-mono text-2xl font-black text-indigo-400 tracking-wider">
              {classroom.join_code}
            </span>
            <span className="text-[11px] text-slate-500">
              Compartilhe este código com a turma
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: MATERIAIS DIDÁTICOS DESTA SALA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Materiais Didáticos da Turma</h2>
          </div>
          <div className="flex items-center gap-2">
            <UploadMaterialDialog
              classrooms={classroomList}
              initialClassroomId={classroom.id}
            />
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-xs text-slate-400">
              Nenhum material vinculado a esta turma ainda. Envie arquivos para que a IA possa gerar provas baseadas neles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <MaterialCard key={m.id} material={m} classrooms={classroomList} />
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: GRID DUPLO: AVALIAÇÕES E ALUNOS */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* COLUNA 1 & 2: AVALIAÇÕES DA SALA */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Avaliações da Sala</h2>
            </div>
            <GenerateQuizAiDialog
              classrooms={classroomList}
              materials={materials}
              initialClassroomId={classroom.id}
            />
          </div>

          {quizzes.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <FileCheck className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-2 text-sm font-bold text-slate-200">Nenhuma avaliação nesta sala</h3>
              <p className="text-xs text-slate-400 mt-1">
                Gere avaliações automáticas com IA a partir dos materiais desta turma.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => {
                const statusInfo = formatQuizStatus(quiz.status)
                return (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md transition-all hover:border-indigo-500/50 hover:shadow-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/teacher/quizzes/${quiz.id}`}
                          className="text-sm font-bold text-white hover:text-indigo-400 transition-colors"
                        >
                          {quiz.title}
                        </Link>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {quiz.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{quiz.description}</p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        {quiz.question_count} questões • Tipo: {quiz.question_type}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher/quizzes/${quiz.id}`}
                        className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/30"
                      >
                        Ver Prova
                      </Link>
                      <EditQuizDialog quiz={quiz} classrooms={classroomList} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* COLUNA 3: ALUNOS MATRICULADOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Alunos Matriculados</h2>
            </div>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300 border border-slate-700">
              {students.length}
            </span>
          </div>

          {students.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-2 text-sm font-bold text-slate-200">Nenhum aluno entrou ainda</h3>
              <p className="text-xs text-slate-400 mt-1">
                Passe o código <strong className="font-mono text-indigo-400">{classroom.join_code}</strong> aos alunos.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 divide-y divide-slate-800 shadow-md overflow-hidden">
              {students.map((student) => (
                <div key={student.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-100">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.email}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(student.joined_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
