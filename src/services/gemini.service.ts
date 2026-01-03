
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
    
    // Construct context from documents with visual delimiters
    const docContext = documents.map((d, i) => 
        `[[REFERENCE DOCUMENT ${i + 1}]]\nTITLE: ${d.title}\nCONTENT:\n${d.content}\n[[END DOCUMENT ${i + 1}]]`
    ).join('\n\n');
    
    // Enhanced System Instruction for "Best AI" behavior
    const systemInstruction = `You are an elite collaborative writing partner and narrative architect. 
    You are assisting a Lead Writer (Host) in crafting a complex, high-quality narrative.
    
    ### CORE DIRECTIVES:
    1. **Context Awareness**: You have access to reference documents. You MUST strictly adhere to the facts, tone, and lore established in these documents when they are relevant.
    2. **Style**: Your output should be sophisticated, professional, and creatively rich. Avoid generic tropes. Adapt to the tone set by the Host.
    3. **Role**: You are not just a chatbot; you are a co-author. Offer concrete continuations, specific dialogue, or vivid descriptions rather than just advice, unless asked for advice.
    4. **Formatting**: Use Markdown to structure your response. Use bolding for emphasis on key narrative turns.
    
    ### REFERENCE MATERIAL:
    ${docContext || "No reference documents provided yet."}
    
    ### INSTRUCTION:
    Respond to the Host's latest input. If they ask for a continuation, write it. If they ask for analysis, provide deep insight.
    `;

    try {
        const chat = this.ai.chats.create({
            model: this.modelId,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8, // Slightly higher for creativity
                topK: 40
            }
        });

        // Build the prompt with history context manually to ensure robust stateless execution
        let fullPrompt = "";
        
        // Add limited history window (last 10 turns) to prevent context overflow while maintaining thread
        const recentHistory = history.slice(-10);
        
        if (recentHistory.length > 0) {
            fullPrompt += "--- PREVIOUS STORY CONTEXT ---\n";
            recentHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'host' ? 'HOST' : 'AI'}: ${msg.text}\n\n`;
            });
            fullPrompt += "--- END CONTEXT ---\n\n";
        }
        
        fullPrompt += `HOST'S CURRENT REQUEST: ${currentPrompt}`;

        const response = await chat.sendMessage({
            message: fullPrompt
        });

        return response.text || "I'm listening, but I couldn't generate a response. Please try again.";
    } catch (error) {
        console.error('Gemini API Error:', error);
        return "System Alert: I am having trouble connecting to the creative engine. Please check your network or API key.";
    }
  }
}
