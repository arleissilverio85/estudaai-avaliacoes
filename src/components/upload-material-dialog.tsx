'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { uploadAndProcessMaterial, ActionResponse } from '@/app/(dashboard)/teacher/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadCloud, FileText, X, Sparkles, FileSpreadsheet, FileCode, Presentation, School, AlertCircle } from 'lucide-react'

interface UploadMaterialDialogProps {
  classrooms?: { id: string; name: string }[]
  initialClassroomId?: string
}

export function UploadMaterialDialog({ classrooms = [], initialClassroomId }: UploadMaterialDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [classList, setClassList] = useState<{ id: string; name: string }[]>(classrooms)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroomId || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, formAction, isPending] = useActionState<ActionResponse, FormData>(
    uploadAndProcessMaterial,
    { success: undefined, error: undefined }
  )

  // Sempre sincronizar a lista de salas quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      const supabase = createClient()
      supabase
        .from('classrooms')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data }) => {
          const list = (data as { id: string; name: string }[]) || []
          setClassList(list)
          if (list.length > 0) {
            // Se não tem sala selecionada ou a que estava selecionada foi apagada
            if (!selectedClassroom || !list.some((c) => c.id === selectedClassroom)) {
              setSelectedClassroom(initialClassroomId && list.some((c) => c.id === initialClassroomId) ? initialClassroomId : list[0].id)
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
    }
  }, [state?.success])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
    if (ext === 'pptx' || ext === 'ppt') return <Presentation className="h-6 w-6 text-amber-400" />
    if (ext === 'txt' || ext === 'md') return <FileCode className="h-6 w-6 text-cyan-400" />
    return <FileText className="h-6 w-6 text-indigo-400" />
  }

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
                  <h3 className="text-lg font-bold text-white">Upload de Material Didático</h3>
                  <p className="text-xs text-slate-400">Vincule o arquivo a uma turma para a IA gerar a prova</p>
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

            <form action={formAction} className="mt-6 space-y-4">
              {state?.error && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {state.error}
                </div>
              )}

              {/* SELEÇÃO DINÂMICA DA SALA DE AULA VINCULADA */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-indigo-400" />
                  Escolher Turma / Sala de Aula *
                </label>
                {classList.length === 0 ? (
                  <div className="rounded-xl border border-amber-800/50 bg-amber-950/40 p-3 text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Nenhuma sala de aula ativa encontrada. Crie uma sala primeiro na aba &quot;Salas de Aula&quot;.</span>
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
                  placeholder="Ex: Apostila de Direito Administrativo - Sala B"
                />
              </div>

              <div>
                <Input
                  label="Descrição (Opcional)"
                  name="description"
                  placeholder="Ex: Conteúdo para a prova do 1º Bimestre"
                />
              </div>

              {/* SELEÇÃO DO ARQUIVO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Arquivo do Celular ou Computador *
                </label>

                <input
                  type="file"
                  name="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md"
                  className="hidden"
                  id="material-file-upload"
                  required
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                    selectedFile
                      ? 'border-indigo-500 bg-indigo-950/30'
                      : 'border-slate-700 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-950'
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      {getFileIcon(selectedFile.name)}
                      <div className="text-left">
                        <p className="text-sm font-bold text-white truncate max-w-xs">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="mx-auto h-8 w-8 text-indigo-400" />
                      <p className="text-sm font-semibold text-slate-200">
                        Toque para selecionar um arquivo do celular ou PC
                      </p>
                      <p className="text-xs text-slate-500">
                        Suporta PDF, Word (.docx), Slides (.pptx), Planilhas (.xlsx, .csv) e TXT (até 50MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

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
                  disabled={!selectedFile || classList.length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Enviar e Extrair Conteúdo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
