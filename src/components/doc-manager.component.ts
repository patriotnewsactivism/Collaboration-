
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
      <div class="flex border-b border-gray-800 shrink-0">
        <button 
          (click)="activeTab.set('docs')"
          [class.text-blue-400]="activeTab() === 'docs'"
          [class.border-blue-500]="activeTab() === 'docs'"
          class="flex-1 py-4 md:py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-gray-200 transition-colors touch-manipulation">
          Documents ({{collab.documents().length}})
        </button>
        <button 
          (click)="activeTab.set('suggestions')"
          [class.text-purple-400]="activeTab() === 'suggestions'"
          [class.border-purple-500]="activeTab() === 'suggestions'"
          class="flex-1 py-4 md:py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-gray-200 transition-colors touch-manipulation">
          Contributions ({{collab.suggestions().length}})
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-4 md:p-4 pb-20 md:pb-4">
        
        <!-- DOCUMENTS TAB -->
        @if (activeTab() === 'docs') {
          <div class="space-y-4">
            @if (collab.userRole() === 'host') {
              <div class="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <h3 class="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Add Context</h3>
                
                <!-- Drop Zone -->
                <div 
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)"
                    class="mb-4 relative group cursor-pointer">
                  
                  <input #fileInput type="file" multiple class="hidden" (change)="handleFileUpload($event)" accept=".txt,.md,.json,.csv,.js,.ts,.html,.css,.py,.java" />
                  
                  <div (click)="fileInput.click()" 
                       class="w-full py-6 border-2 border-dashed rounded-lg transition-all flex flex-col items-center justify-center gap-2 text-sm font-medium p-4 text-center"
                       [class.border-blue-500]="isDragging()"
                       [class.bg-blue-900/20]="isDragging()"
                       [class.text-blue-400]="isDragging()"
                       [class.border-gray-700]="!isDragging()"
                       [class.bg-gray-800/50]="!isDragging()"
                       [class.text-gray-400]="!isDragging()"
                       [class.hover:bg-gray-800]="!isDragging()"
                       [class.hover:border-blue-500]="!isDragging()"
                       [class.hover:text-blue-400]="!isDragging()">
                    
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>{{ isDragging() ? 'Drop files here' : 'Click to Upload or Drag & Drop' }}</span>
                    <p class="text-[10px] text-gray-500 mt-1">
                        Text files only (.txt, .md, code, etc.)<br>
                        Multiple files supported
                    </p>
                  </div>
                </div>

                <div class="relative flex items-center justify-center mb-4">
                   <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-800"></div></div>
                   <span class="relative bg-gray-900 px-2 text-[10px] text-gray-500 uppercase">Or type manually</span>
                </div>

                <input [(ngModel)]="newDocTitle" placeholder="Document Title" class="w-full bg-gray-800 border border-gray-700 rounded p-3 md:p-2 text-base md:text-sm text-white mb-3 md:mb-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
                <textarea [(ngModel)]="newDocContent" placeholder="Paste text content here..." rows="5" class="w-full bg-gray-800 border border-gray-700 rounded p-3 md:p-2 text-base md:text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"></textarea>
                <button (click)="addManualDocument()" [disabled]="!newDocTitle || !newDocContent" class="mt-3 md:mt-2 w-full py-3 md:py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm md:text-xs font-bold rounded transition-colors disabled:opacity-50 touch-manipulation">
                  + Add Manually
                </button>
              </div>
            }

            @for (doc of collab.documents(); track doc.id) {
              <div class="bg-gray-900 rounded-lg p-3 border border-gray-800 hover:border-gray-600 transition-colors group relative">
                @if (collab.userRole() === 'host') {
                    <button (click)="removeDocument(doc.id)" class="absolute top-2 right-2 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove Document">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                }
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h4 class="font-semibold text-sm text-gray-200">{{ doc.title }}</h4>
                  </div>
                </div>
                <div class="bg-gray-950 p-2 rounded border border-gray-800/50 max-h-32 overflow-y-auto">
                    <p class="text-xs text-gray-400 font-mono whitespace-pre-wrap">{{ doc.content }}</p>
                </div>
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
             @if (collab.userRole() === 'viewer') {
               <div class="bg-gray-900 rounded-lg p-3 border border-purple-900/50">
                 <h3 class="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">Contribute Text Snippet</h3>
                 <textarea [(ngModel)]="suggestionText" placeholder="Type a contribution for the host..." rows="3" class="w-full bg-gray-800 border border-gray-700 rounded p-3 md:p-2 text-base md:text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"></textarea>
                 <button (click)="submitSuggestion()" [disabled]="!suggestionText" class="mt-3 md:mt-2 w-full py-3 md:py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm md:text-xs font-bold rounded transition-colors disabled:opacity-50 touch-manipulation">
                   Submit Contribution
                 </button>
               </div>
             }

             @for (sug of collab.suggestions(); track sug.id) {
               <div class="bg-gray-900 rounded-lg p-3 border" [class.border-gray-800]="sug.status === 'pending'" [class.border-green-800]="sug.status === 'accepted'" [class.border-red-900]="sug.status === 'rejected'" [class.opacity-60]="sug.status !== 'pending'">
                 <div class="flex justify-between items-start mb-2">
                   <span class="text-xs text-gray-500 font-medium">{{ sug.author }}</span>
                   <span class="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider" [class.bg-gray-800]="sug.status === 'pending'" [class.text-gray-400]="sug.status === 'pending'" [class.bg-green-900]="sug.status === 'accepted'" [class.text-green-400]="sug.status === 'accepted'" [class.bg-red-900]="sug.status === 'rejected'" [class.text-red-400]="sug.status === 'rejected'">
                     {{ sug.status }}
                   </span>
                 </div>
                 
                 <p class="text-sm text-gray-300 mb-3">{{ sug.text }}</p>

                 @if (collab.userRole() === 'host' && sug.status === 'pending') {
                   <div class="flex gap-2">
                     <button (click)="collab.updateSuggestionStatus(sug.id, 'accepted')" class="flex-1 py-3 md:py-1 bg-green-900 hover:bg-green-800 text-green-300 text-xs rounded border border-green-800 transition-colors touch-manipulation">Accept</button>
                     <button (click)="collab.updateSuggestionStatus(sug.id, 'rejected')" class="flex-1 py-3 md:py-1 bg-red-900 hover:bg-red-800 text-red-300 text-xs rounded border border-red-800 transition-colors touch-manipulation">Reject</button>
                   </div>
                 }
               </div>
             } @empty {
               <div class="text-center py-8 text-gray-600 text-sm">
                 No contributions yet.
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
  newDocTitle = '';
  newDocContent = '';
  suggestionText = '';
  isDragging = signal(false);

  // Drag handlers
  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    if (e.dataTransfer?.files) {
      await this.processFiles(e.dataTransfer.files);
    }
  }

  async handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      await this.processFiles(input.files);
    }
    input.value = '';
  }

  async processFiles(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const content = await file.text();
        this.collab.addDocument({
          id: crypto.randomUUID(),
          title: file.name,
          content: content
        });
      } catch (e) {
        console.error("Error reading file", file.name, e);
        // Silently fail for binary files in this demo, or we could add a toast notification service
      }
    }
  }

  addManualDocument() {
    if (!this.newDocTitle || !this.newDocContent) return;
    this.collab.addDocument({ id: crypto.randomUUID(), title: this.newDocTitle, content: this.newDocContent });
    this.newDocTitle = '';
    this.newDocContent = '';
  }
  
  removeDocument(id: string) {
      this.collab.removeDocument(id);
  }

  submitSuggestion() {
    if (!this.suggestionText) return;
    this.collab.addSuggestion(this.suggestionText);
    this.suggestionText = '';
  }
}
