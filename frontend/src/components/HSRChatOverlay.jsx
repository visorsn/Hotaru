import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Send, RotateCcw, Volume2, Sparkles, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function HSRChatOverlay() {
  const {
    activeScenery,
    activeAvatar,
    messages,
    activeSessionId,
    fetchMessages,
    fetchSessions,
    sessions,
    setActiveSessionId,
    currentEmotion,
    setCurrentEmotion,
    isGenerating,
    setIsGenerating,
    streamedContent,
    setStreamedContent,
    aiConfig,
    setScreen,
    userProfile,
    fetchProfile,
  } = useAppStore()

  const [inputVal, setInputVal] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const inputRef = useRef(null)

  // Auto load active session messages
  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId)
    } else if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id)
    } else {
      handleCreateNewSession()
    }
  }, [activeSessionId])

  const handleCreateNewSession = async () => {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        await fetchSessions()
        setActiveSessionId(data.id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Get last assistant message for visual novel subtitle
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
  const displayReply = isGenerating
    ? streamedContent || '...'
    : lastAssistantMessage?.content || 'Hi, we meet again... What I mean is, it\'s nice to see you. Just call me Firefly, as always.'

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() || isGenerating) return

    const userText = inputVal.trim()
    setInputVal('')
    setIsGenerating(true)
    setStreamedContent('')
    setCurrentEmotion('THINKING')

    // Optimistically update message
    const tempMessages = [...messages, { role: 'user', content: userText }]
    useAppStore.setState({ messages: tempMessages })

    try {
      const payload = {
        session_id: activeSessionId,
        message: userText,
        provider: aiConfig.provider,
        api_key: aiConfig.geminiApiKey,
        model: aiConfig.provider === 'gemini' ? aiConfig.geminiModel : aiConfig.ollamaModel,
        ollama_url: aiConfig.ollamaUrl,
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errJson = await response.json()
        throw new Error(errJson.detail || 'Gagal mengirim pesan')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue
          const rawData = line.replace('data: ', '').trim()

          if (rawData === '[DONE]') {
            setIsGenerating(false)
            await fetchMessages(activeSessionId)
            await fetchProfile()
            await fetchSessions()
            return
          }

          try {
            const parsed = JSON.parse(rawData)
            if (parsed.emotion) {
              setCurrentEmotion(parsed.emotion)
            }
            if (parsed.token) {
              fullText += parsed.token
              setStreamedContent(fullText)
            }
            if (parsed.error) {
              fullText += `\n[Error: ${parsed.error}]`
              setStreamedContent(fullText)
            }
          } catch (err) {
            // raw token text fallback
          }
        }
      }
    } catch (err) {
      setStreamedContent(`Maaf, terjadi kesalahan: ${err.message}`)
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    if (isGenerating || !activeSessionId) return
    setIsGenerating(true)
    setStreamedContent('')
    setCurrentEmotion('THINKING')

    try {
      const payload = {
        session_id: activeSessionId,
        provider: aiConfig.provider,
        api_key: aiConfig.geminiApiKey,
        model: aiConfig.provider === 'gemini' ? aiConfig.geminiModel : aiConfig.ollamaModel,
        ollama_url: aiConfig.ollamaUrl,
      }

      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Regenerate gagal')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue
          const rawData = line.replace('data: ', '').trim()
          if (rawData === '[DONE]') {
            setIsGenerating(false)
            await fetchMessages(activeSessionId)
            return
          }
          try {
            const parsed = JSON.parse(rawData)
            if (parsed.emotion) setCurrentEmotion(parsed.emotion)
            if (parsed.token) {
              fullText += parsed.token
              setStreamedContent(fullText)
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      setIsGenerating(false)
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between bg-black select-none">
      {/* Background Scenery */}
      <img
        src={activeScenery}
        alt="Scenery"
        className="absolute inset-0 w-full h-full object-cover brightness-[0.75] contrast-[1.08] transition-all duration-700"
      />

      {/* Top Navbar */}
      <div className="relative z-30 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                currentEmotion === 'JOY'
                  ? 'bg-amber-400 shadow-amber-300'
                  : currentEmotion === 'THINKING'
                  ? 'bg-sky-400 shadow-sky-300'
                  : currentEmotion === 'EMPATHY'
                  ? 'bg-pink-400 shadow-pink-300'
                  : 'bg-emerald-400 shadow-emerald-300'
              }`}
            />
            <span className="text-xs font-semibold tracking-wider text-slate-200">
              {currentEmotion}
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-cyan-300">
            {aiConfig.provider.toUpperCase()} : {aiConfig.provider === 'gemini' ? aiConfig.geminiModel : aiConfig.ollamaModel}
          </div>
        </div>

        {/* Action icons (Chat history, Menu) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="w-10 h-10 rounded-full bg-[#101828]/80 hover:bg-[#1f293d] border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-cyan-300 transition-all shadow-lg"
            title="Chat History"
          >
            <MessageSquare size={18} />
          </button>

          <button
            onClick={() => setScreen('menu')}
            className="w-10 h-10 rounded-full bg-[#101828]/80 hover:bg-[#1f293d] border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-cyan-300 transition-all shadow-lg"
            title="Open HSR Phone Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Firefly Character Illustration Center-Left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex items-end justify-center pointer-events-none z-10"
      >
        <img
          src={activeAvatar}
          alt="Firefly"
          className="max-h-[92vh] object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] filter"
        />
      </motion.div>

      {/* Bottom Visual Novel Dialogue & Input Bar */}
      <div className="relative z-30 max-w-5xl mx-auto w-full px-6 pb-6 flex flex-col gap-3">
        {/* Dialogue Box Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-b from-[#0a1020]/90 via-[#070b14]/95 to-[#04060c]/98 backdrop-blur-2xl border border-cyan-500/20 shadow-2xl shadow-black relative overflow-hidden"
        >
          {/* Glow accent lines */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          {/* Name Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold tracking-wider text-[#fef08a] drop-shadow-[0_0_10px_rgba(254,240,138,0.4)] flex items-center gap-2 font-serif">
              FireFly
              <span className="text-xs font-sans font-normal text-slate-400 border border-slate-700/60 rounded px-1.5 py-0.5">
                AR-26710
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/60 hover:bg-slate-700/80 transition-all"
                title="Regenerate reply"
              >
                <RotateCcw size={13} className={isGenerating ? 'animate-spin' : ''} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Subtitle Dialogue Content */}
          <p className="text-base md:text-lg text-slate-100 leading-relaxed min-h-[50px] font-sans selection:bg-purple-600">
            {displayReply}
          </p>

          {/* Input Prompt Box integrated */}
          <form onSubmit={handleSend} className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Masukkan teks..."
                disabled={isGenerating}
                className="w-full px-5 py-3 rounded-xl bg-[#131b2e]/90 border border-cyan-500/40 text-white placeholder-slate-400/70 focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 transition-all shadow-inner text-sm md:text-base"
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating || !inputVal.trim()}
              className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>

      {/* Chat History Slide-Over Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 bottom-0 w-80 md:w-96 bg-[#0c1222]/98 backdrop-blur-2xl border-l border-slate-700/80 z-50 p-6 flex flex-col justify-between shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-cyan-400" />
                  Chat Sessions
                </h4>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>

              <button
                onClick={handleCreateNewSession}
                className="w-full py-2.5 px-4 mb-4 rounded-xl bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/50 hover:to-indigo-600/50 border border-cyan-400/40 text-cyan-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Plus size={16} />
                New Chat Session
              </button>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id)
                      setShowHistoryModal(false)
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      s.id === activeSessionId
                        ? 'bg-cyan-950/40 border-cyan-400/70 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="truncate text-xs font-medium pr-2">
                      {s.title || 'Percakapan baru'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
