'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const customCode = formData.get('join_code') as string | null

    if (!name || name.trim().length === 0) {
      return { error: 'O nome da sala é obrigatório.' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Não autenticado ou sessão expirada. Faça login novamente.' }
    }

    // Garantir que o perfil do professor existe no banco para evitar violação de FK
    await (supabase.from('profiles') as any).upsert({
      id: user.id,
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Professor',
      email: user.email || '',
      role: 'teacher',
    }, { onConflict: 'id' })

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
    revalidatePath('/teacher/materials')
    revalidatePath('/teacher/quizzes')
    return { success: true, message: `Sala "${name}" criada com sucesso! Código: ${join_code}`, data }
  } catch (err: any) {
    console.error('Erro ao criar sala:', err)
    return { error: 'Falha ao processar criação de sala: ' + (err.message || 'Erro inesperado') }
  }
}

export async function updateClassroom(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  try {
    const classroomId = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const is_active = formData.get('is_active') === 'true'

    if (!classroomId || !name || name.trim().length === 0) {
      return { error: 'Dados incompletos para atualizar a sala.' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Não autorizado.' }

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
    revalidatePath('/teacher/materials')
    revalidatePath('/teacher/quizzes')
    revalidatePath(`/teacher/classrooms/${classroomId}`)
    return { success: true, message: 'Sala atualizada com sucesso!', data }
  } catch (err: any) {
    console.error('Erro ao atualizar sala:', err)
    return { error: 'Falha ao atualizar sala: ' + (err.message || 'Erro inesperado') }
  }
}

export async function deleteClassroom(classroomId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Não autorizado.' }

    const { error } = await (supabase.from('classrooms') as any)
      .delete()
      .eq('id', classroomId)
      .eq('teacher_id', user.id)

    if (error) {
      return { error: 'Erro ao excluir sala: ' + error.message }
    }

    revalidatePath('/teacher/dashboard')
    revalidatePath('/teacher/materials')
    revalidatePath('/teacher/quizzes')
    return { success: true, message: 'Sala removida com sucesso.' }
  } catch (err: any) {
    console.error('Erro ao excluir sala:', err)
    return { error: 'Falha ao excluir sala: ' + (err.message || 'Erro inesperado') }
  }
}

/* ==============================================================================
 * 2. MATERIAIS (MATERIALS) - UPLOAD REAL MULTIFORMATO & CRUD
 * ============================================================================== */

export async function uploadAndProcessMaterial(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const classroom_id = formData.get('classroom_id') as string | null
  const file = formData.get('file') as File | null
  const rawContentText = formData.get('content_text') as string | null

  if (!title || title.trim().length === 0) {
    return { error: 'O título do material é obrigatório.' }
  }

  const hasFile = Boolean(file && file.size > 0)
  const hasDirectText = Boolean(rawContentText && rawContentText.trim().length >= 20)

  if (!hasFile && !hasDirectText) {
    return { error: 'Envie um arquivo válido (PDF, Word, Slides, Planilha, TXT) ou digite/cole o texto do material diretamente.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  try {
    let finalStoragePath: string | null = null
    let extractedText = ''
    let fileName = hasFile ? file!.name : 'resumo_texto.txt'
    let fileType = hasFile ? (file!.type || 'application/octet-stream') : 'text/plain'
    let fileSize = hasFile ? file!.size : Buffer.byteLength(rawContentText || '', 'utf8')

    // 1. Processar arquivo se enviado
    if (hasFile && file) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${user.id}/${Date.now()}_${sanitizedFileName}`
      finalStoragePath = storagePath

      // Garantir perfil do professor
      await (supabase.from('profiles') as any).upsert({
        id: user.id,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Professor',
        email: user.email || '',
        role: 'teacher',
      }, { onConflict: 'id' })

      // Upload para Supabase Storage (se bucket existir)
      try {
        const { error: storageError } = await supabase.storage
          .from('materials')
          .upload(storagePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true,
          })

        if (storageError) {
          console.warn('Aviso de storage (bucket materials):', storageError.message)
        }
      } catch (stErr) {
        console.warn('Exceção ao enviar para o storage:', stErr)
      }

      // Extração de texto real
      try {
        const { extractTextFromFile } = await import('@/lib/parsers/extract-text')
        extractedText = await extractTextFromFile(buffer, file.name, file.type)
      } catch (parseErr: any) {
        console.error('Falha na extração de texto:', parseErr)
        // Se o professor também forneceu texto manual, usa o texto manual
        if (hasDirectText && rawContentText) {
          extractedText = rawContentText.trim()
        } else {
          return {
            error: parseErr.message || `Não foi possível extrair texto do arquivo "${file.name}". Certifique-se de que não é uma imagem escaneada sem OCR ou cole o texto do material diretamente.`,
          }
        }
      }
    } else if (hasDirectText && rawContentText) {
      extractedText = rawContentText.trim()
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return {
        error: 'O conteúdo didático extraído é insuficiente para alimentar a IA (mínimo de 20 caracteres com conteúdo real).',
      }
    }

    // 2. Persistência na tabela materials com a sala vinculada
    const { data: materialData, error: dbError } = await (supabase.from('materials') as any)
      .insert({
        teacher_id: user.id,
        classroom_id: classroom_id && classroom_id.trim().length > 0 ? classroom_id : null,
        title: title.trim(),
        description: description?.trim() || null,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_path: finalStoragePath,
        content_text: extractedText,
        processing_status: 'ready' as MaterialProcessingStatus,
      })
      .select()
      .single()

    if (dbError) {
      return { error: 'Erro ao salvar material no banco de dados: ' + dbError.message }
    }

    revalidatePath('/teacher/materials')
    revalidatePath('/teacher/dashboard')
    revalidatePath('/teacher/quizzes')
    if (classroom_id) {
      revalidatePath(`/teacher/classrooms/${classroom_id}`)
    }
    return {
      success: true,
      message: `Material "${title}" processado com sucesso! Conteúdo indexado para geração com IA.`,
      data: materialData,
    }
  } catch (err: any) {
    console.error('Erro no processamento do material:', err)
    return { error: 'Falha no processamento: ' + err.message }
  }
}

export async function createMaterial(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const classroom_id = formData.get('classroom_id') as string | null
  const file_name = formData.get('file_name') as string | null
  const file_type = formData.get('file_type') as string | null
  const content_text = formData.get('content_text') as string | null

  if (!title || title.trim().length === 0) {
    return { error: 'O título do material é obrigatório.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data, error } = await (supabase.from('materials') as any)
    .insert({
      teacher_id: user.id,
      classroom_id: classroom_id && classroom_id.trim().length > 0 ? classroom_id : null,
      title: title.trim(),
      description: description?.trim() || null,
      file_name: file_name?.trim() || 'documento_base.pdf',
      file_type: file_type || 'application/pdf',
      file_path: null,
      content_text: content_text?.trim() || null,
      processing_status: 'ready' as MaterialProcessingStatus,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao cadastrar material: ' + error.message }
  }

  revalidatePath('/teacher/materials')
  revalidatePath('/teacher/quizzes')
  if (classroom_id) {
    revalidatePath(`/teacher/classrooms/${classroom_id}`)
  }
  return { success: true, message: 'Material registrado com sucesso!', data }
}

export async function getMaterialDownloadUrl(filePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUrl(filePath, 3600) // 1 hora de validade

  if (error || !data?.signedUrl) {
    return { error: error?.message || 'Arquivo não encontrado no armazenamento.' }
  }

  return { url: data.signedUrl }
}

export async function updateMaterial(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const materialId = formData.get('id') as string
  const classroom_id = formData.get('classroom_id') as string | null
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const file_name = formData.get('file_name') as string | null
  const content_text = formData.get('content_text') as string | null
  const processing_status = (formData.get('processing_status') as MaterialProcessingStatus) || 'ready'

  if (!materialId || !title || title.trim().length === 0) {
    return { error: 'Dados incompletos para atualizar o material.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const updatePayload: any = {
    classroom_id: classroom_id && classroom_id.trim().length > 0 ? classroom_id : null,
    title: title.trim(),
    description: description?.trim() || null,
    file_name: file_name?.trim() || 'documento_base.pdf',
    processing_status,
  }

  if (content_text !== null) {
    updatePayload.content_text = content_text.trim()
  }

  const { data, error } = await (supabase.from('materials') as any)
    .update(updatePayload)
    .eq('id', materialId)
    .eq('teacher_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao atualizar material: ' + error.message }
  }

  revalidatePath('/teacher/materials')
  revalidatePath('/teacher/quizzes')
  return { success: true, message: 'Material atualizado com sucesso!', data }
}

export async function deleteMaterial(materialId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado.' }

  // Buscar file_path para remover também do storage se existir
  const { data: material } = await (supabase.from('materials') as any)
    .select('file_path')
    .eq('id', materialId)
    .eq('teacher_id', user.id)
    .single()

  if (material?.file_path) {
    await supabase.storage.from('materials').remove([material.file_path])
  }

  const { error } = await (supabase.from('materials') as any)
    .delete()
    .eq('id', materialId)
    .eq('teacher_id', user.id)

  if (error) {
    return { error: 'Erro ao excluir material: ' + error.message }
  }

  revalidatePath('/teacher/materials')
  revalidatePath('/teacher/quizzes')
  return { success: true, message: 'Material removido com sucesso.' }
}

/* ==============================================================================
 * 3. AVALIAÇÕES (QUIZZES) & GERAÇÃO POR IA (GPT-4o-mini / NOTEBOOK LM STYLE)
 * ============================================================================== */

export async function generateQuizWithAI(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const classroom_id = formData.get('classroom_id') as string
  const material_id = formData.get('material_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const question_type = (formData.get('question_type') as 'multiple_choice' | 'true_false' | 'mixed') || 'multiple_choice'
  const questionCount = parseInt(formData.get('question_count') as string, 10) || 5
  const difficulty = (formData.get('difficulty') as 'easy' | 'medium' | 'hard') || 'medium'
  const initial_status = (formData.get('status') as QuizStatus) || 'draft'

  if (!classroom_id || !material_id) {
    return { error: 'Selecione a Sala de Aula e o Material Didático base para a IA.' }
  }

  if (questionCount < 5 || questionCount > 15) {
    return { error: 'A quantidade de questões deve ser entre 5 e 15.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  // 1. Buscar conteúdo do material
  const { data: material, error: matError } = await (supabase.from('materials') as any)
    .select('id, title, content_text')
    .eq('id', material_id)
    .eq('teacher_id', user.id)
    .single()

  if (matError || !material) {
    return { error: 'Material didático não encontrado.' }
  }

  const content = material.content_text?.trim() || ''

  // Detecção de materiais corrompidos por versões anteriores com texto fictício
  const isCorruptedPlaceholder =
    content.startsWith('Material "') &&
    (content.includes('carregado com sucesso. Use as informações') || content.includes('Conteúdo textual registrado')) &&
    content.length < 200

  if (!content || content.length < 20 || isCorruptedPlaceholder) {
    return {
      error: `O material "${material.title}" não possui texto didático extraído suficiente. Acesse a aba Materiais, clique em Editar e cole o texto ou reenvie o arquivo da aula para que a IA possa formular a avaliação com base no conteúdo real.`,
    }
  }

  try {
    // 2. Chamar o gerador GPT-4o-mini com o material exclusivo (Dynamic Import)
    const { generateQuizWithGPT4oMini } = await import('@/lib/ai/quiz-generator')
    const aiResult = await generateQuizWithGPT4oMini({
      materialTitle: material.title,
      materialContent: content,
      questionType: question_type,
      questionCount,
      difficulty,
    })

    const finalTitle = title && title.trim().length > 0 ? title.trim() : aiResult.title

    // 3. Inserir registro do Quiz
    const { data: quiz, error: quizError } = await (supabase.from('quizzes') as any)
      .insert({
        teacher_id: user.id,
        classroom_id,
        material_id: material.id,
        title: finalTitle,
        description: description?.trim() || aiResult.summary || `Avaliação gerada por IA (${difficulty.toUpperCase()}) com ${aiResult.questions.length} questões.`,
        question_type: question_type as QuizQuestionType,
        question_count: aiResult.questions.length,
        status: initial_status,
      })
      .select()
      .single()

    if (quizError || !quiz) {
      return { error: 'Erro ao criar avaliação: ' + quizError?.message }
    }

    // 4. Inserir todas as questões e opções geradas
    for (let i = 0; i < aiResult.questions.length; i++) {
      const q = aiResult.questions[i]
      const { data: questionData, error: qErr } = await (supabase.from('questions') as any)
        .insert({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_type: q.question_type,
          order_index: i + 1,
          explanation: q.explanation || null,
        })
        .select()
        .single()

      if (qErr || !questionData) {
        console.error('Erro ao inserir questão:', qErr)
        continue
      }

      // Inserir alternativas
      const optionsToInsert = q.options.map((opt, optIdx) => ({
        question_id: questionData.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        order_index: optIdx + 1,
      }))

      if (optionsToInsert.length > 0) {
        await (supabase.from('question_options') as any).insert(optionsToInsert)
      }
    }

    revalidatePath('/teacher/quizzes')
    revalidatePath(`/teacher/classrooms/${classroom_id}`)
    
    return {
      success: true,
      message: `Avaliação com ${aiResult.questions.length} questões gerada com sucesso pela IA!`,
      data: { quizId: quiz.id },
    }
  } catch (err: any) {
    console.error('Erro ao gerar quiz com IA:', err)
    return { error: 'Erro na geração por IA (GPT-4o-mini): ' + err.message }
  }
}

export async function createQuizDraft(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  try {
    const classroom_id = formData.get('classroom_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const question_type = (formData.get('question_type') as QuizQuestionType) || 'multiple_choice'
    const status = (formData.get('status') as QuizStatus) || 'draft'

    if (!classroom_id || !title || title.trim().length === 0) {
      return { error: 'Selecione uma sala e informe o título da avaliação.' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Não autenticado.' }

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
  } catch (err: any) {
    console.error('Erro ao criar avaliação:', err)
    return { error: 'Falha ao processar avaliação: ' + (err.message || 'Erro inesperado') }
  }
}

export async function updateQuiz(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  try {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Não autenticado.' }

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
  } catch (err: any) {
    console.error('Erro ao atualizar avaliação:', err)
    return { error: 'Falha ao atualizar avaliação: ' + (err.message || 'Erro inesperado') }
  }
}

export async function deleteQuiz(quizId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Não autorizado.' }

    const { error } = await (supabase.from('quizzes') as any)
      .delete()
      .eq('id', quizId)
      .eq('teacher_id', user.id)

    if (error) {
      return { error: 'Erro ao excluir avaliação: ' + error.message }
    }

    revalidatePath('/teacher/quizzes')
    return { success: true, message: 'Avaliação excluída com sucesso.' }
  } catch (err: any) {
    console.error('Erro ao excluir avaliação:', err)
    return { error: 'Falha ao excluir avaliação: ' + (err.message || 'Erro inesperado') }
  }
}

export async function publishQuiz(quizId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Não autorizado.' }

    const { data, error } = await (supabase.from('quizzes') as any)
      .update({
        status: 'published',
      })
      .eq('id', quizId)
      .eq('teacher_id', user.id)
      .select('id, classroom_id')
      .single()

    if (error) {
      return { error: 'Erro ao publicar avaliação: ' + error.message }
    }

    revalidatePath('/teacher/quizzes')
    revalidatePath(`/teacher/quizzes/${quizId}`)
    if (data?.classroom_id) {
      revalidatePath(`/teacher/classrooms/${data.classroom_id}`)
      revalidatePath(`/student/classrooms/${data.classroom_id}`)
    }
    return { success: true, message: 'Avaliação publicada! Agora os alunos podem visualizá-la.' }
  } catch (err: any) {
    console.error('Erro ao publicar avaliação:', err)
    return { error: 'Falha ao publicar avaliação: ' + (err.message || 'Erro inesperado') }
  }
}

export async function unpublishQuiz(quizId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Não autorizado.' }

    const { data, error } = await (supabase.from('quizzes') as any)
      .update({
        status: 'draft',
      })
      .eq('id', quizId)
      .eq('teacher_id', user.id)
      .select('id, classroom_id')
      .single()

    if (error) {
      return { error: 'Erro ao ocultar avaliação: ' + error.message }
    }

    revalidatePath('/teacher/quizzes')
    revalidatePath(`/teacher/quizzes/${quizId}`)
    if (data?.classroom_id) {
      revalidatePath(`/teacher/classrooms/${data.classroom_id}`)
      revalidatePath(`/student/classrooms/${data.classroom_id}`)
    }
    return { success: true, message: 'Avaliação em rascunho (oculta dos alunos).' }
  } catch (err: any) {
    console.error('Erro ao ocultar avaliação:', err)
    return { error: 'Falha ao ocultar avaliação: ' + (err.message || 'Erro inesperado') }
  }
}


