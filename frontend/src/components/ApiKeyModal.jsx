import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, ArrowLeft, Check, Plus, Cpu, Globe, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function ApiKeyModal() {
  const { setScreen, aiConfig, setAiConfig } = useAppStore()
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Connected' | 'Not Set'

  // Local state for editing Gemini & Ollama keys
  const [selectedProvider, setSelectedProvider] = useState(aiConfig.provider)
  const [geminiKeyInput, setGeminiKeyInput] = useState(aiConfig.geminiApiKey)
  const [geminiModelInput, setGeminiModelInput] = useState(aiConfig.geminiModel)
  const [ollamaUrlInput, setOllamaUrlInput] = useState(aiConfig.ollamaUrl)
  const [ollamaModelInput, setOllamaModelInput] = useState(aiConfig.ollamaModel)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = () => {
    setAiConfig({
      provider: selectedProvider,
      geminiApiKey: geminiKeyInput,
      geminiModel: geminiModelInput,
      ollamaUrl: ollamaUrlInput,
      ollamaModel: ollamaModelInput,
    })
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const providers = [
    {
      id: 'ollama',
      name: 'Local LLM (Ollama)',
      desc: ollamaModelInput || 'qwen2.5:3b',
      connected: true,
      isLocal: true,
      icon: Cpu,
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      desc: geminiKeyInput ? geminiModelInput : 'Tap to set up',
      connected: !!geminiKeyInput,
      icon: Sparkles,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      desc: 'Not Set',
      connected: false,
      icon: Globe,
    },
    {
      id: 'claude',
      name: 'Claude API',
      desc: 'Not Set',
      connected: false,
      icon: Globe,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      desc: 'Not Set',
      connected: false,
      icon: Globe,
    },
  ]

  const connectedCount = providers.filter((p) => p.connected).length

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[#070b14]/95 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Key className="text-[#fef08a]" size={24} />
          <div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Menu</div>
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">API Key & Providers</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-300">
            Connected <span className="text-[#d9f99d] font-bold">{connectedCount}/5</span>
          </div>
          <button
            onClick={() => setScreen('menu')}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600/60 flex items-center justify-center text-slate-200 hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Category Tabs */}
        <div className="w-64 p-6 border-r border-slate-800/80 flex flex-col gap-2">
          {['All', 'Connected', 'Not Set'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all flex items-center gap-3 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-lime-900/30 to-slate-800/80 border border-lime-400/60 text-[#d9f99d] shadow-[0_0_15px_rgba(217,249,157,0.15)]'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="w-2 h-2 rotate-45 border border-current" />
              {tab}
            </button>
          ))}
        </div>

        {/* Right Content Area: Cards Grid & Editor */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {providers
              .filter((p) => {
                if (activeTab === 'Connected') return p.connected
                if (activeTab === 'Not Set') return !p.connected
                return true
              })
              .map((p) => {
                const Icon = p.icon
                const isSelected = selectedProvider === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (p.id === 'ollama' || p.id === 'gemini') {
                        setSelectedProvider(p.id)
                      }
                    }}
                    className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[170px] ${
                      isSelected
                        ? 'bg-[#15233d] border-2 border-lime-300 shadow-[0_0_20px_rgba(217,249,157,0.25)]'
                        : 'bg-[#0f172a]/90 hover:bg-[#131f38] border border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/60">
                        <Icon className={isSelected ? 'text-lime-300' : 'text-slate-300'} size={24} />
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          p.connected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.connected ? 'Active / Ready' : 'Not Set'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white mb-0.5">{p.name}</h3>
                      <p className="text-xs text-slate-400 truncate">{p.desc}</p>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Configuration Form for Selected Provider */}
          <div className="max-w-2xl p-6 rounded-2xl bg-[#0f172a]/90 border border-slate-700/80">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Konfigurasi Provider: <span className="text-cyan-300 uppercase">{selectedProvider}</span>
            </h3>

            {selectedProvider === 'gemini' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Google Gemini API Key (dari Google AI Studio)
                  </label>
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Dapatkan gratis di https://aistudio.google.com/app/apikey
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Model Gemini
                  </label>
                  <select
                    value={geminiModelInput}
                    onChange={(e) => setGeminiModelInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm"
                  >
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Rekomendasi Cepat)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ollama Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={ollamaUrlInput}
                    onChange={(e) => setOllamaUrlInput(e.target.value)}
                    placeholder="http://localhost:11434/api/generate"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Model Ollama
                  </label>
                  <input
                    type="text"
                    value={ollamaModelInput}
                    onChange={(e) => setOllamaModelInput(e.target.value)}
                    placeholder="qwen2.5:3b"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Model yang direkomendasikan: qwen2.5:3b, qwen2.5:7b, atau llama3.2:3b.
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-lime-500/20 active:scale-95 transition-all"
              >
                <Check size={16} />
                {saveSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
