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
Sua missão é produzir uma prova/quiz com exatamente ${questionCount} questões formuladas com redação acadêmica impecável, elegante e profissional em Português do Brasil.

DIRETRIZES FUNDAMENTAIS DE ANCORAGEM (NOTEBOOK LM STYLE):
1. ANCORAGEM ABSOLUTA (ZERO ALUCINAÇÃO):
   - Cada pergunta, assertiva, alternativa correta e distrator DEVE ser formulado e derivado ESTRITAMENTE do texto do material fornecido pelo professor.
   - NUNCA invente informações, não presuma dados externos e não use fatos que não constem no texto, mesmo que sejam de conhecimento geral.
   - Se o material não tratar de determinado assunto, NÃO crie questões sobre ele.

2. COBERTURA BALANCEADA DO TEXTO:
   - Distribua as questões por diferentes seções, conceitos e parágrafos do material didático (início, meio e fim do texto), garantindo uma avaliação completa e representativa do documento.

3. JUSTIFICATIVA PEDAGÓGICA COM CITAÇÃO (EXPLANATION):
   - No campo "explanation", explique detalhadamente por que a alternativa correta é o gabarito, referenciando e citando o trecho ou conceito do material didático que comprova a resposta.

4. QUALIDADE DAS ALTERNATIVAS E DISTRATORES:
   - Apenas 1 alternativa por questão deve ser verdadeira (is_correct = true).
   - Os distratores (respostas incorretas) devem ser plausíveis dentro do tema da aula, porém conceitualmente errados segundo o que foi explicado no texto base.

5. FORMATO LIMPO:
   - NUNCA inclua prefixos como "A)", "B)", "1.", "Questão 1:" ou "Pergunta:" nos textos de enunciados ou opções.
   - Para Múltipla Escolha: 4 opções claras.
   - Para Verdadeiro/Falso: 2 opções ("Verdadeiro" e "Falso").

6. NÍVEL DE DIFICULDADE: ${difficultyDesc}
7. FORMATO REQUISITADO: ${typeFormatInstructions}`

  const userPrompt = `MATERIAL DIDÁTICO DO PROFESSOR (FONTE EXCLUSIVA):
======================================================================
Título: "${materialTitle}"
Conteúdo Didático:
"""
${trimmedContent}
"""
======================================================================

Com base ESTRITAMENTE no conteúdo didático acima, elabore agora a avaliação com exatamente ${questionCount} questões de nível ${difficulty.toUpperCase()}.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(GeneratedQuizResponseSchema, 'educational_quiz'),
      temperature: 0.3, // Temperatura baixa para máxima fidelidade e ancoragem ao texto fonte
    })

    const rawContent = completion.choices[0]?.message?.content

    if (!rawContent) {
      throw new Error('A IA não retornou conteúdo.')
    }

    const parsedJson = JSON.parse(rawContent)
    const validated = GeneratedQuizResponseSchema.parse(parsedJson)

    // Pós-processamento: higienização + embaralhamento aleatório (Fisher-Yates) das alternativas
    const sanitizedQuiz: GeneratedQuizResponse = {
      title: cleanHumanText(validated.title) || `Avaliação - ${materialTitle}`,
      summary: cleanHumanText(validated.summary || '') || `Avaliação gerada a partir do material "${materialTitle}" com ${validated.questions.length} questões.`,
      questions: validated.questions.map((q, idx: number) => {
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

