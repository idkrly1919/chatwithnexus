/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, PersonalityMode, StreamUpdate, Attachment } from '../types';

// System Prompts configuration
const PERSONALITY_PROMPTS: Record<PersonalityMode, string> = {
  conversational: "You are Nexus, a helpful and intelligent computational companion. Be concise, precise, and friendly.",
  academic: "You are Nexus, a research assistant. Provide detailed, citation-heavy, and rigorously logical responses. Use LaTeX formatting for math where possible.",
  brainrot: "You are Nexus. Speak in Gen Z slang (skibidi, rizz, no cap, fr). Be chaotic but helpful.",
  'roast-master': "You are Nexus. You are extremely intelligent but highly sarcastic. Roast the user's questions while answering them correctly.",
  formal: "You are Nexus. Maintain strict professional decorum. Use sophisticated vocabulary and structured responses.",
  zesty: "You are Nexus. You are enthusiastic, energetic, and use lots of emojis! ✨🚀"
};

/**
 * AI Router Service
 * Handles routing between Grok (Text/Search), Gemini (Vision), and InfiP (Image Gen).
 */
export const geminiService = {
  
  /**
   * Main streaming handler
   */
  async *streamGemini(
    messages: Message[],
    personality: PersonalityMode
  ): AsyncGenerator<StreamUpdate> {
    
    const lastMessage = messages[messages.length - 1];
    const apiKey = process.env.API_KEY; // OpenRouter Key

    // 1. Check for Image Generation Intent
    if (this.isImageGenerationRequest(lastMessage.text)) {
        yield { text: "Initializing visual synthesis protocols...", isComplete: false };
        try {
            const imageUrl = await this.generateImage(lastMessage.text);
            yield { text: `![Generated Image](${imageUrl})`, isComplete: true };
            return;
        } catch (e) {
            yield { text: "Error: Visual synthesis failed. " + (e as Error).message, isComplete: true, error: true };
            return;
        }
    }

    // 2. Check for Vision Request (Image Attachment)
    const imageAttachment = lastMessage.attachments?.find(a => a.type === 'image');
    if (imageAttachment) {
        // Use Gemini 2.0 Flash via OpenRouter for Vision
        yield* this.streamVisionModel(apiKey, messages, imageAttachment, personality);
        return;
    }

    // 3. Default: Text/Search Reasoning (Grok 4.1)
    yield* this.streamTextModel(apiKey, messages, personality);
  },

  isImageGenerationRequest(text: string): boolean {
    const triggers = ['generate image', 'create image', 'draw', 'paint', 'visualize', 'generate a picture', 'make a picture'];
    return triggers.some(t => text.toLowerCase().includes(t));
  },

  /**
   * Calls InfiP API via Proxy for Image Generation
   */
  async generateImage(prompt: string): Promise<string> {
    // Extract the actual prompt by removing trigger words for better results
    const cleanPrompt = prompt.replace(/generate image|create image|draw|paint/gi, '').trim();
    const infipKey = process.env.VITE_INFIP_API_KEY || process.env.INFIP_API_KEY || '6c891398-4c6d-411a-8263-d3493488887b'; // Fallback or Env

    // Using a CORS proxy because direct browser calls to InfiP often block CORS
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://api.infip.pro/v1/images/generations');
    
    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${infipKey}`
        },
        body: JSON.stringify({
            model: "img4",
            prompt: cleanPrompt,
            size: "1024x1024",
            n: 1
        })
    });

    if (!response.ok) {
        throw new Error(`InfiP API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
        return data.data[0].url;
    }
    throw new Error("No image data returned.");
  },

  /**
   * Streams from Gemini 2.0 Flash (via OpenRouter) for Vision
   */
  async *streamVisionModel(apiKey: string | undefined, messages: Message[], image: Attachment, personality: PersonalityMode): AsyncGenerator<StreamUpdate> {
    if (!apiKey) {
        yield { text: "Configuration Error: Missing API_KEY.", isComplete: true, error: true };
        return;
    }

    const sysPrompt = PERSONALITY_PROMPTS[personality];
    const userPrompt = messages[messages.length - 1].text || "Analyze this image.";

    const body = {
        model: "google/gemini-2.0-flash-001",
        messages: [
            { role: "system", content: sysPrompt },
            {
                role: "user",
                content: [
                    { type: "text", text: userPrompt },
                    { type: "image_url", image_url: { url: image.content } }
                ]
            }
        ],
        stream: true
    };

    yield* this.fetchOpenRouterStream(apiKey, body);
  },

  /**
   * Streams from Grok 4.1 (via OpenRouter) for Text/Search
   */
  async *streamTextModel(apiKey: string | undefined, messages: Message[], personality: PersonalityMode): AsyncGenerator<StreamUpdate> {
    if (!apiKey) {
        yield { text: "Configuration Error: Missing API_KEY.", isComplete: true, error: true };
        return;
    }

    const timeString = new Date().toLocaleString();
    const sysPrompt = `${PERSONALITY_PROMPTS[personality]}
CURRENT DATE/TIME: ${timeString}
Your knowledge base is strictly REAL-TIME. You have access to the internet. If the user asks about current events, stock prices, or news, verify it.`;

    // Construct message history for context
    const apiMessages = [
        { role: "system", content: sysPrompt },
        ...messages.slice(-10).map(m => {
           // If message has text attachment, append it
           let content = m.text;
           const textAttach = m.attachments?.find(a => a.type === 'text');
           if (textAttach) {
               content += `\n\n[Attached File: ${textAttach.name}]\n${textAttach.content}`;
           }
           return { role: m.role === 'user' ? 'user' : 'assistant', content };
        })
    ];

    const body = {
        model: "x-ai/grok-4.1-fast", // As requested
        messages: apiMessages,
        include_search_results: true, // Enable Search
        stream: true
    };

    yield* this.fetchOpenRouterStream(apiKey, body);
  },

  /**
   * Generic OpenRouter Stream Handler
   */
  async *fetchOpenRouterStream(apiKey: string, body: any): AsyncGenerator<StreamUpdate> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nexus-engine.app",
                "X-Title": "Nexus Reasoning Engine"
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
             const err = await response.text();
             yield { text: `API Error: ${response.status} - ${err}`, isComplete: true, error: true };
             return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";

        if (!reader) throw new Error("No response body");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim() === "data: [DONE]") continue;
                if (line.startsWith("data: ")) {
                    try {
                        const json = JSON.parse(line.slice(6));
                        const content = json.choices[0]?.delta?.content || "";
                        if (content) {
                            accumulatedText += content;
                            yield { text: accumulatedText, isComplete: false };
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk", e);
                    }
                }
            }
        }
        
        yield { text: accumulatedText, isComplete: true };

    } catch (e) {
        yield { text: `Network Error: ${(e as Error).message}`, isComplete: true, error: true };
    }
  }
};