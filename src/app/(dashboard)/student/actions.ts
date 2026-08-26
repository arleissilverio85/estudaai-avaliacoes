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
