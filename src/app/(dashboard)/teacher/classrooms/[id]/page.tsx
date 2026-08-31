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
      student_id,
      joined_at,
      profiles:student_id (
        id,
        name,
        email
      )
    `)
    .eq('classroom_id', id)
    .order('joined_at', { ascending: false })

  const studentProfileMap: Record<string, { name: string; email: string }> = {}
  ;(studentsData || []).forEach((s: any) => {
    const sId = s.profiles?.id || s.student_id
    if (sId) {
      studentProfileMap[sId] = {
        name: s.profiles?.name || 'Aluno',
        email: s.profiles?.email || '',
      }
    }
  })

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

  const quizMap: Record<string, Quiz> = {}
  quizzes.forEach((q) => {
    quizMap[q.id] = q
  })

  // 5. Buscar tentativas e respostas detalhadas dos alunos desta turma específica
  let rankingEntries: RankingEntry[] = []
  let attemptsByStudent: Record<string, any[]> = {}

  if (quizIds.length > 0) {
    // Buscar questões e opções de todos os quizzes desta sala
    const { data: questionsData } = await (supabase.from('questions') as any)
      .select(`
        id,
        quiz_id,
        question_text,
        explanation,
        order_index,
        question_options (
          id,
          option_text,
          is_correct,
          order_index
        )
      `)
      .in('quiz_id', quizIds)
      .order('order_index', { ascending: true })

    const questionsByQuiz: Record<string, any[]> = {}
    ;(questionsData || []).forEach((q: any) => {
      if (!questionsByQuiz[q.quiz_id]) {
        questionsByQuiz[q.quiz_id] = []
      }
      questionsByQuiz[q.quiz_id].push(q)
    })

    // Buscar tentativas dos quizzes desta sala
    const { data: attemptsData } = await (supabase.from('attempts') as any)
      .select('id, score, started_at, finished_at, quiz_id, student_id')
      .in('quiz_id', quizIds)
      .not('finished_at', 'is', null)
      .order('score', { ascending: false })

    const attemptIds = (attemptsData || []).map((a: any) => a.id).filter(Boolean)
    const answersByAttempt: Record<string, any[]> = {}

    if (attemptIds.length > 0) {
      const { data: answersData } = await (supabase.from('answers') as any)
        .select('id, attempt_id, question_id, selected_option_id, is_correct')
        .in('attempt_id', attemptIds)

      ;(answersData || []).forEach((ans: any) => {
        if (!answersByAttempt[ans.attempt_id]) {
          answersByAttempt[ans.attempt_id] = []
        }
        answersByAttempt[ans.attempt_id].push(ans)
      })
    }

    ;(attemptsData || []).forEach((att: any) => {
      const qz = quizMap[att.quiz_id]
      const prof = studentProfileMap[att.student_id] || { name: 'Aluno', email: '' }
      const answersList = answersByAttempt[att.id] || []
      const totalAnswers = qz?.question_count || (questionsByQuiz[att.quiz_id]?.length) || (answersList.length) || 10
      
      let correctCount = answersList.filter((a: any) => a.is_correct).length
      // Se não encontrou respostas via join de answers, calcula precisamente pela nota e total de questões:
      if (answersList.length === 0 && att.score !== null && totalAnswers > 0) {
        correctCount = Math.round((Number(att.score) / 10) * totalAnswers)
      }
      const wrongCount = Math.max(0, totalAnswers - correctCount)

      rankingEntries.push({
        attemptId: att.id,
        studentId: att.student_id,
        studentName: prof.name,
        studentEmail: prof.email,
        classroomName: classroom.name,
        quizId: att.quiz_id,
        quizTitle: qz?.title || 'Avaliação',
        score: Number(att.score) || 0,
        totalQuestions: totalAnswers,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        finishedAt: att.finished_at || new Date().toISOString(),
      })

      // Formatar questões com as opções e respostas marcadas
      const quizQuestions = questionsByQuiz[att.quiz_id] || []
      const answersMap: Record<string, any> = {}
      answersList.forEach((ans: any) => {
        answersMap[ans.question_id] = ans
      })

      const formattedQuestions = quizQuestions.map((q: any) => {
        const ans = answersMap[q.id]
        const options = q.question_options || []
        const selectedOpt = options.find((o: any) => o.id === ans?.selected_option_id)
        const correctOpt = options.find((o: any) => o.is_correct)

        return {
          questionId: q.id,
          questionText: q.question_text || 'Questão',
          explanation: q.explanation || null,
          selectedOptionText: selectedOpt?.option_text || null,
          correctOptionText: correctOpt?.option_text || null,
          isCorrect: Boolean(ans?.is_correct),
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
        quizTitle: qz?.title || 'Avaliação',
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
  const studentsWithAttempts: StudentWithAttempts[] = (studentsData || []).map((s: any) => {
    const sId = s.profiles?.id || s.student_id || s.id
    return {
      id: sId,
      name: s.profiles?.name || 'Aluno',
      email: s.profiles?.email || '',
      joinedAt: s.joined_at,
      attempts: attemptsByStudent[sId] || [],
    }
  })

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
          <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-xs text-slate-400">
              Nenhum material vinculado a esta turma ainda. Envie arquivos para que a IA possa gerar provas baseadas neles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {materials.map((m) => (
              <MaterialCard key={m.id} material={m} classrooms={classroomList} />
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 4: AVALIAÇÕES DA SALA */}
      <div className="space-y-5 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">📝 Avaliações da Sala</h2>
          </div>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-300 border border-slate-700">
            {quizzes.length} {quizzes.length === 1 ? 'Avaliação' : 'Avaliações'}
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
            <FileCheck className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-2 text-sm font-bold text-slate-200">Nenhuma avaliação nesta sala</h3>
            <p className="text-xs text-slate-400 mt-1">
              Gere avaliações automáticas com IA a partir dos materiais desta turma usando o botão no card do material.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {quizzes.map((quiz) => {
              const statusInfo = formatQuizStatus(quiz.status)
              return (
                <div
                  key={quiz.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md transition-all hover:border-indigo-500/50 hover:shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher/quizzes/${quiz.id}`}
                        className="text-base font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1"
                      >
                        {quiz.title}
                      </Link>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {quiz.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{quiz.description}</p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      {quiz.question_count} questões • Tipo: {quiz.question_type}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-slate-800">
                    <Link
                      href={`/teacher/quizzes/${quiz.id}`}
                      className="rounded-xl bg-indigo-600/20 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/30"
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
