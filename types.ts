/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Role = 'user' | 'assistant' | 'system' | 'typing' | 'searching' | 'error' | 'image-gen';

export type PersonalityMode = 'conversational' | 'academic' | 'brainrot' | 'roast-master' | 'formal' | 'zesty';

export interface Attachment {
    type: 'image' | 'text';
    content: string; // Base64 or text content
    name: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  thought?: string; // Captures "Chain of Thought" or internal process logs
  attachments?: Attachment[];
  timestamp: number;
}

export interface ChatHistory {
    id: string;
    title: string;
    date: string;
}

export interface StreamUpdate {
    text: string;
    isComplete: boolean;
    error?: boolean;
}