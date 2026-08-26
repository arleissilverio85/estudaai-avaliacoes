import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatMaterialStatus } from '@/lib/utils'
import { BookOpen, FileText, Info } from 'lucide-react'
import { CreateMaterialForm } from '@/components/create-material-form'
import { Material } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export default async function MaterialsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: materialsData } = await supabase
    .from('materials')
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
            Estrutura base para futuro suporte a RAG, PDFs, documentos e geração automática de questões.
          </p>
        </div>
      </div>

      {/* AVISO INFORMATIVO DA ETAPA 1 */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-4 text-indigo-200 flex items-start gap-3 backdrop-blur-md">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-white">Fundação Estrutural (Etapa 1)</p>
          <p className="text-indigo-300/80 leading-relaxed">
            Nesta etapa, o upload de arquivos e embeddings por IA ainda não estão ativos.
            A estrutura de banco de dados e os status (<span className="font-mono font-semibold text-indigo-300">pending</span>, <span className="font-mono font-semibold text-indigo-300">processing</span>, <span className="font-mono font-semibold text-indigo-300">ready</span>, <span className="font-mono font-semibold text-indigo-300">error</span>) já estão totalmente modelados para as próximas etapas.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO ESTRUTURAL */}
      <CreateMaterialForm />

      {/* LISTAGEM DE MATERIAIS */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Materiais Cadastrados</h2>

        {materials.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">Nenhum material registrado</h3>
            <p className="mt-1 text-xs text-slate-400">
              Cadastre um item acima para testar a persistência na tabela <span className="font-mono text-indigo-400">materials</span>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => {
              const statusInfo = formatMaterialStatus(m.processing_status)
              return (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold text-white">{m.title}</CardTitle>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {m.description && (
                      <CardDescription className="text-xs text-slate-400">{m.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5 font-mono text-slate-300">
                      <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      {m.file_name || 'arquivo.pdf'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Criado em {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
