import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, ArrowLeft, Check, Mic, Music, VolumeX } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function AudioModal() {
  const { setScreen, audioConfig, setAudioConfig } = useAppStore()
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Voice' | 'Music' | 'Effects'

  const audioOptions = [
    { id: 'jp_voice', title: 'Firefly JP', desc: 'Voice • Active', category: 'Voice', active: audioConfig.voice === 'Firefly JP' },
    { id: 'eng_voice', title: 'Firefly Eng', desc: 'Voice • RVC v2', category: 'Voice', active: audioConfig.voice === 'Firefly Eng' },
    { id: 'bgm_1', title: 'Firefly Theme', desc: 'Music • Penacony OST', category: 'Music', active: true },
    { id: 'bgm_2', title: 'Starlit Piano', desc: 'Music • Relaxing', category: 'Music', active: false },
    { id: 'fx_hum', title: 'Ambient Hum', desc: 'Effects', category: 'Effects', active: audioConfig.ambientHum },
    { id: 'fx_chime', title: 'Message Chime', desc: 'Effects', category: 'Effects', active: audioConfig.messageChime },
  ]

  const filtered = audioOptions.filter((o) => {
    if (activeTab === 'All') return true
    return o.category === activeTab
  })

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[#070b14]/95 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Volume2 className="text-[#fef08a]" size={24} />
          <div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Menu</div>
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">Audio & Voice</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-300">
            Tracks <span className="text-[#d9f99d] font-bold">6/12</span>
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
          {['All', 'Voice', 'Music', 'Effects'].map((tab) => (
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

        {/* Right Cards Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {filtered.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.category === 'Voice') {
                      setAudioConfig({ voice: item.title })
                    }
                  }}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[180px] ${
                    item.active
                      ? 'bg-[#15233d] border-2 border-lime-300 shadow-[0_0_20px_rgba(217,249,157,0.25)]'
                      : 'bg-[#0f172a]/90 hover:bg-[#131f38] border border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/60">
                      <Volume2 className={item.active ? 'text-lime-300' : 'text-slate-300'} size={24} />
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
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
