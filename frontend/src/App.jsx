import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/useAppStore'
import HSRPhoneMenu from './components/HSRPhoneMenu'
import HSRChatOverlay from './components/HSRChatOverlay'
import ApiKeyModal from './components/ApiKeyModal'
import ChatSessionsModal from './components/ChatSessionsModal'
import SceneryModal from './components/SceneryModal'
import GalleryModal from './components/GalleryModal'
import AudioModal from './components/AudioModal'
import CustomModal from './components/CustomModal'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const { currentScreen, fetchProfile, fetchSessions, fetchPersona } = useAppStore()

  useEffect(() => {
    fetchProfile()
    fetchSessions()
    fetchPersona()
  }, [])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <HSRPhoneMenu key="menu" />
      case 'chat':
        return <HSRChatOverlay key="chat" />
      case 'apikey':
        return <ApiKeyModal key="apikey" />
      case 'chat_sessions':
        return <ChatSessionsModal key="chat_sessions" />
      case 'scenery':
        return <SceneryModal key="scenery" />
      case 'gallery':
        return <GalleryModal key="gallery" />
      case 'audio':
        return <AudioModal key="audio" />
      case 'custom':
        return <CustomModal key="custom" />
      case 'settings':
        return <SettingsModal key="settings" />
      default:
        return <HSRPhoneMenu key="menu-default" />
    }
  }

  return (
    <div className="w-full h-screen bg-[#05070f] text-slate-100 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
