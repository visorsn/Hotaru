import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function GalleryModal() {
  const { setScreen, avatarList, activeAvatar, setActiveAvatar } = useAppStore()
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Avatars' | 'Scenes' | 'Saved'

  const filtered = avatarList.filter((a) => {
    if (activeTab === 'All') return true
    return a.category === activeTab
  })

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[#070b14]/95 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <LayoutGrid className="text-[#fef08a]" size={24} />
          <div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Menu</div>
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">Gallery & Switch Char</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-300">
            Images <span className="text-[#d9f99d] font-bold">{avatarList.length}/8</span>
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
          {['All', 'Avatars', 'Scenes', 'Saved'].map((tab) => (
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
              const isActive = activeAvatar === item.image
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveAvatar(item.image)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-end aspect-[3/4] group ${
                    isActive
                      ? 'ring-2 ring-lime-300 shadow-[0_0_25px_rgba(217,249,157,0.3)]'
                      : 'border border-slate-700/60 hover:border-slate-500'
                  }`}
                >
                  <img
                    src={item.cardImg}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-[#0d1424]/40 to-transparent" />

                  {isActive && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-lime-400 text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <Check size={12} /> Active
                    </div>
                  )}

                  <div className="relative z-10 p-4">
                    <h3 className="text-base font-bold text-white mb-0.5">{item.name}</h3>
                    <p className="text-xs text-slate-400">{item.category}</p>
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
