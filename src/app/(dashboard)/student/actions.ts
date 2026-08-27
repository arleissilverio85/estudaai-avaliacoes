'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Classroom } from '@/types/database.types'

export type JoinResponse = {
  success?: boolean
  error?: string
  message?: string
  classroomId?: string
}

export async function joinClassroomByCode(
  prevState: JoinResponse | null,
  formData: FormData
): Promise<JoinResponse> {
  const code = formData.get('code') as string

  if (!code || code.trim().length === 0) {
    return { error: 'Por favor, digite o código da sala de aula.' }
  }

  const cleanCode = code.trim().toUpperCase()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado.' }
  }

  // Chamar função RPC segura join_classroom
  const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)('join_classroom', {
    p_join_code: cleanCode,
  })

  if (!rpcError && rpcResult) {
    if (!rpcResult.success) {
      return { error: rpcResult.message }
    }
    revalidatePath('/student/dashboard')
    return {
      success: true,
      message: rpcResult.message || 'Matrícula realizada com sucesso!',
      classroomId: rpcResult.classroom_id,
    }
  }

  // Fallback direto caso a RPC ainda não tenha sido executada no banco
  const { data: classroomData, error: findError } = await supabase
    .from('classrooms')
    .select('*')
    .eq('join_code', cleanCode)
    .maybeSingle()

  const classroom = classroomData as Classroom | null

  if (findError || !classroom) {
    return { error: 'Código de sala não encontrado. Verifique com seu professor.' }
  }

  if (!classroom.is_active) {
    return { error: 'Esta sala de aula está desativada no momento.' }
  }

  if (classroom.teacher_id === user.id) {
    return { error: 'Você é o professor criador desta sala.' }
  }

  // Inserir matrícula em classroom_students
  const { error: insertError } = await supabase
    .from('classroom_students')
    .insert({
      classroom_id: classroom.id,
      student_id: user.id,
    } as any)

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'Você já está matriculado nesta sala de aula.' }
    }
    return { error: 'Erro ao ingressar na sala: ' + insertError.message }
  }

  revalidatePath('/student/dashboard')
  return {
    success: true,
    message: `Você entrou na sala "${classroom.name}" com sucesso!`,
    classroomId: classroom.id,
  }
}

export type QuizSubmissionResult = {
  success: boolean
  error?: string
  score?: number
  totalQuestions?: number
  correctCount?: number
  results?: {
    questionId: string
    questionText: string
    explanation: string | null
    selectedOptionId: string
    correctOptionId: string
    isCorrect: boolean
    options: {
      id: string
      optionText: string
      isCorrect: boolean
    }[]
  }[]
}

export async function submitQuizAttempt(
  quizId: string,
  selectedAnswers: Record<string, string> // { [questionId]: selectedOptionId }
): Promise<QuizSubmissionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  // 1. Buscar as questões e o gabarito oficial desta prova
  const { data: questionsData, error: qError } = await (supabase.from('questions') as any)
    .select(`
      id,
      question_text,
      explanation,
      order_index,
      question_options (
        id,
        option_text,
        is_correct
      )
    `)
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true })

  if (qError || !questionsData || questionsData.length === 0) {
    return { success: false, error: 'Não foi possível carregar as questões da avaliação.' }
  }

  // 2. Corrigir as respostas
  let correctCount = 0
  const totalQuestions = questionsData.length
  const questionResults: QuizSubmissionResult['results'] = []

  const answersToInsert: any[] = []

  for (const q of questionsData) {
    const selectedOptionId = selectedAnswers[q.id] || ''
    const correctOption = (q.question_options || []).find((opt: any) => opt.is_correct)
    const isCorrect = correctOption ? correctOption.id === selectedOptionId : false

    if (isCorrect) {
      correctCount++
    }

    questionResults.push({
      questionId: q.id,
      questionText: q.question_text,
      explanation: q.explanation,
      selectedOptionId,
      correctOptionId: correctOption?.id || '',
      isCorrect,
      options: (q.question_options || []).map((opt: any) => ({
        id: opt.id,
        optionText: opt.option_text,
        isCorrect: Boolean(opt.is_correct),
      })),
    })

    answersToInsert.push({
      question_id: q.id,
      selected_option_id: selectedOptionId || null,
      is_correct: isCorrect,
    })
  }

  const finalScore = Number(((correctCount / totalQuestions) * 10).toFixed(2))

  // 3. Registrar tentativa (attempt) no banco de dados
  const { data: attemptData, error: attemptError } = await (supabase.from('attempts') as any)
    .insert({
      quiz_id: quizId,
      student_id: user.id,
      status: 'completed',
      score: finalScore,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (attemptData?.id) {
    // Inserir respostas detalhadas
    const answersWithAttempt = answersToInsert.map((ans) => ({
      ...ans,
      attempt_id: attemptData.id,
    }))

    await (supabase.from('answers') as any).insert(answersWithAttempt)
  }

  revalidatePath(`/student/quizzes/${quizId}`)
  revalidatePath('/student/dashboard')

  return {
    success: true,
    score: finalScore,
    totalQuestions,
    correctCount,
    results: questionResults,
  }
}

export async function deleteStudentAttempt(attemptId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado.' }
  }

  const { error } = await supabase
    .from('attempts')
    .delete()
    .eq('id', attemptId)
    .eq('student_id', user.id)

  if (error) {
    return { success: false, error: 'Erro ao remover avaliação do histórico: ' + error.message }
  }

  revalidatePath('/student/dashboard')
  return { success: true }
}

