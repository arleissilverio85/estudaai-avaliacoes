import { createClient } from '@/lib/supabase/server'
import { BookOpen, Sparkles } from 'lucide-react'
import { UploadMaterialDialog } from '@/components/upload-material-dialog'
import { MaterialCard } from '@/components/material-card'
import { Material } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export default async function MaterialsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: materialsData } = await (supabase.from('materials') as any)
    .select('*')
    .eq('teacher_id', user?.id || '')
    .order('created_at', { ascending: false })

  const materials = (materialsData || []) as Material[]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Materiais de Estudo
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Envie PDFs, apresentações de slides, documentos Word ou planilhas para gerar avaliações automáticas por IA.
          </p>
        </div>
        <div>
          <UploadMaterialDialog />
        </div>
      </div>

      {/* AVISO DE FUNCIONALIDADE ATIVA */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-4 text-indigo-200 flex items-start gap-3 backdrop-blur-md">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 shrink-0 mt-0.5 border border-indigo-500/30">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-white">Base de Conhecimento para a IA</p>
          <p className="text-indigo-300/80 leading-relaxed">
            Ao enviar um arquivo pelo celular ou computador, o sistema extrai e indexa seu conteúdo automaticamente. Em seguida, na aba <strong>Avaliações</strong>, a IA (GPT-4o-mini) consultará estritamente estes materiais para formular questões com gabarito e justificativa.
          </p>
        </div>
      </div>

      {/* LISTAGEM DE MATERIAIS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Seus Materiais</h2>
          <span className="text-xs font-semibold text-slate-400">
            {materials.length} {materials.length === 1 ? 'material cadastrado' : 'materiais cadastrados'}
          </span>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">Nenhum material enviado ainda</h3>
            <p className="mt-1 max-w-sm mx-auto text-xs text-slate-400">
              Envie um arquivo PDF, Word, Slide ou TXT para alimentar o gerador inteligente de avaliações.
            </p>
            <div className="mt-6">
              <UploadMaterialDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
