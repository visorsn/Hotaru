import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Menu } from 'lucide-react'
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
  const inputRef = useRef(null)

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

  // Get last assistant reply for subtitle
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
  const displayReply = isGenerating
    ? streamedContent || '...'
    : lastAssistantMessage?.content || "Hi, we meet again... What I mean is, it's nice to see you. Just call me Firefly, as always."

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() || isGenerating) return

    const userText = inputVal.trim()
    setInputVal('')
    setIsGenerating(true)
    setStreamedContent('')

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
            if (fullText) {
              const updated = [...useAppStore.getState().messages, { role: 'assistant', content: fullText }]
              useAppStore.setState({ messages: updated })
            }
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
          } catch (err) {}
        }
      }
    } catch (err) {
      setStreamedContent(`Maaf, terjadi kesalahan: ${err.message}`)
      setIsGenerating(false)
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* Background Room Scenery */}
      <img
        src={activeScenery}
        alt="Scenery"
        className="absolute inset-0 w-full h-full object-cover brightness-[0.88] contrast-[1.05]"
      />

      {/* Top Right HSR Hamburger Menu Circle Button */}
      <div className="absolute top-6 right-6 z-40">
        <button
          onClick={() => setScreen('menu')}
          className="w-10 h-10 rounded-full bg-[#121c2d]/90 border border-[#d9f99d]/70 flex items-center justify-center text-[#d9f99d] hover:scale-105 active:scale-95 transition-all shadow-md"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Character Illustration */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-10">
        <img
          src={activeAvatar}
          alt="Firefly"
          className="max-h-[95vh] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
        />
      </div>

      {/* Solid Purple Input Bar - Floating in Middle Right per design */}
      <div className="absolute z-30 right-[8%] bottom-[33%] w-full max-w-md px-4">
        <form
          onSubmit={handleSend}
          className="flex items-center rounded-lg overflow-hidden bg-[#241d40]/90 border-l-4 border-l-[#a855f7] border-y border-r border-[#3b2d60] shadow-xl backdrop-blur-sm"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Masukan teks......."
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-slate-300 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={isGenerating || !inputVal.trim()}
            className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white disabled:opacity-40 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-slate-900/80 flex items-center justify-center">
              <ArrowRight size={13} className="text-white" />
            </div>
          </button>
        </form>
      </div>

      {/* Bottom Fade Shadow (Gradient to top) covering bottom dialogue area */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#2a0845]/90 via-[#1b052d]/60 to-transparent pointer-events-none z-20" />

      {/* Subtitle Dialogue Section at Bottom Left */}
      <div className="absolute bottom-8 left-10 right-10 z-30 max-w-4xl">
        <h2 className="text-4xl font-serif font-bold text-[#fef08a] mb-2 tracking-wide select-none drop-shadow-md">
          FireFly
        </h2>
        <p className="text-xl text-[#fef9c3] leading-relaxed max-w-3xl font-sans font-normal drop-shadow-md">
          {displayReply}
        </p>
      </div>

      {/* Solid bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#8014a0] z-30" />
    </div>
  )
}
