import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, ArrowLeft, Check, Moon, Shield, Info, HardDrive, Bell, Globe, User } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function SettingsModal() {
  const { setScreen, userProfile, setUserProfile } = useAppStore()
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'General' | 'Display' | 'Privacy'
  const [usernameInput, setUsernameInput] = useState(userProfile.username || 'Guest User')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput }),
      })
      if (res.ok) {
        setUserProfile({ username: usernameInput })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const settingsCards = [
    { id: 'theme', title: 'Theme', desc: 'Dark Mode', category: 'Display', icon: Moon },
    { id: 'language', title: 'Language', desc: 'Bahasa Indonesia / English', category: 'General', icon: Globe },
    { id: 'notifications', title: 'Notifications', desc: 'On', category: 'General', icon: Bell },
    { id: 'storage', title: 'Data & Storage', desc: 'SQLite Local DB', category: 'General', icon: HardDrive },
    { id: 'account', title: 'Account', desc: userProfile.username || 'Guest', category: 'General', icon: User },
    { id: 'privacy', title: 'Privacy', desc: '100% Local Only / Secure', category: 'Privacy', icon: Shield },
    { id: 'about', title: 'About', desc: 'Firefly HSR v2.0', category: 'General', icon: Info },
  ]

  const filtered = settingsCards.filter((s) => {
    if (activeTab === 'All') return true
    return s.category === activeTab
  })

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[#070b14]/95 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <SettingsIcon className="text-[#fef08a]" size={24} />
          <div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Menu</div>
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">Settings</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-300">
            Options <span className="text-[#d9f99d] font-bold">{settingsCards.length}</span>
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
          {['All', 'General', 'Display', 'Privacy'].map((tab) => (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {filtered.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-[#0f172a]/90 hover:bg-[#131f38] border border-slate-700/60 flex flex-col justify-between min-h-[170px] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/60 text-slate-300">
                    <Icon size={24} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-0.5">{item.title}</h3>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Edit Profile Username */}
          <div className="max-w-xl p-6 rounded-2xl bg-[#0f172a]/90 border border-slate-700/80">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <User size={18} className="text-cyan-400" />
              Ubah Profil Pengguna
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Trailblazer (Username)
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-lime-500/20 active:scale-95 transition-all"
              >
                <Check size={16} />
                {saveSuccess ? 'Tersimpan!' : 'Update Profil'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
