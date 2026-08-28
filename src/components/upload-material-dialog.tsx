'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { uploadAndProcessMaterial, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Presentation,
  School,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  AlignLeft,
} from 'lucide-react'

interface UploadMaterialDialogProps {
  classrooms?: { id: string; name: string }[]
  initialClassroomId?: string
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export function UploadMaterialDialog({ classrooms = [], initialClassroomId }: UploadMaterialDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [classList, setClassList] = useState<{ id: string; name: string }[]>(classrooms)
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState<string>('')
  const [fileSizeError, setFileSizeError] = useState<string | null>(null)
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroomId || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    uploadAndProcessMaterial,
    { success: undefined, error: undefined }
  )

  // Sempre sincronizar a lista de salas quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setFileSizeError(null)
      const supabase = createClient()
      supabase
        .from('classrooms')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data }) => {
          const list = (data as { id: string; name: string }[]) || []
          setClassList(list)
          if (list.length > 0) {
            if (!selectedClassroom || !list.some((c) => c.id === selectedClassroom)) {
              setSelectedClassroom(
                initialClassroomId && list.some((c) => c.id === initialClassroomId)
                  ? initialClassroomId
                  : list[0].id
              )
            }
          } else {
            setSelectedClassroom('')
          }
        })
    }
  }, [isOpen, initialClassroomId, selectedClassroom])

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
      setSelectedFile(null)
      setPastedText('')
      setFileSizeError(null)
    }
  }, [state?.success])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSizeError(null)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileSizeError(
          `O arquivo selecionado tem ${(file.size / (1024 * 1024)).toFixed(1)} MB. O tamanho máximo permitido é de 10 MB.`
        )
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      setSelectedFile(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv')
      return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
    if (ext === 'pptx' || ext === 'ppt')
      return <Presentation className="h-6 w-6 text-amber-400" />
    if (ext === 'txt' || ext === 'md')
      return <FileCode className="h-6 w-6 text-cyan-400" />
    return <FileText className="h-6 w-6 text-indigo-400" />
  }

  const wordCount = pastedText.trim().length > 0 ? pastedText.trim().split(/\s+/).length : 0

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="md"
        className="font-bold shadow-lg shadow-indigo-600/30"
      >
        <UploadCloud className="h-4 w-4 mr-1.5" />
        Enviar Novo Material
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 shadow-2xl border border-slate-800 sm:p-8 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cadastrar Material Didático</h3>
                  <p className="text-xs text-slate-400">Vincule o conteúdo à turma para a IA gerar a prova com base nele</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SELETOR DE MODO: ARQUIVO OU TEXTO */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/80 p-1.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                  uploadMode === 'file'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UploadCloud className="h-4 w-4" />
                Upload de Arquivo
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                  uploadMode === 'text'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignLeft className="h-4 w-4" />
                Colar / Digitar Texto
              </button>
            </div>

            {/* DICA PEDAGÓGICA */}
            <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 text-xs text-indigo-200 flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-indigo-300">💡 Ancoragem Estrita (Estilo NotebookLM):</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  A IA lerá o texto do material e formulará perguntas, gabarito e justificativas baseados <strong>exclusivamente nas informações deste documento</strong>, sem alucinações.
                </p>
              </div>
            </div>

            <form action={formAction} className="mt-4 space-y-4">
              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {state.error}
                </div>
              )}

              {fileSizeError && (
                <div className="rounded-xl border border-amber-800/60 bg-amber-950/60 p-3 text-xs font-semibold text-amber-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{fileSizeError}</span>
                </div>
              )}

              {/* SELEÇÃO DA SALA DE AULA */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-indigo-400" />
                  Escolher Turma / Sala de Aula *
                </label>
                {classList.length === 0 ? (
                  <div className="rounded-xl border border-amber-800/50 bg-amber-950/40 p-3 text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Nenhuma sala de aula ativa encontrada. Crie uma sala primeiro.</span>
                  </div>
                ) : (
                  <select
                    name="classroom_id"
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {classList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Input
                  label="Título do Material *"
                  name="title"
                  required
                  placeholder="Ex: Aula 03 - Direitos Fundamentais"
                />
              </div>

              <div>
                <Input
                  label="Descrição Breve (Opcional)"
                  name="description"
                  placeholder="Ex: Conteúdo trabalhado na aula de hoje"
                />
              </div>

              {/* MODO 1: UPLOAD DE ARQUIVO */}
              {uploadMode === 'file' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Arquivo da Aula (PDF, Word, Slides, Planilha ou TXT) *
                  </label>

                  <input
                    type="file"
                    name="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md"
                    className="hidden"
                    id="material-file-upload"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                      selectedFile
                        ? 'border-emerald-500 bg-emerald-950/20'
                        : 'border-slate-700 bg-slate-950/60 hover:border-indigo-500/50 hover:bg-slate-950'
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        {getFileIcon(selectedFile.name)}
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-white truncate max-w-xs">{selectedFile.name}</p>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                          <p className="text-xs text-emerald-400 font-mono font-semibold">
                            {formatFileSize(selectedFile.size)} • Pronto para extração
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UploadCloud className="mx-auto h-8 w-8 text-indigo-400" />
                        <p className="text-sm font-semibold text-slate-200">
                          Clique para selecionar o arquivo da aula
                        </p>
                        <p className="text-xs text-slate-400">
                          PDF, Word (.docx), Slides (.pptx), Planilhas (.xlsx) ou TXT (Até 10 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODO 2: TEXTO OU RESUMO DIRETO */}
              {uploadMode === 'text' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Texto Didático / Resumo da Aula *
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {wordCount} palavras • {pastedText.length} caracteres
                    </span>
                  </div>
                  <textarea
                    name="content_text"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={7}
                    required={uploadMode === 'text'}
                    placeholder="Cole aqui o texto completo da aula, capítulo de livro, anotações de aula ou resumo que a IA usará para formular as questões..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none font-mono leading-relaxed"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPending}
                  disabled={
                    classList.length === 0 ||
                    (uploadMode === 'file' && !selectedFile) ||
                    (uploadMode === 'text' && pastedText.trim().length < 20)
                  }
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {isPending ? 'Indexando Material...' : 'Salvar e Indexar para IA'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

