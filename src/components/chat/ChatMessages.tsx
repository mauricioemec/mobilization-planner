import { useEffect, useRef } from 'react'
import type { ChatEntry } from '../../stores/useChatStore'

type Props = {
  messages: ChatEntry[]
  isLoading: boolean
}

/**
 * Scrollable message list for the chat panel.
 * Renders user bubbles (right, blue), assistant bubbles (left, gray),
 * tool notifications (centered italic), and a typing indicator.
 */
export function ChatMessages({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((msg) => {
        if (msg.role === 'tool') {
          return (
            <p key={msg.id} className="text-center text-[11px] italic text-gray-400">
              {msg.content}
            </p>
          )
        }

        const isUser = msg.role === 'user'

        return (
          <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={[
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                isUser
                  ? 'rounded-br-sm bg-blue-600 text-white'
                  : 'rounded-bl-sm bg-gray-100 text-gray-800',
              ].join(' ')}
            >
              <MessageContent content={msg.content} />
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

/** Minimal markdown: bold, inline code, line breaks. No external dep needed. */
function MessageContent({ content }: { content: string }) {
  // Split on **bold**, `code`, and newlines
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
