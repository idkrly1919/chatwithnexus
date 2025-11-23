/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Add @google/genai imports and replace fetch-based implementation with the official SDK.
import { GoogleGenAI, GenerateContentResponse, Part, Content } from '@google/genai';
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
 * AI Service using Google Gemini API
 * Handles routing for Text, Vision, and Image Gen.
 */
export const geminiService = {
  
  /**
   * Main streaming handler
   */
  async *streamGemini(
    messages: Message[],
    personality: PersonalityMode
  ): AsyncGenerator<StreamUpdate> {
    
    // FIX: Use process.env.API_KEY as per guidelines.
    // The original code used import.meta.env.VITE_API_KEY which caused a TS error and was against guidelines.
    if (!process.env.API_KEY) {
        yield { text: "Configuration Error: Missing API_KEY.", isComplete: true, error: true };
        return;
    }
    // FIX: Initialize GoogleGenAI with API key from environment variables.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const lastMessage = messages[messages.length - 1];

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

    const sysPrompt = PERSONALITY_PROMPTS[personality];

    // FIX: Convert message history to Gemini's format.
    const history: Content[] = messages.slice(0, -1)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => {
        // Simple mapping, ignores attachments in history for now.
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        };
      });

    const imageAttachment = lastMessage.attachments?.find(a => a.type === 'image');
    let modelName: string;
    const requestParts: Part[] = [{ text: lastMessage.text }];

    if (imageAttachment) {
        // 2. Vision Request
        modelName = 'gemini-2.5-flash'; // Good for multimodal
        // FIX: Process base64 data URI for vision model
        const base64Data = imageAttachment.content.split(',')[1];
        if (!base64Data) {
          yield { text: "Error: Invalid image data.", isComplete: true, error: true };
          return;
        }
        const mimeType = imageAttachment.content.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
        requestParts.push({
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        });
    } else {
        // 3. Default: Text Reasoning
        modelName = 'gemini-2.5-flash'; // For basic text tasks.
    }

    try {
        // FIX: Use chat session for conversation history
        const chat = ai.chats.create({
            model: modelName,
            config: {
                systemInstruction: sysPrompt,
            },
            history: history,
        });
        
        // FIX: Use chat.sendMessageStream with parts for multimodal input.
        const responseStream = await chat.sendMessageStream(requestParts);
        
        let accumulatedText = "";
        for await (const chunk of responseStream) {
            // FIX: Use .text property to get text from response chunk as per guidelines.
            const text = (chunk as GenerateContentResponse).text;
            if (text) {
                accumulatedText += text;
                yield { text: accumulatedText, isComplete: false };
            }
        }
        yield { text: accumulatedText, isComplete: true };

    } catch (e) {
        yield { text: `API Error: ${(e as Error).message}`, isComplete: true, error: true };
    }
  },

  isImageGenerationRequest(text: string): boolean {
    const triggers = ['generate image', 'create image', 'draw', 'paint', 'visualize', 'generate a picture', 'make a picture'];
    return triggers.some(t => text.toLowerCase().includes(t));
  },

  /**
   * Calls Gemini API for Image Generation
   */
  async generateImage(prompt: string): Promise<string> {
    // FIX: Use process.env.API_KEY as per guidelines.
    if (!process.env.API_KEY) {
        throw new Error("Configuration Error: Missing API_KEY.");
    }
    // FIX: Initialize GoogleGenAI with API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // FIX: Extract prompt text
    const cleanPrompt = prompt.replace(/generate image|create image|draw|paint|visualize|generate a picture|make a picture/gi, '').trim();

    // FIX: Call gemini model for image generation using generateContent
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Default image generation model
        contents: {
            parts: [{ text: cleanPrompt }],
        },
    });

    // FIX: Process response to extract image data
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
        }
    }
    
    throw new Error("No image data returned from Gemini API.");
  },
};
