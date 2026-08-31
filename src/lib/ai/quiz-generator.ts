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
  question_text: z.string().describe('Enunciado claro, bem redigido e contextualizado da questão com base no material'),
  question_type: z.enum(['multiple_choice', 'true_false', 'mixed', 'essay']).describe('Tipo da questão'),
  explanation: z.string().describe('Justificativa pedagógica em linguagem humana explicando porque a resposta está certa citando/referenciando o material'),
  options: z.array(GeneratedOptionSchema).min(2).max(4).describe('Lista de alternativas com distribuição sortida da resposta correta'),
})

export const GeneratedQuizResponseSchema = z.object({
  title: z.string().describe('Título elegante e formatado para a avaliação'),
  summary: z.string().describe('Resumo pedagógico do conteúdo didático cobrado na avaliação'),
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
 * 2. UTILITÁRIOS: HIGIENIZAÇÃO DE TEXTO E EMBARALHAMENTO SEGURO (SHUFFLE)
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

/**
 * Embaralha aleatoriamente as alternativas (Fisher-Yates Shuffle)
 * para garantir que a opção correta seja sorteada de forma equitativa
 * entre as posições A, B, C e D.
 */
export function shuffleOptions<T>(options: T[]): T[] {
  const shuffled = [...options]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/* ==============================================================================
 * 3. GERADOR COM ESTRITA ANCORAGEM AO MATERIAL DIDÁTICO (NOTEBOOK LM STYLE)
 * ============================================================================== */

export async function generateQuizWithGPT4oMini(params: GenerateQuizParams): Promise<GeneratedQuizResponse> {
  const { materialTitle, materialContent, questionType, questionCount, difficulty } = params

  if (!materialContent || materialContent.trim().length < 20) {
    throw new Error('O conteúdo do material é insuficiente para gerar questões.')
  }

  // Suporte a até 80.000 caracteres de contexto didático (amplo espaço dentro da janela do GPT-4o-mini)
  const trimmedContent = materialContent.slice(0, 80000)

  const difficultyDesc = {
    easy: 'FÁCIL: Perguntas diretas sobre conceitos explícitos, definições, termos-chave e afirmações literais presentes no texto do professor.',
    medium: 'MÉDIO: Interpretação, aplicações dos conceitos expostos e correlações diretas entre tópicos ensinados no material.',
    hard: 'DIFÍCIL: Análise aprofundada, cenários reflexivos e distinção sutil entre conceitos detalhados no material fornecido.',
  }[difficulty]

  const typeFormatInstructions = {
    multiple_choice: 'Gere questões de MÚLTIPLA ESCOLHA com exatamente 4 alternativas distintas (A, B, C, D) por questão. Apenas 1 alternativa é correta (is_correct: true) e 3 são distratores verossímeis baseados no contexto do material.',
    true_false: 'Gere questões no formato VERDADEIRO OU FALSO. O enunciado deve ser uma assertiva extraída do material e haverá exatamente 2 opções: "Verdadeiro" e "Falso", com a correta indicada e a justificativa fundamentada no texto.',
    mixed: 'Gere uma mescla balanceada entre questões de Múltipla Escolha (4 opções) e Verdadeiro ou Falso (2 opções), todas rigorosamente embasadas no material didático.',
  }[questionType]

  const systemPrompt = `Você é o assistente pedagógico de avaliações do EstudaAí com ANCORAGEM ESTRITA AO MATERIAL DIDÁTICO (Strict Grounding - Estilo NotebookLM).
Sua missão é produzir uma avaliação/prova com OBRIGATORIAMENTE EXATAMENTE ${questionCount} QUESTÕES em Português do Brasil.

REGRA DE QUANTIDADE MANDATÓRIA (CRÍTICA):
- A lista "questions" no JSON DEVE CONTER OBRIGATORIAMENTE EXATAMENTE ${questionCount} QUESTÕES (nem mais, nem menos: questions.length === ${questionCount}).
- É expressamente PROIBIDO parar antes ou gerar menos de ${questionCount} questões! Se foram pedidas ${questionCount} questões, você DEVE gerar todas as ${questionCount} questões completas com seus respectivos enunciados, alternativas e justificativas.
- Caso o material didático seja conciso, explore diferentes nuances, detalhes pedagógicos, aplicações práticas e correlações conceituais dos tópicos ensinados no texto para atingir a meta exata de ${questionCount} questões sem sair do escopo do material.

DIRETRIZES FUNDAMENTAIS DE ANCORAGEM (NOTEBOOK LM STYLE):
1. ANCORAGEM AO CONTEÚDO (ZERO ALUCINAÇÃO):
   - Toda pergunta, alternativa correta e distratores devem ser embasados no conteúdo do material fornecido pelo professor.
   - NUNCA invente dados externos ou não mencionados no texto.

2. COBERTURA BALANCEADA DO TEXTO:
   - Distribua as ${questionCount} questões ao longo de todo o documento didático (início, meio e fim).

3. JUSTIFICATIVA PEDAGÓGICA (EXPLANATION):
   - No campo "explanation", explique sucintamente por que a alternativa correta é o gabarito referenciando o conceito do material.

4. FORMATO DAS ALTERNATIVAS:
   - Apenas 1 alternativa correta (is_correct = true) e as demais falsas.
   - Para Múltipla Escolha: exatamente 4 opções por questão.
   - Para Verdadeiro/Falso: exatamente 2 opções ("Verdadeiro" e "Falso").
   - NUNCA inclua prefixos como "A)", "B)", "1.", "Questão 1:" nos textos de enunciados ou opções.

5. NÍVEL DE DIFICULDADE: ${difficultyDesc}
6. TIPO REQUISITADO: ${typeFormatInstructions}`

  const userPrompt = `MATERIAL DIDÁTICO DO PROFESSOR (FONTE EXCLUSIVA):
======================================================================
Título: "${materialTitle}"
Conteúdo Didático:
"""
${trimmedContent}
"""
======================================================================

ORDEM DE EXECUÇÃO:
Elabore agora a avaliação com EXATAMENTE ${questionCount} QUESTÕES COMPLETAS de nível ${difficulty.toUpperCase()}.
Lembre-se: a lista 'questions' no JSON DEVE TER OBRIGATORIAMENTE ${questionCount} ITENS.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(GeneratedQuizResponseSchema, 'educational_quiz'),
      temperature: 0.3,
      max_completion_tokens: 8192,
    })

    const rawContent = completion.choices[0]?.message?.content

    if (!rawContent) {
      throw new Error('A IA não retornou conteúdo.')
    }

    const parsedJson = JSON.parse(rawContent)
    const validated = GeneratedQuizResponseSchema.parse(parsedJson)

    let allQuestions = [...validated.questions]

    // Garantia de quantidade: se o modelo retornar menos questões que o solicitado, complementa automaticamente
    if (allQuestions.length < questionCount) {
      const remainingNeeded = questionCount - allQuestions.length
      console.warn(`[Quiz Generator] IA retornou ${allQuestions.length} questões de ${questionCount}. Solicitando mais ${remainingNeeded} questões para completar...`)

      const existingTexts = allQuestions.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n')
      const supplementPrompt = `O professor solicitou ${questionCount} questões, mas você gerou apenas ${allQuestions.length}.
Gere agora mais EXATAMENTE ${remainingNeeded} questões complementares e diferentes das que você já gerou abaixo:
${existingTexts}

Baseie-se estritamente no mesmo material didático. Retorne o JSON com as ${remainingNeeded} novas questões.`

      try {
        const suppCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: rawContent },
            { role: 'user', content: supplementPrompt },
          ],
          response_format: zodResponseFormat(GeneratedQuizResponseSchema, 'educational_quiz_supplement'),
          temperature: 0.4,
          max_completion_tokens: 4096,
        })

        const suppRaw = suppCompletion.choices[0]?.message?.content
        if (suppRaw) {
          const suppParsed = JSON.parse(suppRaw)
          const suppValidated = GeneratedQuizResponseSchema.parse(suppParsed)
          if (suppValidated.questions && suppValidated.questions.length > 0) {
            allQuestions = allQuestions.concat(suppValidated.questions.slice(0, remainingNeeded))
          }
        }
      } catch (suppError) {
        console.error('[Quiz Generator] Falha ao buscar questões suplementares:', suppError)
      }
    }

    // Pós-processamento: higienização + embaralhamento aleatório (Fisher-Yates) das alternativas
    const sanitizedQuiz: GeneratedQuizResponse = {
      title: cleanHumanText(validated.title) || `Avaliação - ${materialTitle}`,
      summary: cleanHumanText(validated.summary || '') || `Avaliação gerada a partir do material "${materialTitle}" com ${allQuestions.length} questões.`,
      questions: allQuestions.map((q, idx: number) => {
        const cleanedOptions = q.options.map((opt) => ({
          option_text: cleanHumanText(opt.option_text),
          is_correct: Boolean(opt.is_correct),
        }))

        // Se for múltipla escolha, aplica embaralhamento adicional no backend para garantir 100% de aleatoriedade na ordem A, B, C, D
        const finalOptions = q.question_type === 'multiple_choice' || q.question_type === 'mixed'
          ? (cleanedOptions.length > 2 ? shuffleOptions(cleanedOptions) : cleanedOptions)
          : cleanedOptions

        return {
          question_text: cleanHumanText(q.question_text) || `Questão ${idx + 1}`,
          question_type: q.question_type,
          explanation: cleanHumanText(q.explanation || ''),
          options: finalOptions,
        }
      }),
    }

    return sanitizedQuiz
  } catch (error: any) {
    console.error('Erro na chamada do GPT-4o-mini:', error)
    throw new Error(`Falha ao gerar avaliação formatada: ${error.message}`)
  }
}

