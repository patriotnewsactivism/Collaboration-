
import { Injectable, signal, computed, effect } from '@angular/core';

export interface ChatMessage {
  id: string;
  role: 'host' | 'ai';
  text: string;
  timestamp: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
}

export interface Suggestion {
  id: string;
  author: string;
  text: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export type AppRole = 'host' | 'viewer' | 'unset';

interface AppState {
  messages: ChatMessage[];
  documents: DocumentItem[];
  suggestions: Suggestion[];
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  // Local User Role State
  readonly userRole = signal<AppRole>('unset');
  
  // Shared State
  readonly messages = signal<ChatMessage[]>([]);
  readonly documents = signal<DocumentItem[]>([]);
  readonly suggestions = signal<Suggestion[]>([]);

  private channel: BroadcastChannel;
  private readonly CHANNEL_NAME = 'collab_narrator_channel';

  constructor() {
    this.channel = new BroadcastChannel(this.CHANNEL_NAME);
    this.setupListeners();
    
    // Request state on load in case a host is already active
    this.channel.postMessage({ type: 'REQUEST_STATE' });
  }

  private setupListeners() {
    this.channel.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'REQUEST_STATE':
          // If I am the host, I should share the state with the new joiner
          if (this.userRole() === 'host') {
            this.broadcastState();
          }
          break;
        case 'SYNC_STATE':
          // Update local state from broadcast
          this.messages.set(payload.messages);
          this.documents.set(payload.documents);
          this.suggestions.set(payload.suggestions);
          break;
        case 'NEW_MESSAGE':
            this.messages.update(msgs => [...msgs, payload]);
            break;
        case 'NEW_DOCUMENT':
            this.documents.update(docs => [...docs, payload]);
            break;
        case 'NEW_SUGGESTION':
            this.suggestions.update(sugs => [payload, ...sugs]);
            break;
        case 'UPDATE_SUGGESTION':
            this.suggestions.update(sugs => 
                sugs.map(s => s.id === payload.id ? payload : s)
            );
            break;
      }
    };
  }

  setRole(role: AppRole) {
    this.userRole.set(role);
    if (role === 'host') {
        // If becoming host, maybe initialize some welcome state if empty
        if (this.messages().length === 0) {
            this.addMessage({
                id: crypto.randomUUID(),
                role: 'ai',
                text: 'Welcome to the collaboration session. I am ready to help you build your narrative. Please add documents or start typing.',
                timestamp: Date.now()
            });
        }
    }
  }

  // Actions
  broadcastState() {
    this.channel.postMessage({
      type: 'SYNC_STATE',
      payload: {
        messages: this.messages(),
        documents: this.documents(),
        suggestions: this.suggestions()
      }
    });
  }

  addMessage(msg: ChatMessage) {
    this.messages.update(msgs => [...msgs, msg]);
    this.channel.postMessage({ type: 'NEW_MESSAGE', payload: msg });
  }

  addDocument(doc: DocumentItem) {
    this.documents.update(docs => [...docs, doc]);
    this.channel.postMessage({ type: 'NEW_DOCUMENT', payload: doc });
  }

  addSuggestion(text: string, author: string = 'Anonymous Viewer') {
    const suggestion: Suggestion = {
      id: crypto.randomUUID(),
      author,
      text,
      status: 'pending',
      timestamp: Date.now()
    };
    this.suggestions.update(sugs => [suggestion, ...sugs]);
    this.channel.postMessage({ type: 'NEW_SUGGESTION', payload: suggestion });
  }

  updateSuggestionStatus(id: string, status: 'accepted' | 'rejected') {
    const current = this.suggestions().find(s => s.id === id);
    if (current) {
        const updated = { ...current, status };
        this.suggestions.update(sugs => sugs.map(s => s.id === id ? updated : s));
        this.channel.postMessage({ type: 'UPDATE_SUGGESTION', payload: updated });
    }
  }
}
