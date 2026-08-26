import { openai } from './openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

/* ==============================================================================
 * 1. SCHEMAS ESTRUTURADOS COM ZOD
 * ============================================================================== */

export const GeneratedOptionSchema = z.object({
  option_text: z.string().describe('Texto limpo e objetivo da alternativa, sem prefixos como A) ou 1.'),
  is_correct: z.boolean().describe('Indica se esta alternativa é o gabarito correto'),
})

export const GeneratedQuestionSchema = z.object({
  question_text: z.string().describe('Enunciado claro, bem redigido e contextualizado da questão'),
  question_type: z.enum(['multiple_choice', 'true_false', 'mixed', 'essay']).describe('Tipo da questão'),
  explanation: z.string().describe('Justificativa pedagógica em linguagem humana explicando porque a resposta está certa com base no material'),
  options: z.array(GeneratedOptionSchema).min(2).max(4).describe('Lista de alternativas'),
})

export const GeneratedQuizResponseSchema = z.object({
  title: z.string().describe('Título elegante e formatado para a avaliação'),
  summary: z.string().describe('Resumo pedagógico do conteúdo cobrado na avaliação'),
  questions: z.array(GeneratedQuestionSchema).describe('Lista de questões formatadas'),
})

export type GeneratedQuizResponse = z.infer<typeof GeneratedQuizResponseSchema>

export interface GenerateQuizParams {
  materialTitle: string
  materialContent: string
  questionType: 'multiple_choice' | 'true_false' | 'mixed'
  questionCount: number // 5 a 15
  difficulty: 'easy' | 'medium' | 'hard'
}

/* ==============================================================================
 * 2. FUNÇÃO DE HIGIENIZAÇÃO DE TEXTO PARA LEITURA HUMANA
 * ============================================================================== */

export function cleanHumanText(text: string): string {
  if (!text) return ''
  
  return text
    // Remove blocos de markdown de código se houver
    .replace(/^```[a-z]*\n/i, '')
    .replace(/\n```$/i, '')
    // Remove prefixos automáticos como "Questão 1:", "Pergunta 1 -", "1. "
    .replace(/^(quest[aã]o|pergunta|\d+)\s*[:.\-–]\s*/i, '')
    // Remove prefixos de alternativas como "A)", "a)", "A -", "[A]"
    .replace(/^\[?[A-Da-d0-9]\]?[\).\-–]\s*/, '')
    // Remove aspas excessivas no início e fim
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim()
}

/* ==============================================================================
 * 3. GERADOR COM STRUCTURED OUTPUTS (GPT-4o-mini)
 * ============================================================================== */

export async function generateQuizWithGPT4oMini(params: GenerateQuizParams): Promise<GeneratedQuizResponse> {
  const { materialTitle, materialContent, questionType, questionCount, difficulty } = params

  if (!materialContent || materialContent.trim().length < 20) {
    throw new Error('O conteúdo do material é insuficiente para gerar questões.')
  }

  const trimmedContent = materialContent.slice(0, 50000)

  const difficultyDesc = {
    easy: 'FÁCIL: Conceitos fundamentais, definições diretas e fatos explícitos do texto.',
    medium: 'MÉDIO: Interpretação, aplicações práticas e correlações entre conceitos.',
    hard: 'DIFÍCIL: Análise crítica profunda, cenários práticos e distinções detalhadas.',
  }[difficulty]

  const typeFormatInstructions = {
    multiple_choice: 'Gere questões de MÚLTIPLA ESCOLHA com 4 alternativas distintas (A, B, C, D) onde apenas 1 é a correta.',
    true_false: 'Gere questões no formato VERDADEIRO OU FALSO. O enunciado deve ser uma assertiva e haverá exatamente 2 opções: "Verdadeiro" e "Falso", com a correta indicada e a justificativa clara.',
    mixed: 'Gere uma mescla balanceada entre questões de Múltipla Escolha e Verdadeiro ou Falso.',
  }[questionType]

  const systemPrompt = `Você é um professor e especialista em avaliação educacional de alto nível.
Sua missão é produzir uma avaliação com exatamente ${questionCount} questões formuladas para seres humanos (professores e alunos), com redação impecável, elegante e profissional em Português do Brasil.

DIRETRIZES FUNDAMENTAIS:
1. RESTRIÇÃO ABSOLUTA AO MATERIAL: Use APENAS o conteúdo didático fornecido. Nunca invente regras ou use fontes externas.
2. FORMATO HUMANO E LIMPO: 
   - NÃO inclua prefixos como "A)", "B)", "1.", "Questão 1:" nos textos das opções ou enunciados.
   - Enunciados devem ser claros e objetivos.
   - Cada questão de Múltipla Escolha deve conter 4 opções claras e verossímeis.
   - Cada questão de Verdadeiro/Falso deve conter 2 opções ("Verdadeiro" e "Falso").
3. GABARITO & JUSTIFICATIVA: Cada questão deve ter exatamente UMA alternativa com is_correct = true e uma justificativa pedagógica no campo "explanation" explicando porque aquela alternativa é a correta com base no texto.
4. DIFICULDADE ALVO: ${difficultyDesc}
5. FORMATO DAS QUESTÕES: ${typeFormatInstructions}`

  const userPrompt = `MATERIAL DIDÁTICO BASE:
Título: "${materialTitle}"
Conteúdo:
"""
${trimmedContent}
"""

Elabore agora exatamente ${questionCount} questões de nível ${difficulty.toUpperCase()}.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(GeneratedQuizResponseSchema, 'educational_quiz'),
      temperature: 0.2,
    })

    const rawContent = completion.choices[0]?.message?.content

    if (!rawContent) {
      throw new Error('A IA não retornou conteúdo.')
    }

    const parsedJson = JSON.parse(rawContent)
    const validated = GeneratedQuizResponseSchema.parse(parsedJson)

    // Pós-processamento e higienização para garantir que tudo seja entregue 100% humanizado
    const sanitizedQuiz: GeneratedQuizResponse = {
      title: cleanHumanText(validated.title) || `Avaliação - ${materialTitle}`,
      summary: cleanHumanText(validated.summary || '') || `Avaliação gerada com ${validated.questions.length} questões.`,
      questions: validated.questions.map((q, idx: number) => ({
        question_text: cleanHumanText(q.question_text) || `Questão ${idx + 1}`,
        question_type: q.question_type,
        explanation: cleanHumanText(q.explanation || ''),
        options: q.options.map((opt) => ({
          option_text: cleanHumanText(opt.option_text),
          is_correct: Boolean(opt.is_correct),
        })),
      })),
    }

    return sanitizedQuiz
  } catch (error: any) {
    console.error('Erro na chamada do GPT-4o-mini:', error)
    throw new Error(`Falha ao gerar avaliação formatada: ${error.message}`)
  }
}
