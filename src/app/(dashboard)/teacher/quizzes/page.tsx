import { createClient } from '@/lib/supabase/server'
import { FileCheck, Sparkles } from 'lucide-react'
import { CreateQuizForm } from '@/components/create-quiz-form'
import { QuizCard } from '@/components/quiz-card'
import { GenerateQuizAiDialog } from '@/components/generate-quiz-ai-dialog'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ classroom_id?: string }>
}

export default async function TeacherQuizzesPage({ searchParams }: Props) {
  const { classroom_id } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Buscar todas as salas do professor
  const { data: classroomsData } = await (supabase.from('classrooms') as any)
    .select('id, name')
    .eq('teacher_id', user?.id || '')
    .order('name', { ascending: true })

  const classrooms = (classroomsData || []).map((c: any) => ({
    id: c.id as string,
    name: c.name as string,
  }))

  // 2. Buscar materiais do professor
  const { data: materialsData } = await (supabase.from('materials') as any)
    .select('id, title, file_name')
    .eq('teacher_id', user?.id || '')
    .order('title', { ascending: true })

  const materials = (materialsData || []).map((m: any) => ({
    id: m.id as string,
    title: m.title as string,
    file_name: m.file_name as string | null,
  }))

  // 3. Buscar avaliações com histórico de tentativas
  const { data: quizzesData } = await (supabase.from('quizzes') as any)
    .select(`
      *,
      classrooms:classroom_id (
        name
      ),
      attempts (count)
    `)
    .eq('teacher_id', user?.id || '')
    .order('created_at', { ascending: false })

  const quizzes = (quizzesData || []) as any[]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Avaliações e Provas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gere avaliações com IA baseadas em seus materiais didáticos ou crie manualmente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateQuizAiDialog
            classrooms={classrooms}
            materials={materials}
            initialClassroomId={classroom_id}
          />
        </div>
      </div>

      {/* AVISO DO GERADOR INTELIGENTE */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-4 text-indigo-200 flex items-start gap-3 backdrop-blur-md">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 shrink-0 mt-0.5 border border-indigo-500/30">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-white">Geração de Questões com GPT-4o-mini</p>
          <p className="text-indigo-300/80 leading-relaxed">
            Clique no botão <strong>Gerar Prova com IA</strong> acima para criar entre 5 e 15 questões (Múltipla Escolha ou Verdadeiro/Falso) com gabarito e justificativa pedagógica, utilizando exclusivamente o material que você enviou.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO MANUAL OU ALTERNATIVO */}
      <CreateQuizForm classrooms={classrooms} initialClassroomId={classroom_id} />

      {/* LISTA DE AVALIAÇÕES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Histórico de Avaliações</h2>
          <span className="text-xs font-semibold text-slate-400">
            {quizzes.length} {quizzes.length === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">Nenhuma avaliação cadastrada</h3>
            <p className="mt-1 text-xs text-slate-400">
              Gere uma avaliação com IA acima ou crie um rascunho manual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} classrooms={classrooms} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
