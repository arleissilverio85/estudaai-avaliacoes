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
  try {
    const code = formData.get('code') as string

    if (!code || code.trim().length === 0) {
      return { error: 'Por favor, digite o código da sala de aula.' }
    }

    const cleanCode = code.trim().toUpperCase()
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Não autenticado ou sessão expirada. Faça login novamente.' }
    }

    // Garantir perfil do aluno
    await (supabase.from('profiles') as any).upsert({
      id: user.id,
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aluno',
      email: user.email || '',
      role: 'student',
    }, { onConflict: 'id' })

    // Chamar função RPC segura join_classroom se existir
    try {
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
    } catch {
      // Prossegue para fallback direto
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
  } catch (err: any) {
    console.error('Erro ao ingressar na sala:', err)
    return { error: 'Falha ao processar ingresso na sala: ' + (err.message || 'Erro inesperado') }
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
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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

    // Buscar dados da sala para revalidação
    const { data: quizInfo } = await (supabase.from('quizzes') as any)
      .select('id, classroom_id')
      .eq('id', quizId)
      .maybeSingle()

    // Garantir que o perfil do aluno existe em public.profiles para não violar foreign key
    await (supabase.from('profiles') as any).upsert({
      id: user.id,
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aluno',
      email: user.email || '',
      role: 'student',
    }, { onConflict: 'id' })

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

    if (attemptError) {
      console.error('Falha ao inserir tentativa no banco:', attemptError)
      return {
        success: false,
        error: 'Erro ao salvar avaliação no banco: ' + attemptError.message,
      }
    }

    if (attemptData?.id && answersToInsert.length > 0) {
      // Inserir respostas detalhadas
      const answersWithAttempt = answersToInsert.map((ans) => ({
        attempt_id: attemptData.id,
        question_id: ans.question_id,
        selected_option_id: ans.selected_option_id && ans.selected_option_id.trim() !== '' ? ans.selected_option_id : null,
        is_correct: Boolean(ans.is_correct),
        answered_at: new Date().toISOString(),
      }))

      const { error: answersError } = await (supabase.from('answers') as any).insert(answersWithAttempt)
      if (answersError) {
        console.error('Falha ao inserir respostas detalhadas:', answersError)
      }
    }

    if (quizInfo?.classroom_id) {
      revalidatePath(`/teacher/classrooms/${quizInfo.classroom_id}`)
      revalidatePath(`/student/classrooms/${quizInfo.classroom_id}`)
    }
    revalidatePath(`/teacher/quizzes/${quizId}`)
    revalidatePath('/teacher/dashboard')
    revalidatePath(`/student/quizzes/${quizId}`)
    revalidatePath('/student/dashboard')

    return {
      success: true,
      score: finalScore,
      totalQuestions,
      correctCount,
      results: questionResults,
    }
  } catch (err: any) {
    console.error('Erro ao submeter avaliação:', err)
    return { success: false, error: 'Falha ao processar entrega da avaliação: ' + (err.message || 'Erro inesperado') }
  }
}

export async function deleteStudentAttempt(attemptId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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
  } catch (err: any) {
    console.error('Erro ao excluir tentativa:', err)
    return { success: false, error: 'Falha ao excluir avaliação: ' + (err.message || 'Erro inesperado') }
  }
}


