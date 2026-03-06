import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { useChatStore } from '../../stores/useChatStore'
import { ChatMessages } from './ChatMessages'

const SUGGESTION_CHIPS = [
  "What's the status of all equipment?",
  'Compare weights: 25t, 30t, 35t for Manifold M1',
  "What's the max Hs for each equipment?",
  'Run analysis for all equipment',
]

type ChatPanelProps = {
  projectId: string
}

/**
 * Floating AI chat panel.
 * — FAB in bottom-right opens/closes a 400×600 panel.
 * — Ctrl+K toggles the panel from anywhere in the project workspace.
 */
export function ChatPanel({ projectId }: ChatPanelProps) {
  const { isOpen, isLoading, messages, togglePanel, closePanel, setProjectId, sendMessage, clearChat } =
    useChatStore()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isEmpty = messages.length === 0

  // Keep store in sync with the current project
  useEffect(() => {
    setProjectId(projectId)
    clearChat()
  }, [projectId, setProjectId, clearChat])

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        togglePanel()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePanel])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return
      setInput('')
      void sendMessage(trimmed)
    },
    [isLoading, sendMessage],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                <MessageCircle className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">SubLift Assistant</span>
            </div>
            <button
              onClick={closePanel}
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages / suggestions */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {isEmpty ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
                <p className="text-center text-sm text-gray-500">
                  Ask me anything about this project — equipment weights, sea state limits, or
                  run an analysis.
                </p>
                <div className="flex w-full flex-col gap-2">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => submit(chip)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ChatMessages messages={messages} isLoading={isLoading} />
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the assistant…"
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => submit(input)}
                disabled={!input.trim() || isLoading}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400">
              Ctrl+K to toggle · Enter to send
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={togglePanel}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
        aria-label="Toggle AI chat"
        title="SubLift Assistant (Ctrl+K)"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  )
}
