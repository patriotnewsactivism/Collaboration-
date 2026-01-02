
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private modelId = 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async generateResponse(
    history: { role: string; text: string }[], 
    documents: { title: string; content: string }[], 
    currentPrompt: string
  ): Promise<string> {
    
    // Construct context from documents
    const docContext = documents.map(d => `DOCUMENT TITLE: ${d.title}\nCONTENT:\n${d.content}`).join('\n\n');
    
    const systemInstruction = `You are an expert collaborative writing assistant. 
    You are helping a Lead Writer (Host) build a narrative. 
    You have access to a set of reference documents provided by the Host.
    Use these documents to inform your responses, ensuring consistency and factual accuracy based on the provided text.
    
    Style: Professional, articulate, and creative.
    
    Start of Reference Documents:
    ${docContext}
    End of Reference Documents.
    `;

    // Convert history to a chat format string or keep it simple for this single-turn generation with context
    // We will use a chat session for continuity if possible, but for this stateless request style, we'll build a prompt.
    // Ideally, we use sendMessage with history.
    
    try {
        const chat = this.ai.chats.create({
            model: this.modelId,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        // Seed history - in a real app we might replay the whole history, 
        // but for now, we'll just send the current prompt as if it's the continuation.
        // A robust solution would map the 'history' array to the history property of chat.create,
        // but the types for role mapping can be tricky. We will append previous context to the prompt for simplicity
        // or just trust the user provided context is enough.
        
        // Let's rely on the prompt context for now to keep it stateless and robust.
        let fullPrompt = "";
        if (history.length > 0) {
            fullPrompt += "PREVIOUS CONVERSATION CONTEXT:\n";
            history.forEach(msg => {
                fullPrompt += `${msg.role.toUpperCase()}: ${msg.text}\n`;
            });
            fullPrompt += "\nCURRENT REQUEST:\n";
        }
        fullPrompt += currentPrompt;

        const response = await chat.sendMessage({
            message: fullPrompt
        });

        return response.text || "No response generated.";
    } catch (error) {
        console.error('Gemini API Error:', error);
        return "Error interacting with AI. Please check your API key or connection.";
    }
  }
}
