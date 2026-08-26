import { openai } from './openai'
import { z } from 'zod'

export const GeneratedOptionSchema = z.object({
  option_text: z.string().min(1, 'Texto da alternativa é obrigatório'),
  is_correct: z.boolean(),
})

export const GeneratedQuestionSchema = z.object({
  question_text: z.string().min(3, 'Texto da questão é obrigatório'),
  question_type: z.enum(['multiple_choice', 'true_false', 'mixed', 'essay']),
  explanation: z.string().optional().nullable(),
  options: z.array(GeneratedOptionSchema).min(2, 'A questão deve ter pelo menos 2 alternativas'),
})

export const GeneratedQuizResponseSchema = z.object({
  title: z.string(),
  summary: z.string().optional().nullable(),
  questions: z.array(GeneratedQuestionSchema),
})

export type GeneratedQuizResponse = z.infer<typeof GeneratedQuizResponseSchema>

export interface GenerateQuizParams {
  materialTitle: string
  materialContent: string
  questionType: 'multiple_choice' | 'true_false' | 'mixed'
  questionCount: number // 5 a 15
  difficulty: 'easy' | 'medium' | 'hard'
}

export async function generateQuizWithGPT4oMini(params: GenerateQuizParams): Promise<GeneratedQuizResponse> {
  const { materialTitle, materialContent, questionType, questionCount, difficulty } = params

  if (!materialContent || materialContent.trim().length < 20) {
    throw new Error('O conteúdo do material é insuficiente para gerar questões.')
  }

  // Limitar o contexto se for extremamente grande (ex: 60.000 caracteres para manter latência baixa e custo ultra-eficiente)
  const trimmedContent = materialContent.slice(0, 60000)

  const difficultyDesc = {
    easy: 'FÁCIL: Foque em conceitos fundamentais, definições diretas, termos-chave e fatos explícitos do texto.',
    medium: 'MÉDIO: Foque em interpretação de texto, relações de causa e efeito, aplicações práticas e correlações entre conceitos.',
    hard: 'DIFÍCIL: Foque em análise crítica profunda, resolução de cenários práticos, pegadinhas conceituais sutis e distinções detalhadas.',
  }[difficulty]

  const typeFormatInstructions = {
    multiple_choice: 'Gere questões de MÚLTIPLA ESCOLHA com 4 alternativas distintas cada (ex: A, B, C, D). Exatamente UMA alternativa deve ter is_correct = true e as outras 3 devem ter is_correct = false.',
    true_false: 'Gere questões no formato VERDADEIRO OU FALSO. O enunciado deve ser uma assertiva e haverá exatamente 2 opções: "Verdadeiro" e "Falso", com a correta marcada como is_correct = true e a explicação detalhada do porquê no campo explanation.',
    mixed: 'Gere uma mescla balanceada entre questões de Múltipla Escolha (4 opções) e Verdadeiro ou Falso (2 opções).',
  }[questionType]

  const systemPrompt = `Você é um especialista em avaliação educacional e design pedagógico de alta precisão.
Sua missão é criar exatamente ${questionCount} questões com base EXCLUSIVAMENTE no material didático fornecido pelo professor.

DIRETRIZES CRÍTICAS:
1. RESTRIÇÃO ABSOLUTA AO MATERIAL: Use APENAS os fatos, definições, regras e conteúdos expressamente presentes no material. NÃO adicione conhecimento externo ou invente premissas que não constem no texto.
2. DIFICULDADE ALVO: ${difficultyDesc}
3. FORMATO DAS QUESTÕES: ${typeFormatInstructions}
4. JUSTIFICATIVA PEDAGÓGICA: Para cada questão, preencha o campo "explanation" com uma explicação clara indicando por que a resposta correta é aquela e citando a fundamentação no material.
5. RESPOSTA ESTRITAMENTE EM JSON: Retorne apenas o objeto JSON correspondente ao schema solicitado.`

  const userPrompt = `MATERIAL DIDÁTICO:
Título: "${materialTitle}"
Conteúdo Base:
"""
${trimmedContent}
"""

Gere agora exatamente ${questionCount} questões de nível ${difficulty} seguindo estritamente as diretrizes acima.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_object',
    },
    temperature: 0.3,
  })

  const rawJson = response.choices[0]?.message?.content
  if (!rawJson) {
    throw new Error('A IA não retornou nenhuma resposta.')
  }

  try {
    const parsedData = JSON.parse(rawJson)
    
    // Normalizar caso a IA retorne com chaves alternativas (ex: { questions: [...] })
    const questionsArray = parsedData.questions || parsedData.quiz?.questions || parsedData.data || []
    
    const structuredResponse: GeneratedQuizResponse = {
      title: parsedData.title || `Avaliação - ${materialTitle}`,
      summary: parsedData.summary || `Avaliação gerada automaticamente com ${questionsArray.length} questões.`,
      questions: questionsArray.map((q: any, idx: number) => ({
        question_text: q.question_text || q.text || q.pergunta || `Questão ${idx + 1}`,
        question_type: (q.question_type || questionType) as any,
        explanation: q.explanation || q.justificativa || q.explicacao || null,
        options: (q.options || q.alternativas || []).map((opt: any) => ({
          option_text: typeof opt === 'string' ? opt : (opt.option_text || opt.text || opt.texto || ''),
          is_correct: Boolean(opt.is_correct || opt.correta || opt.correct),
        })),
      })),
    }

    return GeneratedQuizResponseSchema.parse(structuredResponse)
  } catch (error: any) {
    console.error('Erro ao validar JSON da OpenAI:', error, rawJson)
    throw new Error(`Falha ao processar o formato gerado pela IA: ${error.message}`)
  }
}
