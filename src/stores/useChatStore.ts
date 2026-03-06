import { create } from 'zustand'
import { sendMessage as callChatService, type ChatMessage } from '../lib/chat/chatService'
import { useProjectStore } from './useProjectStore'
import { useDeckLayoutStore } from './useDeckLayoutStore'
import { useAnalysisStore } from './useAnalysisStore'

const DATA_CHANGE_KEYWORDS = /\b(updated|changed|moved|analysis complete|analysed|analyzed|set weight|set dimension|overboard)\b/i

export type ChatEntry = {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: Date
}

type ChatState = {
  messages: ChatEntry[]
  isOpen: boolean
  isLoading: boolean
  projectId: string | null

  /** Set the active project context for chat requests. */
  setProjectId: (id: string) => void
  /** Toggle the chat panel open/closed. */
  togglePanel: () => void
  /** Open the panel. */
  openPanel: () => void
  /** Close the panel. */
  closePanel: () => void
  /** Clear all messages. */
  clearChat: () => void
  /**
   * Send a user message and await the assistant response.
   * Automatically refreshes relevant stores if the response contains
   * data-change keywords.
   */
  sendMessage: (text: string) => Promise<void>
}

let _idCounter = 0
function nextId() {
  return `msg-${++_idCounter}-${Date.now()}`
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  projectId: null,

  setProjectId: (id) => set({ projectId: id }),

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),

  clearChat: () => set({ messages: [] }),

  sendMessage: async (text) => {
    const { messages, projectId } = get()

    if (!projectId) return

    const userEntry: ChatEntry = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    set((s) => ({ messages: [...s.messages, userEntry], isLoading: true }))

    // Build the history for the API (user/assistant only — strip tool entries)
    const history: ChatMessage[] = [...messages, userEntry]
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const { text: reply, toolNotifications, error } = await callChatService(history, projectId)

    // Append tool notifications first
    const toolEntries: ChatEntry[] = toolNotifications.map((n) => ({
      id: nextId(),
      role: 'tool' as const,
      content: n,
      timestamp: new Date(),
    }))

    const assistantEntry: ChatEntry = {
      id: nextId(),
      role: 'assistant',
      content: error ? `Error: ${error}` : (reply ?? '(no response)'),
      timestamp: new Date(),
    }

    set((s) => ({
      messages: [...s.messages, ...toolEntries, assistantEntry],
      isLoading: false,
    }))

    // Refresh stores if the response suggests data was mutated
    if (reply && DATA_CHANGE_KEYWORDS.test(reply)) {
      const { activeProject, loadProject } = useProjectStore.getState()
      const { loadProjectEquipment } = useDeckLayoutStore.getState()
      const { loadResults, results } = useAnalysisStore.getState()

      if (activeProject) {
        void loadProject(activeProject.id)
        void loadProjectEquipment(activeProject.id)
        // Reload analysis results for all equipment already in memory
        for (const peId of Object.keys(results)) {
          void loadResults(peId)
        }
      }
    }
  },
}))
