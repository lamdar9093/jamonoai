import { Message } from "@shared/schema";

// Function to stream chat responses from the OpenAI API through our backend
export async function streamChatResponse(
  agentId: number,
  messages: { content: string; sender: string }[]
): Promise<ReadableStream<Uint8Array>> {
  try {
    const response = await fetch(`/api/chat/${agentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.body!;
  } catch (error) {
    console.error("Error streaming chat response:", error);
    throw error;
  }
}

// Convert a stream to text chunks that can be processed incrementally
export async function* streamToIterator(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

// Process a chat message stream and call a callback with each new chunk
export async function processMessageStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void
): Promise<string> {
  let fullResponse = "";
  
  for await (const chunk of streamToIterator(stream)) {
    fullResponse += chunk;
    onChunk(chunk);
  }
  
  return fullResponse;
}
