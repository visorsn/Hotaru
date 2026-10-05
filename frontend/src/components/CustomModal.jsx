import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sliders, ArrowLeft, Check, Plus, Edit3, BookOpen } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function CustomModal() {
  const { setScreen, personaText, setPersonaText, fetchPersona } = useAppStore()
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Persona' | 'Prompts' | 'Voice Tone'
  const [isEditingPersona, setIsEditingPersona] = useState(false)
  const [editPersonaText, setEditPersonaText] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    fetchPersona()
  }, [])

  useEffect(() => {
    setEditPersonaText(personaText)
  }, [personaText])

  const handleSavePersona = async () => {
    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: editPersonaText }),
      })
      if (res.ok) {
        setPersonaText(editPersonaText)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        setIsEditingPersona(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const customItems = [
    { id: 'firefly_persona', title: 'Firefly Persona', desc: 'Active • Glamoth Iron Cavalry', category: 'Persona', active: true },
    { id: 'system_prompt', title: 'System Prompt', desc: 'story.txt', category: 'Prompts', active: false },
    { id: 'greeting_line', title: 'Greeting Line', desc: 'Default', category: 'Prompts', active: false },
    { id: 'speaking_tone', title: 'Speaking Tone', desc: 'Soft • Warm • Friendly', category: 'Voice Tone', active: true },
    { id: 'memory_notes', title: 'Memory Notes', desc: 'Oak Roll, Stargazing', category: 'Persona', active: false },
  ]

  const filtered = customItems.filter((item) => {
    if (activeTab === 'All') return true
    return item.category === activeTab
  })

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[#070b14]/95 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Sliders className="text-[#fef08a]" size={24} />
          <div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Menu</div>
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">Custom Persona</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-300">
            Presets <span className="text-[#d9f99d] font-bold">{customItems.length}</span>
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
          {['All', 'Persona', 'Prompts', 'Voice Tone'].map((tab) => (
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

        {/* Right Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div
              onClick={() => setIsEditingPersona(true)}
              className="p-6 rounded-2xl border-2 border-dashed border-lime-400/50 hover:border-lime-300 bg-lime-950/10 hover:bg-lime-950/20 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[180px] group"
            >
              <div className="w-12 h-12 rounded-full bg-lime-400/10 group-hover:bg-lime-400/20 flex items-center justify-center text-lime-300 mb-3 transition-colors">
                <Edit3 size={24} />
              </div>
              <h3 className="text-base font-bold text-lime-200">Edit Persona</h3>
              <p className="text-xs text-lime-300/70">Modify story.txt</p>
            </div>

            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setIsEditingPersona(true)}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[180px] ${
                  item.active
                    ? 'bg-[#15233d] border-2 border-lime-300 shadow-[0_0_20px_rgba(217,249,157,0.25)]'
                    : 'bg-[#0f172a]/90 hover:bg-[#131f38] border border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/60">
                    <Sliders className={item.active ? 'text-lime-300' : 'text-slate-300'} size={24} />
                  </div>
                  {item.active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 border border-lime-400/30 font-bold uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-0.5">{item.title}</h3>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Persona Prompt Editor Form */}
          <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-slate-700/80">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-cyan-400" />
              Live Persona Editor (`story.txt`)
            </h3>
            <textarea
              rows={12}
              value={editPersonaText}
              onChange={(e) => setEditPersonaText(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#070b14] border border-slate-700 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-400 selection:bg-purple-500/50"
              placeholder="Isi prompt persona Firefly..."
            />
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSavePersona}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-lime-500/20 active:scale-95 transition-all"
              >
                <Check size={16} />
                {saveSuccess ? 'Tersimpan!' : 'Simpan Persona Prompt'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
