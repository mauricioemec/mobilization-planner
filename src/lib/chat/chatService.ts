import { supabase } from '../supabase'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type SendMessageResult = {
  text: string | null
  toolNotifications: string[]
  error: string | null
}

/**
 * Sends a conversation to the Supabase Edge Function `/functions/v1/chat`.
 * Returns the assistant reply text plus any tool-call notifications extracted
 * from the response.
 */
export async function sendMessage(
  messages: ChatMessage[],
  projectId: string,
): Promise<SendMessageResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)

  try {
    const { data, error } = await supabase.functions.invoke<{
      reply: string
      toolNotifications: string[]
    }>('chat', {
      body: { messages, projectId },
    })

    if (error) {
      return { text: null, toolNotifications: [], error: error.message }
    }

    return {
      text: data?.reply ?? null,
      toolNotifications: data?.toolNotifications ?? [],
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { text: null, toolNotifications: [], error: message }
  } finally {
    clearTimeout(timeout)
  }
}
