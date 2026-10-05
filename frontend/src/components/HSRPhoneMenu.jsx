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
    activeScenery 
  } = useAppStore()

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, screen: 'chat' },
    { id: 'audio', label: 'Audio', icon: Volume2, screen: 'audio' },
    { id: 'apikey', label: 'API Key', icon: Key, screen: 'apikey', badge: true },
    { id: 'custom', label: 'Custom', icon: Sliders, screen: 'custom' },
    { id: 'scenery', label: 'Scenery', icon: ImageIcon, screen: 'scenery' },
    { id: 'settings', label: 'Settings', icon: Settings, screen: 'settings' },
    { id: 'gallery', label: 'Character', icon: LayoutGrid, screen: 'gallery', badge: true },
  ]

  const expPercentage = Math.min(100, Math.round((userProfile.bond_exp / (userProfile.bond_max_exp || 450)) * 100))

  return (
    <div className="relative w-full h-screen overflow-hidden flex select-none bg-[#070b14]">
      {/* Background Scenery */}
      <img 
        src={activeScenery} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover brightness-[0.75] contrast-[1.05]"
      />

      {/* Firefly Character Illustration on Left */}
      <div className="relative z-10 w-full md:w-3/5 h-full flex items-end justify-center pointer-events-none pb-0">
        <img 
          src={activeAvatar} 
          alt="Firefly Fullbody" 
          className="max-h-[92vh] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] filter"
        />
      </div>

      {/* UID watermark at bottom left */}
      <div className="absolute bottom-4 left-6 z-20 text-xs tracking-widest text-slate-400 font-mono">
        UID:{userProfile.uid || '000001'}
      </div>

      {/* Right HSR Phone Panel Card */}
      <div className="relative z-20 w-full md:w-[460px] ml-auto h-full flex flex-col justify-between p-7 bg-[#0b101d]/98 border-l border-slate-800 shadow-2xl">
        {/* Quick Actions Bar on Outside Left */}
        <div className="absolute top-6 -left-12 flex flex-col gap-3">
          <button 
            onClick={() => setScreen('chat')}
            className="w-10 h-10 rounded-full bg-[#121c2d] border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-lg"
            title="Close / Chat"
          >
            <X size={20} />
          </button>
          <button 
            onClick={() => setScreen('settings')}
            className="w-10 h-10 rounded-full bg-[#121c2d] border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-lg"
            title="Notifications"
          >
            <Bell size={18} />
          </button>
          <button 
            onClick={() => setScreen('scenery')}
            className="w-10 h-10 rounded-full bg-[#121c2d] border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-lg"
            title="Camera & Scenery"
          >
            <Camera size={18} />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="pt-2">
          <div className="text-[11px] font-mono tracking-wider text-slate-400 mb-1">
            UID {userProfile.uid || '000001'}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full border border-cyan-400/40 bg-slate-800 flex items-center justify-center text-cyan-300 overflow-hidden">
                <img src="/assets/firefly_avatar.jpg" alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none' }} />
                <User size={26} className="text-slate-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {userProfile.username || 'Guest User'}
                </h2>
                <div className="text-xs text-[#d9f99d] font-medium">
                  Chat Rank {userProfile.chat_rank || 0}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setScreen('settings')}
              className="w-11 h-6 rounded-full bg-slate-100 hover:bg-white flex items-center justify-center text-slate-900 transition-all"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-400">
            Chatting with Firefly
          </div>

          {/* Bond Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-[#fef08a] font-semibold tracking-wide">Bond Level {userProfile.bond_level || 1}</span>
              <span className="text-slate-400 font-mono text-[11px]">Bond EXP {userProfile.bond_exp}/{userProfile.bond_max_exp || 450}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                style={{ width: `${expPercentage}%` }}
                className="h-full bg-[#fef08a] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* 8 Grid Menu Tiles */}
        <div className="grid grid-cols-4 gap-3 my-auto py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.screen)}
                className="group relative flex flex-col items-center justify-center aspect-square rounded-xl bg-[#121b2d]/80 hover:bg-[#18243b] border border-slate-700/60 hover:border-[#d9f99d]/70 transition-all duration-150 cursor-pointer"
              >
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
                <Icon size={22} className="text-slate-300 group-hover:text-[#d9f99d] transition-colors" />
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white mt-2 tracking-wide">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer info & Power switch */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
          <button 
            onClick={() => setScreen('chat')}
            className="w-10 h-10 rounded-full bg-[#121b2d] hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-[#d9f99d] hover:text-white transition-all"
            title="Exit / Chat"
          >
            <Power size={18} />
          </button>
        </div>
      </div>

      {/* Solid bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#8014a0] z-30" />
    </div>
  )
}
