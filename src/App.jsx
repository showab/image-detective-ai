import React, { useState, useRef, useEffect } from 'react'
import { Upload, Loader2, Image as ImageIcon, Film, Music, Globe, User, Package, MapPin, HelpCircle, Sparkles, History, Trash2, ExternalLink, Copy, Check, AlertCircle, Search, X, Camera, Key } from 'lucide-react'
import { analyzeImage, hasApiKey } from './openai-client.js'

const ACCENT = { lilac: '#B8A9E8', amber: '#F5A623', teal: '#4ECDC4', coral: '#FF6B6B', green: '#4ADE80', ink: '#1A1A1A' }

const TYPE_META = {
  movie:   { icon: Film,       color: ACCENT.coral,  text: '#DC2626', label: 'Movie / Show' },
  song:    { icon: Music,      color: ACCENT.lilac,  text: '#5B21B6', label: 'Song / Music' },
  website: { icon: Globe,      color: ACCENT.teal,   text: '#115E59', label: 'Website / App' },
  person:  { icon: User,       color: ACCENT.amber,  text: '#92400E', label: 'Person' },
  product: { icon: Package,    color: ACCENT.green,  text: '#166534', label: 'Product' },
  place:   { icon: MapPin,     color: ACCENT.teal,   text: '#115E59', label: 'Place' },
  other:   { icon: Sparkles,   color: ACCENT.lilac,  text: '#5B21B6', label: 'Other' },
  unknown: { icon: HelpCircle, color: '#9B9B9B',     text: '#6B6B6B', label: 'Unknown' }
}

const HISTORY_KEY = 'idai_history_v1'
const safe = v => String(v ?? '').trim()

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 200))) } catch {}
}

export default function App() {
  const [history, setHistory] = useState(loadHistory())
  const [activeTab, setActiveTab] = useState('search')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => saveHistory(history), [history])

  async function processFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG, WebP…)'); return }
    if (!hasApiKey) { setError('OpenAI API key missing. Add VITE_OPENAI_API_KEY to your .env file and restart the dev server.'); return }

    setError(''); setResult(null); setBusy(true); setPhase('reading'); setFileName(file.name)

    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = e => resolve(String(e.target?.result || ''))
      r.onerror = reject
      r.readAsDataURL(file)
    })
    setPreviewUrl(dataUrl)
    setPhase('analyzing')

    try {
      const parsed = await analyzeImage(dataUrl)
      setResult(parsed)
      const entry = {
        id: Date.now(),
        image_url: dataUrl,
        type: safe(parsed.type) || 'unknown',
        title: safe(parsed.title) || 'Untitled',
        description: safe(parsed.description),
        details: parsed.details || [],
        sources: parsed.sources || [],
        created_at: new Date().toISOString()
      }
      setHistory(prev => [entry, ...prev])
    } catch (e) {
      setError(String(e?.message || e || 'Analysis failed'))
    } finally {
      setBusy(false); setPhase('')
    }
  }

  function handleFileInput(e) { const f = e.target.files?.[0]; if (f) processFile(f) }
  function handleDrop(e) { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }

  useEffect(() => {
    const onPaste = e => {
      for (const it of e.clipboardData?.items || []) {
        if (it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) { processFile(f); return } }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  function reset() {
    setPreviewUrl(''); setFileName(''); setResult(null); setError(''); setBusy(false); setPhase('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function copyTitle() {
    if (!result?.title) return
    try { await navigator.clipboard.writeText(result.title); setCopied(true); setTimeout(() => setCopied(false), 1200) } catch {}
  }

  function deleteEntry(id) { setHistory(prev => prev.filter(h => h.id !== id)) }
  function clearAll() { if (confirm('Clear all search history?')) setHistory([]) }

  const stats = [
    { l: 'Total', v: history.length, i: Search, c: ACCENT.lilac },
    { l: 'Movies', v: history.filter(h => h.type === 'movie').length, i: Film, c: ACCENT.coral },
    { l: 'Songs', v: history.filter(h => h.type === 'song').length, i: Music, c: ACCENT.amber },
    { l: 'Websites', v: history.filter(h => h.type === 'website').length, i: Globe, c: ACCENT.teal }
  ]

  const tabs = [
    { id: 'search', label: 'Identify', icon: Sparkles },
    { id: 'history', label: 'History', icon: History }
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#F0F0F0]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[#1A1A1A] tracking-tight">Image Detective AI</h1>
              <p className="text-[11px] text-[#9B9B9B] mt-0.5">Identify movies, songs, websites & more from any image</p>
            </div>
            {!hasApiKey && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-semibold bg-[#FF6B6B]/10 text-[#DC2626] border-[#FF6B6B]/20">
                <Key size={10} /> API key missing
              </span>
            )}
          </div>
          <div className="flex gap-1 mt-5 bg-[#F0F0F0]/60 rounded-full p-1 w-fit">
            {tabs.map(t => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${active ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'}`}>
                  <Icon size={14} />{t.label}
                  {t.id === 'history' && history.length > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#B8A9E8]/15 text-[#5B21B6] font-semibold">{history.length}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <div key={activeTab} className="animate-[fadeIn_300ms_ease-out]">
          {activeTab === 'search' && (
            <div className="space-y-6">
              {!hasApiKey && (
                <div className="bg-white rounded-2xl border border-[#F5A623]/30 p-5">
                  <h3 className="text-sm font-semibold text-[#92400E] flex items-center gap-2 mb-2">
                    <Key size={14} /> Setup required
                  </h3>
                  <p className="text-sm text-[#6B6B6B] mb-3">Add your OpenAI API key to a <code className="px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#1A1A1A] text-xs font-mono">.env</code> file at the project root:</p>
                  <pre className="text-[11px] bg-[#FAFAF8] border border-[#F0F0F0] rounded-lg p-3 overflow-x-auto text-[#1A1A1A]">VITE_OPENAI_API_KEY=sk-your-key-here</pre>
                  <p className="text-[11px] text-[#9B9B9B] mt-2">Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline text-[#5B21B6]">platform.openai.com/api-keys</a>, then restart <code className="text-xs">npm run dev</code>.</p>
                </div>
              )}

              {!previewUrl && !result && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`bg-white rounded-2xl border-2 border-dashed p-12 md:p-16 text-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-[#B8A9E8] bg-[#B8A9E8]/5' : 'border-[#E0E0E0] hover:border-[#B8A9E8] hover:bg-[#FAFAF8]'}`}
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: ACCENT.lilac + '15' }}>
                    <Camera size={28} style={{ color: ACCENT.lilac }} />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Upload an image</h3>
                  <p className="text-sm text-[#6B6B6B] mb-1">Movie scene, album cover, website screenshot, product — anything</p>
                  <p className="text-[11px] text-[#9B9B9B]">Click, drag &amp; drop, or paste with <kbd className="px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#1A1A1A] text-[10px] font-mono">Ctrl+V</kbd></p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['movie', 'song', 'website', 'person', 'product', 'place'].map(k => {
                      const M = TYPE_META[k]; const Icon = M.icon
                      return (
                        <span key={k} className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium"
                          style={{ backgroundColor: M.color + '15', color: M.text, borderColor: M.color + '33' }}>
                          <Icon size={10} /> {M.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {(busy || previewUrl) && (
                <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/5 bg-[#FAFAF8] p-5 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#F0F0F0]">
                      {previewUrl ? <img src={previewUrl} alt="preview" className="max-w-full max-h-80 rounded-xl object-contain" /> : <ImageIcon size={48} className="text-[#E0E0E0]" />}
                    </div>
                    <div className="flex-1 p-6">
                      {busy && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-[#B8A9E8]" />
                            <span className="text-sm font-semibold text-[#1A1A1A]">
                              {phase === 'reading' ? 'Reading image…' : 'AI is analyzing…'}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className={`flex items-center gap-2 ${phase !== '' ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${phase === 'analyzing' ? 'bg-[#4ADE80]/20' : phase === 'reading' ? 'bg-[#B8A9E8]/20' : 'bg-[#F0F0F0]'}`}>
                                {phase === 'analyzing' ? <Check size={10} className="text-[#166534]" /> : phase === 'reading' ? <Loader2 size={10} className="animate-spin text-[#5B21B6]" /> : null}
                              </div>
                              Reading image
                            </div>
                            <div className={`flex items-center gap-2 ${phase === 'analyzing' ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${phase === 'analyzing' ? 'bg-[#B8A9E8]/20' : 'bg-[#F0F0F0]'}`}>
                                {phase === 'analyzing' ? <Loader2 size={10} className="animate-spin text-[#5B21B6]" /> : null}
                              </div>
                              GPT-4o Vision analysis
                            </div>
                          </div>
                          <p className="text-[11px] text-[#9B9B9B] pt-2">Usually 5-15 seconds…</p>
                        </div>
                      )}

                      {!busy && result && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const M = TYPE_META[result.type] || TYPE_META.unknown
                              const Icon = M.icon
                              return (
                                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide"
                                  style={{ backgroundColor: M.color + '1A', color: M.text, borderColor: M.color + '33' }}>
                                  <Icon size={11} /> {M.label}
                                </span>
                              )
                            })()}
                            {result.confidence && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0F0] text-[#6B6B6B] font-medium uppercase tracking-wide">
                                {result.confidence} confidence
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-start gap-2">
                              <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight flex-1">{safe(result.title) || 'Untitled'}</h2>
                              <button onClick={copyTitle} className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors" title="Copy title">
                                {copied ? <Check size={13} className="text-[#4ADE80]" /> : <Copy size={13} className="text-[#6B6B6B]" />}
                              </button>
                            </div>
                            {result.description && <p className="text-sm text-[#6B6B6B] mt-1.5 leading-relaxed">{safe(result.description)}</p>}
                          </div>
                          {Array.isArray(result.details) && result.details.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              {result.details.map((d, i) => (
                                <div key={i} className="min-w-0">
                                  <p className="text-[10px] text-[#9B9B9B] font-medium uppercase tracking-wide">{safe(d.label)}</p>
                                  <p className="text-sm text-[#1A1A1A] font-medium truncate mt-0.5">{safe(d.value) || '—'}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {result.reasoning && (
                            <div className="text-[11px] text-[#6B6B6B] bg-[#FAFAF8] border border-[#F0F0F0] rounded-xl p-3 flex gap-2">
                              <Sparkles size={11} className="text-[#F5A623] shrink-0 mt-0.5" />
                              <span>{safe(result.reasoning)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!busy && result && Array.isArray(result.sources) && result.sources.length > 0 && (
                    <div className="border-t border-[#F0F0F0] p-6">
                      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                        <Globe size={14} className="text-[#4ECDC4]" /> Where to find it
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.sources.map((s, i) => (
                          <a key={i} href={safe(s.url)} target="_blank" rel="noopener noreferrer"
                            className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[#F0F0F0] hover:border-[#B8A9E8]/40 hover:bg-[#FAFAF8] transition-all duration-200">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{safe(s.name) || 'Source'}</p>
                              <p className="text-[11px] text-[#9B9B9B] truncate">{safe(s.url)}</p>
                            </div>
                            <ExternalLink size={13} className="text-[#9B9B9B] group-hover:text-[#B8A9E8] shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {(result || error) && !busy && (
                    <div className="border-t border-[#F0F0F0] px-6 py-4 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#9B9B9B] truncate">{fileName}</span>
                      <button onClick={reset} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B8A9E8] text-[#1A1A1A] hover:bg-[#A89AD8] shadow-sm hover:shadow-md text-sm font-medium transition-all duration-200">
                        <Camera size={13} /> New image
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-white rounded-2xl border border-[#FF6B6B]/30 p-4 flex items-start gap-2">
                  <AlertCircle size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#DC2626]">Error</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{error}</p>
                  </div>
                  <button onClick={() => setError('')} className="p-1 rounded hover:bg-[#F0F0F0]"><X size={13} className="text-[#6B6B6B]" /></button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                  const Icon = s.i
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-[#F0F0F0] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.c + '15' }}>
                          <Icon size={14} style={{ color: s.c }} />
                        </div>
                        <span className="text-2xl font-bold text-[#1A1A1A]">{s.v}</span>
                      </div>
                      <p className="text-[11px] text-[#9B9B9B] font-medium">{s.l}</p>
                    </div>
                  )
                })}
              </div>

              <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <History size={14} className="text-[#B8A9E8]" /> Recent searches
                  </h3>
                  {history.length > 0 && (
                    <button onClick={clearAll} className="text-[11px] text-[#DC2626] hover:underline font-medium flex items-center gap-1">
                      <Trash2 size={11} /> Clear all
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-16">
                    <History size={28} className="mx-auto mb-3 text-[#E0E0E0]" />
                    <p className="text-sm text-[#9B9B9B]">No searches yet</p>
                    <button onClick={() => setActiveTab('search')} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B8A9E8] text-[#1A1A1A] hover:bg-[#A89AD8] text-sm font-medium transition-all duration-200">
                      <Camera size={13} /> Upload first image
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0F0F0]">
                    {history.map(h => {
                      const M = TYPE_META[h.type] || TYPE_META.unknown
                      const Icon = M.icon
                      return (
                        <div key={h.id} className="p-4 hover:bg-[#FAFAF8] transition-colors duration-150">
                          <div className="flex items-start gap-4">
                            <img src={h.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-[#F0F0F0] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
                                  style={{ backgroundColor: M.color + '1A', color: M.text, borderColor: M.color + '33' }}>
                                  <Icon size={9} /> {M.label}
                                </span>
                                <span className="text-[10px] text-[#9B9B9B]">{h.created_at ? new Date(h.created_at).toLocaleString() : ''}</span>
                              </div>
                              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{safe(h.title) || 'Untitled'}</p>
                              {h.description && <p className="text-[11px] text-[#6B6B6B] mt-1 line-clamp-2">{safe(h.description)}</p>}
                              {h.sources?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {h.sources.slice(0, 4).map((s, i) => (
                                    <a key={i} href={safe(s.url)} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0F0] hover:bg-[#B8A9E8]/15 text-[#1A1A1A] font-medium transition-colors">
                                      <ExternalLink size={9} /> {safe(s.name) || 'Link'}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={() => deleteEntry(h.id)} className="p-1.5 rounded-lg hover:bg-[#FF6B6B]/10 transition-colors shrink-0" title="Delete">
                              <Trash2 size={12} className="text-[#DC2626]" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-[11px] text-[#9B9B9B]">
          Developed by <a href="https://github.com/showab" target="_blank" rel="noreferrer" className="text-[#5B21B6] hover:underline font-medium">Showab Ahammad</a> · MIT License
        </footer>
      </div>
    </div>
  )
}
