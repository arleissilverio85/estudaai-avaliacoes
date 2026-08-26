import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  School,
  UserCheck,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* BACKGROUND GLOW DECORATIONS */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-20 -right-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]" />

      {/* HEADER / NAVBAR DA LANDING */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/40">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Estuda<span className="text-indigo-400">Aí</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-300 hover:text-white">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" className="font-semibold shadow-md">
                Criar Conta
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* BADGE DESTAQUE */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-4 py-1.5 text-xs font-bold text-indigo-300 shadow-inner mb-6 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>Etapa 1: Fundação Arquitetural Ativa</span>
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
              Criação e Aplicação de Avaliações em Sala de Aula com{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
                Alta Performance
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              A plataforma educacional moderna para professores gerenciarem turmas e provas dinâmicas, e alunos acessarem avaliações com máxima praticidade.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold text-base px-8 shadow-xl shadow-indigo-600/30 hover:scale-[1.02]">
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5 ml-1.5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-base px-8 border-slate-700 hover:bg-slate-800/80">
                  Acessar Minha Conta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PROPOSTA DE VALOR POR PAPEL */}
        <section className="border-y border-slate-800/80 bg-slate-900/40 py-20 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Desenvolvido para Professores e Alunos
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Controle de acesso granular baseado em Row Level Security (RLS) no Supabase.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* CARD PROFESSOR */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/40 transition-all hover:border-indigo-500/50 hover:shadow-indigo-500/10">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md">
                    <School className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Para Professores</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Criação de salas com código de acesso único (ex: DIR4821)
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Gestão de turmas e visualização dos alunos matriculados
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Estruturação de materiais pedagógicos e avaliações
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Painel exclusivo e protegido contra acesso de outros docentes
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  <Link href="/register?role=teacher">
                    <Button variant="outline" className="w-full justify-center font-bold border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-300">
                      Cadastrar como Professor
                    </Button>
                  </Link>
                </div>
              </div>

              {/* CARD ALUNO */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/40 transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Para Alunos</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Entrada rápida na sala através do código da disciplina
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Acesso centralizado a todas as turmas em que está matriculado
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Visualização de provas e quizzes liberados pelo professor
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      Ambiente mobile-first limpo e focado no aprendizado
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  <Link href="/register?role=student">
                    <Button variant="outline" className="w-full justify-center font-bold border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-300">
                      Cadastrar como Aluno
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            EstudaAí © {new Date().getFullYear()} — Plataforma de Avaliações Educacionais.
          </p>
        </div>
      </footer>
    </div>
  )
}
