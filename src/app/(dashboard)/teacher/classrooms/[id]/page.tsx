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
import { ClassroomRankingTable, RankingEntry } from '@/components/classroom-ranking-table'
import { ClassroomStudentsTable, StudentWithAttempts } from '@/components/classroom-students-table'
import {
  ArrowLeft,
  Users,
  FileCheck,
  Plus,
  School,
  Clock,
  BookOpen,
  Sparkles,
  Trophy,
  UserCheck,
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
  const quizIds = quizzes.map((q) => q.id)

  // 5. Buscar tentativas e respostas detalhadas dos alunos desta turma específica
  let rankingEntries: RankingEntry[] = []
  let attemptsByStudent: Record<string, any[]> = {}

  if (quizIds.length > 0) {
    const { data: attemptsData } = await (supabase.from('attempts') as any)
      .select(`
        id,
        score,
        started_at,
        finished_at,
        quiz_id,
        student_id,
        quizzes:quiz_id (
          id,
          title,
          question_count
        ),
        profiles:student_id (
          id,
          name,
          email
        ),
        answers:answers (
          id,
          question_id,
          selected_option_id,
          is_correct,
          questions:question_id (
            id,
            question_text,
            explanation,
            question_options (
              id,
              option_text,
              is_correct
            )
          )
        )
      `)
      .in('quiz_id', quizIds)
      .not('finished_at', 'is', null)
      .order('score', { ascending: false })

    rankingEntries = (attemptsData || []).map((att: any) => {
      const answersList = att.answers || []
      const correctCount = answersList.filter((a: any) => a.is_correct).length
      const totalAnswers = answersList.length || att.quizzes?.question_count || 10
      const wrongCount = Math.max(0, totalAnswers - correctCount)

      return {
        attemptId: att.id,
        studentId: att.student_id,
        studentName: att.profiles?.name || 'Aluno',
        studentEmail: att.profiles?.email || '',
        classroomName: classroom.name,
        quizId: att.quiz_id,
        quizTitle: att.quizzes?.title || 'Avaliação',
        score: Number(att.score) || 0,
        totalQuestions: totalAnswers,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        finishedAt: att.finished_at || new Date().toISOString(),
      }
    })

    // Agrupar tentativas por aluno com dados completos das perguntas e respostas
    ;(attemptsData || []).forEach((att: any) => {
      const answersList = att.answers || []
      const correctCount = answersList.filter((a: any) => a.is_correct).length
      const totalAnswers = answersList.length || att.quizzes?.question_count || 10
      const wrongCount = Math.max(0, totalAnswers - correctCount)

      const formattedQuestions = answersList.map((ans: any) => {
        const q = ans.questions
        const options = q?.question_options || []
        const selectedOpt = options.find((o: any) => o.id === ans.selected_option_id)
        const correctOpt = options.find((o: any) => o.is_correct)

        return {
          questionId: q?.id || ans.question_id,
          questionText: q?.question_text || 'Questão',
          explanation: q?.explanation || null,
          selectedOptionText: selectedOpt?.option_text || null,
          correctOptionText: correctOpt?.option_text || null,
          isCorrect: Boolean(ans.is_correct),
          options: options.map((o: any) => ({
            id: o.id,
            optionText: o.option_text,
            isCorrect: Boolean(o.is_correct),
          })),
        }
      })

      if (!attemptsByStudent[att.student_id]) {
        attemptsByStudent[att.student_id] = []
      }

      attemptsByStudent[att.student_id].push({
        attemptId: att.id,
        quizId: att.quiz_id,
        quizTitle: att.quizzes?.title || 'Avaliação',
        score: Number(att.score) || 0,
        totalQuestions: totalAnswers,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        finishedAt: att.finished_at || new Date().toISOString(),
        questions: formattedQuestions,
      })
    })
  }

  // 6. Estruturar lista completa de alunos com suas tentativas
  const studentsWithAttempts: StudentWithAttempts[] = (studentsData || []).map((s: any) => ({
    id: s.profiles?.id || s.id,
    name: s.profiles?.name || 'Aluno',
    email: s.profiles?.email || '',
    joinedAt: s.joined_at,
    attempts: attemptsByStudent[s.profiles?.id || s.id] || [],
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
                  Criada em {new Date(classroom.created_at).toLocaleDateString('pt-BR')} • {studentsWithAttempts.length} alunos matriculados
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

      {/* SEÇÃO 1: RANKING E CLASSIFICAÇÃO DA TURMA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">🏆 Ranking de Desempenho da Turma ({classroom.name})</h2>
        </div>

        <ClassroomRankingTable
          entries={rankingEntries}
          classroomName={classroom.name}
          quizzes={quizzes.map((q) => ({ id: q.id, title: q.title }))}
        />
      </div>

      {/* SEÇÃO 2: ALUNOS DA SALA E RESULTADOS INDIVIDUAIS COM RESPOSTAS */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">👥 Alunos Matriculados & Resultados Individuais</h2>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 border border-slate-700">
            {studentsWithAttempts.length} Alunos
          </span>
        </div>

        <ClassroomStudentsTable
          students={studentsWithAttempts}
          classroomName={classroom.name}
          quizzes={quizzes.map((q) => ({ id: q.id, title: q.title }))}
        />
      </div>

      {/* SEÇÃO 3: MATERIAIS DIDÁTICOS DESTA SALA */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">📚 Materiais Didáticos da Turma</h2>
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

      {/* SEÇÃO 4: AVALIAÇÕES DA SALA */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">📝 Avaliações da Sala</h2>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quizzes.map((quiz) => {
              const statusInfo = formatQuizStatus(quiz.status)
              return (
                <div
                  key={quiz.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md transition-all hover:border-indigo-500/50 hover:shadow-lg"
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

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
                    <Link
                      href={`/teacher/quizzes/${quiz.id}`}
                      className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/30"
                    >
                      Ver Prova & Ranking
                    </Link>
                    <EditQuizDialog quiz={quiz} classrooms={classroomList} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
