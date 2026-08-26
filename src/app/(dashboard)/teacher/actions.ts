'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateJoinCode } from '@/lib/utils'
import { QuizQuestionType, QuizStatus, MaterialProcessingStatus } from '@/types/database.types'

export type ActionResponse = {
  success?: boolean
  error?: string
  message?: string
  data?: any
}

/* ==============================================================================
 * 1. SALAS DE AULA (CLASSROOMS) - CRUD
 * ============================================================================== */

export async function createClassroom(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const customCode = formData.get('join_code') as string | null

  if (!name || name.trim().length === 0) {
    return { error: 'O nome da sala é obrigatório.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado.' }
  }

  const join_code = customCode && customCode.trim().length > 0 
    ? customCode.trim().toUpperCase() 
    : generateJoinCode(name)

  const { data, error } = await (supabase.from('classrooms') as any)
    .insert({
      teacher_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      join_code,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este código de sala já está em uso. Tente outro código ou gere automaticamente.' }
    }
    return { error: 'Erro ao criar sala de aula: ' + error.message }
  }

  revalidatePath('/teacher/dashboard')
  return { success: true, message: `Sala "${name}" criada com sucesso! Código: ${join_code}`, data }
}

export async function updateClassroom(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const classroomId = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const is_active = formData.get('is_active') === 'true'

  if (!classroomId || !name || name.trim().length === 0) {
    return { error: 'Dados incompletos para atualizar a sala.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado.' }

  const { data, error } = await (supabase.from('classrooms') as any)
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      is_active,
    })
    .eq('id', classroomId)
    .eq('teacher_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao atualizar sala: ' + error.message }
  }

  revalidatePath('/teacher/dashboard')
  revalidatePath(`/teacher/classrooms/${classroomId}`)
  return { success: true, message: 'Sala atualizada com sucesso!', data }
}

export async function deleteClassroom(classroomId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado.' }

  const { error } = await (supabase.from('classrooms') as any)
    .delete()
    .eq('id', classroomId)
    .eq('teacher_id', user.id)

  if (error) {
    return { error: 'Erro ao excluir sala: ' + error.message }
  }

  revalidatePath('/teacher/dashboard')
  return { success: true, message: 'Sala removida com sucesso.' }
}

/* ==============================================================================
 * 2. MATERIAIS (MATERIALS) - CRUD
 * ============================================================================== */

export async function createMaterial(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const file_name = formData.get('file_name') as string | null
  const file_type = formData.get('file_type') as string | null

  if (!title || title.trim().length === 0) {
    return { error: 'O título do material é obrigatório.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data, error } = await (supabase.from('materials') as any)
    .insert({
      teacher_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      file_name: file_name?.trim() || 'documento_base.pdf',
      file_type: file_type || 'application/pdf',
      file_path: null,
      processing_status: 'ready' as MaterialProcessingStatus,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao cadastrar material: ' + error.message }
  }

  revalidatePath('/teacher/materials')
  return { success: true, message: 'Material registrado com sucesso!', data }
}

export async function updateMaterial(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const materialId = formData.get('id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const file_name = formData.get('file_name') as string | null
  const processing_status = (formData.get('processing_status') as MaterialProcessingStatus) || 'ready'

  if (!materialId || !title || title.trim().length === 0) {
    return { error: 'Dados incompletos para atualizar o material.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data, error } = await (supabase.from('materials') as any)
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      file_name: file_name?.trim() || 'documento_base.pdf',
      processing_status,
    })
    .eq('id', materialId)
    .eq('teacher_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao atualizar material: ' + error.message }
  }

  revalidatePath('/teacher/materials')
  return { success: true, message: 'Material atualizado com sucesso!', data }
}

export async function deleteMaterial(materialId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado.' }

  const { error } = await (supabase.from('materials') as any)
    .delete()
    .eq('id', materialId)
    .eq('teacher_id', user.id)

  if (error) {
    return { error: 'Erro ao excluir material: ' + error.message }
  }

  revalidatePath('/teacher/materials')
  return { success: true, message: 'Material removido com sucesso.' }
}

/* ==============================================================================
 * 3. AVALIAÇÕES (QUIZZES) - CRUD E HISTÓRICO
 * ============================================================================== */

export async function createQuizDraft(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const classroom_id = formData.get('classroom_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const question_type = (formData.get('question_type') as QuizQuestionType) || 'multiple_choice'
  const status = (formData.get('status') as QuizStatus) || 'draft'

  if (!classroom_id || !title || title.trim().length === 0) {
    return { error: 'Selecione uma sala e informe o título da avaliação.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data, error } = await (supabase.from('quizzes') as any)
    .insert({
      teacher_id: user.id,
      classroom_id,
      title: title.trim(),
      description: description?.trim() || null,
      question_type,
      status,
      question_count: 0,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao criar avaliação: ' + error.message }
  }

  revalidatePath('/teacher/quizzes')
  revalidatePath(`/teacher/classrooms/${classroom_id}`)
  return { success: true, message: 'Avaliação cadastrada com sucesso!', data }
}

export async function updateQuiz(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const quizId = formData.get('id') as string
  const classroom_id = formData.get('classroom_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const question_type = (formData.get('question_type') as QuizQuestionType) || 'multiple_choice'
  const status = (formData.get('status') as QuizStatus) || 'draft'

  if (!quizId || !classroom_id || !title || title.trim().length === 0) {
    return { error: 'Dados incompletos para atualizar a avaliação.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data, error } = await (supabase.from('quizzes') as any)
    .update({
      classroom_id,
      title: title.trim(),
      description: description?.trim() || null,
      question_type,
      status,
    })
    .eq('id', quizId)
    .eq('teacher_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao atualizar avaliação: ' + error.message }
  }

  revalidatePath('/teacher/quizzes')
  revalidatePath(`/teacher/classrooms/${classroom_id}`)
  return { success: true, message: 'Avaliação atualizada com sucesso!', data }
}

export async function deleteQuiz(quizId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado.' }

  const { error } = await (supabase.from('quizzes') as any)
    .delete()
    .eq('id', quizId)
    .eq('teacher_id', user.id)

  if (error) {
    return { error: 'Erro ao excluir avaliação: ' + error.message }
  }

  revalidatePath('/teacher/quizzes')
  return { success: true, message: 'Avaliação excluída com sucesso.' }
}
