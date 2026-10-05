import React from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, Volume2, Key, Sliders, 
  Image as ImageIcon, Settings, LayoutGrid, 
  Bell, Camera, Power, X, MoreHorizontal, User
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function HSRPhoneMenu() {
  const { 
    userProfile, 
    setScreen, 
    activeAvatar, 
    activeScenery, 
    aiConfig 
  } = useAppStore()

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, screen: 'chat' },
    { id: 'audio', label: 'Audio', icon: Volume2, screen: 'audio' },
    { id: 'apikey', label: 'API Key', icon: Key, screen: 'apikey', badge: !aiConfig.geminiApiKey && aiConfig.provider === 'gemini' },
    { id: 'custom', label: 'Custom', icon: Sliders, screen: 'custom' },
    { id: 'scenery', label: 'Scenery', icon: ImageIcon, screen: 'scenery' },
    { id: 'settings', label: 'Settings', icon: Settings, screen: 'settings' },
    { id: 'gallery', label: 'Character', icon: LayoutGrid, screen: 'gallery', badge: true },
  ]

  const expPercentage = Math.min(100, Math.round((userProfile.bond_exp / (userProfile.bond_max_exp || 450)) * 100))

  return (
    <div className="relative w-full h-screen overflow-hidden flex select-none bg-[#070b14]">
      {/* Background Scenery with ambient tint */}
      <img 
        src={activeScenery} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover brightness-[0.7] contrast-[1.05]"
      />

      {/* Firefly Character Illustration on Left/Center */}
      <motion.div 
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full md:w-3/5 h-full flex items-end justify-center pointer-events-none pb-0"
      >
        <img 
          src={activeAvatar} 
          alt="Firefly Fullbody" 
          className="max-h-[92vh] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] filter"
        />
        {/* Ambient lower gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#070b14]/90 to-transparent pointer-events-none" />
      </motion.div>

      {/* UID watermark at bottom left */}
      <div className="absolute bottom-4 left-6 z-20 text-xs tracking-widest text-slate-400/60 font-mono">
        UID: {userProfile.uid || '000001'}
      </div>

      {/* Right HSR Phone Panel Card */}
      <motion.div 
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-20 w-full md:w-[460px] ml-auto h-full flex flex-col justify-between p-6 bg-[#0d1424]/95 backdrop-blur-2xl border-l border-cyan-500/20 shadow-2xl shadow-black"
      >
        {/* Quick Actions Bar (Top right icons) */}
        <div className="absolute top-4 -left-14 flex flex-col gap-3">
          <button 
            onClick={() => setScreen('chat')}
            className="w-10 h-10 rounded-full bg-[#131b2e]/90 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 hover:scale-105 transition-all shadow-lg"
            title="Close Menu / Open Chat"
          >
            <X size={20} />
          </button>
          <button 
            onClick={() => setScreen('settings')}
            className="w-10 h-10 rounded-full bg-[#131b2e]/90 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 hover:scale-105 transition-all shadow-lg"
            title="Notifications"
          >
            <Bell size={18} />
          </button>
          <button 
            onClick={() => setScreen('scenery')}
            className="w-10 h-10 rounded-full bg-[#131b2e]/90 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 hover:scale-105 transition-all shadow-lg"
            title="Camera & Scenery"
          >
            <Camera size={18} />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="pt-2">
          <div className="text-[11px] font-mono tracking-wider text-slate-400/80 mb-1">
            UID {userProfile.uid || '000001'}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full border-2 border-cyan-400/40 bg-slate-800/80 flex items-center justify-center text-cyan-300 overflow-hidden shadow-inner">
                <img src="/assets/firefly_avatar.jpg" alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none' }} />
                <User size={26} className="text-slate-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  {userProfile.username || 'Guest User'}
                </h2>
                <div className="text-xs text-[#d9f99d] font-medium tracking-wide">
                  Chat Rank {userProfile.chat_rank || 0}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setScreen('settings')}
              className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 border border-slate-600/50 flex items-center justify-center text-slate-300 transition-all"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-400/80 italic">
            Chatting with Firefly
          </div>

          {/* Bond Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-700/40">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-[#fef08a] font-semibold tracking-wide">Bond Level {userProfile.bond_level || 1}</span>
              <span className="text-slate-400 font-mono text-[11px]">Bond EXP {userProfile.bond_exp}/{userProfile.bond_max_exp || 450}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${expPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-yellow-400 via-amber-300 to-lime-300 rounded-full shadow-[0_0_8px_rgba(253,224,71,0.5)]"
              />
            </div>
          </div>
        </div>

        {/* 8 Grid Menu Tiles */}
        <div className="grid grid-cols-4 gap-2.5 my-auto py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.screen)}
                className="group relative flex flex-col items-center justify-center aspect-square rounded-xl bg-[#131b2e]/80 hover:bg-[#1a253e] border border-slate-700/50 hover:border-cyan-400/70 transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                )}
                <Icon size={22} className="text-slate-300 group-hover:text-cyan-300 transition-colors" />
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white mt-2 tracking-wide">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer info & Power switch */}
        <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <span className="text-xs text-slate-400 font-medium">
              Provider: <span className="text-cyan-300 font-semibold uppercase">{aiConfig.provider}</span>
            </span>
          </div>

          <button 
            onClick={() => setScreen('chat')}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-red-500/20 border border-slate-600/50 hover:border-red-400 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all"
            title="Exit / Chat"
          >
            <Power size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
