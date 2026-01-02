
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollaborationService } from '../services/collaboration.service';

@Component({
  selector: 'app-doc-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-gray-950 border-l border-gray-800">
      
      <!-- Tab Switcher -->
      <div class="flex border-b border-gray-800">
        <button 
          (click)="activeTab.set('docs')"
          [class.text-blue-400]="activeTab() === 'docs'"
          [class.border-blue-500]="activeTab() === 'docs'"
          class="flex-1 py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-gray-200 transition-colors">
          Documents ({{collab.documents().length}})
        </button>
        <button 
          (click)="activeTab.set('suggestions')"
          [class.text-purple-400]="activeTab() === 'suggestions'"
          [class.border-purple-500]="activeTab() === 'suggestions'"
          class="flex-1 py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-gray-200 transition-colors">
          Suggestions ({{collab.suggestions().length}})
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-4">
        
        <!-- DOCUMENTS TAB -->
        @if (activeTab() === 'docs') {
          <div class="space-y-4">
            @if (collab.userRole() === 'host') {
              <div class="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <h3 class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Add Context</h3>
                <input 
                  [(ngModel)]="newDocTitle"
                  placeholder="Document Title"
                  class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white mb-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <textarea 
                  [(ngModel)]="newDocContent"
                  placeholder="Paste text content here..."
                  rows="3"
                  class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                ></textarea>
                <button 
                  (click)="addDocument()"
                  [disabled]="!newDocTitle || !newDocContent"
                  class="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50">
                  + Add Document
                </button>
              </div>
            }

            @for (doc of collab.documents(); track doc.id) {
              <div class="bg-gray-900 rounded-lg p-3 border border-gray-800 hover:border-gray-600 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 class="font-semibold text-sm text-gray-200">{{ doc.title }}</h4>
                  </div>
                </div>
                <p class="text-xs text-gray-400 line-clamp-3 bg-gray-950 p-2 rounded">{{ doc.content }}</p>
              </div>
            } @empty {
              <div class="text-center py-8 text-gray-600 text-sm">
                No documents added yet.
              </div>
            }
          </div>
        }

        <!-- SUGGESTIONS TAB -->
        @if (activeTab() === 'suggestions') {
          <div class="space-y-4">
             <!-- Input for Viewers -->
             @if (collab.userRole() === 'viewer') {
               <div class="bg-gray-900 rounded-lg p-3 border border-purple-900/50">
                 <h3 class="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">Propose Idea</h3>
                 <textarea 
                   [(ngModel)]="suggestionText"
                   placeholder="Type a suggestion for the host..."
                   rows="3"
                   class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                 ></textarea>
                 <button 
                   (click)="submitSuggestion()"
                   [disabled]="!suggestionText"
                   class="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50">
                   Submit Suggestion
                 </button>
               </div>
             }

             @for (sug of collab.suggestions(); track sug.id) {
               <div class="bg-gray-900 rounded-lg p-3 border"
                    [class.border-gray-800]="sug.status === 'pending'"
                    [class.border-green-800]="sug.status === 'accepted'"
                    [class.border-red-900]="sug.status === 'rejected'"
                    [class.opacity-60]="sug.status === 'rejected'">
                 
                 <div class="flex justify-between items-start mb-2">
                   <span class="text-xs text-gray-500 font-medium">{{ sug.author }}</span>
                   <span class="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider"
                         [class.bg-gray-800]="sug.status === 'pending'"
                         [class.text-gray-400]="sug.status === 'pending'"
                         [class.bg-green-900]="sug.status === 'accepted'"
                         [class.text-green-400]="sug.status === 'accepted'"
                         [class.bg-red-900]="sug.status === 'rejected'"
                         [class.text-red-400]="sug.status === 'rejected'">
                     {{ sug.status }}
                   </span>
                 </div>
                 
                 <p class="text-sm text-gray-300 mb-3">{{ sug.text }}</p>

                 <!-- Host Actions -->
                 @if (collab.userRole() === 'host' && sug.status === 'pending') {
                   <div class="flex gap-2">
                     <button (click)="collab.updateSuggestionStatus(sug.id, 'accepted')" 
                             class="flex-1 py-1 bg-green-900 hover:bg-green-800 text-green-300 text-xs rounded border border-green-800 transition-colors">
                       Accept
                     </button>
                     <button (click)="collab.updateSuggestionStatus(sug.id, 'rejected')" 
                             class="flex-1 py-1 bg-red-900 hover:bg-red-800 text-red-300 text-xs rounded border border-red-800 transition-colors">
                       Reject
                     </button>
                   </div>
                 }
               </div>
             } @empty {
               <div class="text-center py-8 text-gray-600 text-sm">
                 No suggestions yet.
               </div>
             }
          </div>
        }
      </div>
    </div>
  `
})
export class DocManagerComponent {
  collab = inject(CollaborationService);
  activeTab = signal<'docs' | 'suggestions'>('docs');

  // Form states
  newDocTitle = '';
  newDocContent = '';
  suggestionText = '';

  addDocument() {
    if (!this.newDocTitle || !this.newDocContent) return;
    
    this.collab.addDocument({
      id: crypto.randomUUID(),
      title: this.newDocTitle,
      content: this.newDocContent
    });

    this.newDocTitle = '';
    this.newDocContent = '';
  }

  submitSuggestion() {
    if (!this.suggestionText) return;
    
    this.collab.addSuggestion(this.suggestionText);
    this.suggestionText = '';
  }
}
