
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { StorageService, ProjectState } from './storage.service';

export interface ChatMessage {
  id: string;
  role: 'host' | 'ai' | 'viewer';
  text: string;
  timestamp: number;
  author?: string;
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

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private storage = inject(StorageService);

  // Local User Role State
  readonly userRole = signal<AppRole>('unset');
  
  // Shared State
  readonly messages = signal<ChatMessage[]>([]);
  readonly documents = signal<DocumentItem[]>([]);
  readonly suggestions = signal<Suggestion[]>([]);
  readonly roomUrl = signal<string | null>(null);

  private channel: BroadcastChannel;
  private readonly CHANNEL_NAME = 'collab_narrator_channel';

  constructor() {
    this.channel = new BroadcastChannel(this.CHANNEL_NAME);
    
    // 1. Try to load local state immediately
    this.restoreState();

    // 2. Setup sync listeners
    this.setupListeners();
    
    // 3. Auto-save effect
    effect(() => {
      // Only hosts or standalone users should dictate the save state ideally, 
      // but in a peer system, we save what we see.
      const state: ProjectState = {
        messages: this.messages(),
        documents: this.documents(),
        suggestions: this.suggestions(),
        lastModified: Date.now()
      };
      if (state.messages.length > 0 || state.documents.length > 0) {
        this.storage.saveLocal(state);
      }
    });
    
    // 4. Request latest state from network peers (overrides local if peer exists)
    this.channel.postMessage({ type: 'REQUEST_STATE' });
  }

  private restoreState() {
    const saved = this.storage.loadLocal();
    if (saved) {
      this.messages.set(saved.messages || []);
      this.documents.set(saved.documents || []);
      this.suggestions.set(saved.suggestions || []);
    }
  }

  private setupListeners() {
    this.channel.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'REQUEST_STATE':
          if (this.userRole() === 'host') {
            this.broadcastState();
          }
          break;
        case 'SYNC_STATE':
          // We assume the network state is newer/truer if we are joining
          this.messages.set(payload.messages);
          this.documents.set(payload.documents);
          this.suggestions.set(payload.suggestions);
          this.roomUrl.set(payload.roomUrl);
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
        case 'SET_ROOM_URL':
            this.roomUrl.set(payload);
            break;
      }
    };
  }

  setRole(role: AppRole) {
    this.userRole.set(role);
    if (role === 'host') {
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

  broadcastState() {
    this.channel.postMessage({
      type: 'SYNC_STATE',
      payload: {
        messages: this.messages(),
        documents: this.documents(),
        suggestions: this.suggestions(),
        roomUrl: this.roomUrl(),
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

        if (status === 'accepted') {
          const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'viewer',
            text: current.text,
            author: current.author,
            timestamp: Date.now(),
          };
          this.addMessage(chatMessage);
        }
    }
  }
  
  setRoomUrl(url: string) {
      this.roomUrl.set(url);
      this.channel.postMessage({ type: 'SET_ROOM_URL', payload: url });
  }

  // --- Persistence Methods Exposed for UI ---
  exportProject() {
    const state: ProjectState = {
        messages: this.messages(),
        documents: this.documents(),
        suggestions: this.suggestions(),
        lastModified: Date.now()
    };
    this.storage.exportJSON(state);
  }

  async importProject(file: File) {
    try {
        const state = await this.storage.importJSON(file);
        this.messages.set(state.messages || []);
        this.documents.set(state.documents || []);
        this.suggestions.set(state.suggestions || []);
        this.broadcastState(); // Sync loaded state to peers
        return true;
    } catch(e) {
        console.error("Failed to import", e);
        return false;
    }
  }

  clearProject() {
      this.messages.set([]);
      this.documents.set([]);
      this.suggestions.set([]);
      this.roomUrl.set(null);
      this.storage.clearLocal();
      this.broadcastState();
      // Re-init host msg
      if (this.userRole() === 'host') {
          this.setRole('host');
      }
  }
}
