import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // Navigation State
  currentScreen: 'menu', // 'menu' | 'chat' | 'apikey' | 'chat_sessions' | 'scenery' | 'gallery' | 'audio' | 'custom' | 'settings'
  setScreen: (screen) => set({ currentScreen: screen }),

  // User Profile State
  userProfile: {
    username: 'Guest User',
    uid: '000001',
    chat_rank: 0,
    bond_level: 1,
    bond_exp: 5,
    bond_max_exp: 450,
  },
  setUserProfile: (profile) => set({ userProfile: { ...get().userProfile, ...profile } }),

  // AI Configuration State
  aiConfig: {
    provider: localStorage.getItem('firefly_ai_provider') || 'ollama', // 'ollama' | 'gemini'
    geminiApiKey: localStorage.getItem('firefly_gemini_key') || '',
    geminiModel: localStorage.getItem('firefly_gemini_model') || 'gemini-3.6',
    ollamaUrl: localStorage.getItem('firefly_ollama_url') || 'http://localhost:11434/api/generate',
    ollamaModel: localStorage.getItem('firefly_ollama_model') || 'qwen2.5:3b',
  },
  setAiConfig: (config) => {
    const updated = { ...get().aiConfig, ...config }
    if (config.provider) localStorage.setItem('firefly_ai_provider', config.provider)
    if (config.geminiApiKey !== undefined) localStorage.setItem('firefly_gemini_key', config.geminiApiKey)
    if (config.geminiModel) localStorage.setItem('firefly_gemini_model', config.geminiModel)
    if (config.ollamaUrl) localStorage.setItem('firefly_ollama_url', config.ollamaUrl)
    if (config.ollamaModel) localStorage.setItem('firefly_ollama_model', config.ollamaModel)
    set({ aiConfig: updated })
  },

  // Active Scenery & Avatar
  sceneryList: [
    { id: 'starship', name: 'Starship Room', image: '/assets/chat_room_bg.jpg', category: 'Space', unlocked: true },
    { id: 'observatory', name: 'Observatory', image: '/assets/gallery_4.jpg', category: 'Space', unlocked: true },
    { id: 'nightsky', name: 'Night Sky', image: '/assets/gallery_3.jpg', category: 'Night', unlocked: true },
    { id: 'classic', name: 'Classic Room', image: '/assets/gallery_2.jpg', category: 'Interior', unlocked: true },
    { id: 'nebula', name: 'Nebula Hall', image: '/assets/gallery_1.jpg', category: 'Space', unlocked: true },
    { id: 'sunset', name: 'Sunset Deck', image: '/assets/gallery_6.jpg', category: 'Exterior', unlocked: true },
  ],
  activeScenery: '/assets/chat_room_bg.jpg',
  setActiveScenery: (src) => set({ activeScenery: src }),

  // Avatar & Gallery
  avatarList: [
    { id: 'classic', name: 'Classic Avatar', image: '/assets/firefly_fullbody.png', cardImg: '/assets/gallery_1.jpg', category: 'Avatars' },
    { id: 'night', name: 'Night Avatar', image: '/assets/firefly_fullbody.png', cardImg: '/assets/gallery_4.jpg', category: 'Avatars' },
    { id: 'casual', name: 'Casual Look', image: '/assets/firefly_fullbody.png', cardImg: '/assets/gallery_2.jpg', category: 'Avatars' },
    { id: 'smile', name: 'Smile', image: '/assets/firefly_fullbody.png', cardImg: '/assets/gallery_5.jpg', category: 'Saved' },
    { id: 'sleepy', name: 'Sleepy', image: '/assets/firefly_fullbody.png', cardImg: '/assets/gallery_3.jpg', category: 'Saved' },
    { id: 'formal', name: 'Formal', image: '/assets/firefly_fullbody.png', cardImg: '/assets/gallery_6.jpg', category: 'Avatars' },
  ],
  activeAvatar: '/assets/firefly_fullbody.png',
  setActiveAvatar: (src) => set({ activeAvatar: src }),

  // Chat & Session State
  sessions: [],
  activeSessionId: null,
  messages: [],
  currentEmotion: 'NEUTRAL',
  isGenerating: false,
  streamedContent: '',

  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setMessages: (messages) => set({ messages }),
  setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),
  setIsGenerating: (status) => set({ isGenerating: status }),
  setStreamedContent: (content) => set({ streamedContent: content }),

  // Persona
  personaText: '',
  setPersonaText: (text) => set({ personaText: text }),

  // Audio Settings
  audioConfig: {
    voice: 'Firefly JP',
    bgmVolume: 50,
    sfxVolume: 80,
    voiceVolume: 100,
    ambientHum: true,
    messageChime: true,
  },
  setAudioConfig: (cfg) => set({ audioConfig: { ...get().audioConfig, ...cfg } }),

  fetchProfile: async () => {
    try {
      const res = await fetch('/api/user-profile')
      if (res.ok) {
        const data = await res.json()
        set({ userProfile: data })
      }
    } catch (e) {
      console.error('Failed to fetch profile', e)
    }
  },

  fetchSessions: async () => {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const list = await res.json()
        set({ sessions: list })
        if (!get().activeSessionId && list.length > 0) {
          set({ activeSessionId: list[0].id })
        }
      }
    } catch (e) {
      console.error('Failed to fetch sessions', e)
    }
  },

  fetchMessages: async (sessionId) => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`)
      if (res.ok) {
        const msgs = await res.json()
        set({ messages: msgs })
      }
    } catch (e) {
      console.error('Failed to fetch messages', e)
    }
  },

  fetchPersona: async () => {
    try {
      const res = await fetch('/api/persona')
      if (res.ok) {
        const data = await res.json()
        set({ personaText: data.persona })
      }
    } catch (e) {
      console.error('Failed to fetch persona', e)
    }
  },
}))
