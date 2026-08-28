'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Sparkles } from 'lucide-react'

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 1. Registro do Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Atualização em background se houver novo service worker
          reg.onupdatefound = () => {
            const installingWorker = reg.installing
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nova versão do EstudaAí disponível.')
                }
              }
            }
          }
        })
        .catch((err) => console.warn('Erro ao registrar Service Worker:', err))
    }

    // 2. Verificar se já está rodando em modo standalone (PWA instalado)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true)
      return
    }

    // 3. Capturar evento de instalação nativo no Android/Chrome/Edge/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 4. Detecção de iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)

    if (isIosDevice && isSafari) {
      setIsIos(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstallable(false)
        setDeferredPrompt(null)
      }
    } else if (isIos) {
      setShowIosTip(true)
    }
  }

  // Se já estiver instalado ou foi descartado nesta sessão
  if (isInstalled || isDismissed) {
    return null
  }

  // Apenas renderiza se for instalável via prompt ou se for iOS
  if (!isInstallable && !isIos) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-indigo-500/40 bg-slate-900/95 p-3.5 shadow-2xl shadow-indigo-600/30 backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 max-w-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40">
          <Smartphone className="h-6 w-6" />
        </div>

        <div className="flex-1 text-left">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            Instalar EstudaAí App
            <Sparkles className="h-3 w-3 text-indigo-400" />
          </p>
          <p className="text-[11px] text-slate-300 line-clamp-1">
            Acesse direto da tela inicial do celular ou PC
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Instalar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal explicativo para usuários de iOS Safari */}
      {showIosTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 shadow-2xl border border-slate-800 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Instalar no iPhone / iPad</h3>
              <button
                type="button"
                onClick={() => setShowIosTip(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>Para usar o <strong>EstudaAí</strong> como aplicativo no iOS:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima) na barra inferior do Safari.</li>
                <li>Role a lista para baixo e selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong>.</li>
                <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowIosTip(false)}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
