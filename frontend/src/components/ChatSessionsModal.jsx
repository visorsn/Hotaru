import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, ArrowLeft, Plus, Pin, Trash2, Archive } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function ChatSessionsModal() {
  const {
    setScreen,
    sessions,
    activeSessionId,
    setActiveSessionId,
    fetchSessions,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Recent' | 'Pinned' | 'Archived'

  const handleCreateNew = async () => {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        await fetchSessions()
        setActiveSessionId(data.id)
        setScreen('chat')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      await fetchSessions()
    } catch (e) {
      console.error(e)
    }
  }

  const handleTogglePin = async (id, currentPinned, e) => {
    e.stopPropagation()
    try {
      await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !currentPinned }),
      })
      await fetchSessions()
    } catch (e) {
      console.error(e)
    }
  }

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'Pinned') return s.pinned
    if (activeTab === 'Archived') return s.archived
    return true
  })

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[#070b14]/95 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-[#fef08a]" size={24} />
          <div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Menu</div>
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">Chat Sessions</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-300">
            Sessions <span className="text-[#d9f99d] font-bold">{sessions.length}</span>
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
          {['All', 'Recent', 'Pinned', 'Archived'].map((tab) => (
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

        {/* Right Grid Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Create New Chat Card */}
            <div
              onClick={handleCreateNew}
              className="p-6 rounded-2xl border-2 border-dashed border-lime-400/50 hover:border-lime-300 bg-lime-950/10 hover:bg-lime-950/20 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[190px] group"
            >
              <div className="w-12 h-12 rounded-full bg-lime-400/10 group-hover:bg-lime-400/20 flex items-center justify-center text-lime-300 mb-3 transition-colors">
                <Plus size={26} />
              </div>
              <h3 className="text-base font-bold text-lime-200">New Chat</h3>
              <p className="text-xs text-lime-300/70">Start a conversation</p>
            </div>

            {/* Session Cards */}
            {filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id)
                    setScreen('chat')
                  }}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[190px] relative group ${
                    isActive
                      ? 'bg-[#15233d] border-2 border-lime-300 shadow-[0_0_20px_rgba(217,249,157,0.25)]'
                      : 'bg-[#0f172a]/90 hover:bg-[#131f38] border border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/60">
                      <MessageSquare className={isActive ? 'text-lime-300' : 'text-slate-300'} size={24} />
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleTogglePin(s.id, s.pinned, e)}
                        className={`p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 ${
                          s.pinned ? 'text-amber-300' : ''
                        }`}
                        title="Pin chat"
                      >
                        <Pin size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 line-clamp-2">
                      {s.title || 'Percakapan baru'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {s.pinned ? 'Pinned' : isActive ? 'Active now' : 'Saved'}
                    </p>
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
