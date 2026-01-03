
import { Injectable } from '@angular/core';
import { ChatMessage, DocumentItem, Suggestion } from './collaboration.service';

export interface ProjectState {
  messages: ChatMessage[];
  documents: DocumentItem[];
  suggestions: Suggestion[];
  lastModified: number;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly KEY = 'conarrator_project_v1';

  saveLocal(state: ProjectState) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Storage quota exceeded or error', e);
    }
  }

  loadLocal(): ProjectState | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  exportJSON(state: ProjectState) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "conarrator_project_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  async importJSON(file: File): Promise<ProjectState> {
    const text = await file.text();
    return JSON.parse(text);
  }
  
  clearLocal() {
      localStorage.removeItem(this.KEY);
  }
}
