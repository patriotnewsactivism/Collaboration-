
import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollaborationService } from '../services/collaboration.service';
import { GeminiService } from '../services/gemini.service';
import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, MarkdownPipe],
  template: `
    <div class="flex flex-col h-full bg-gray-900 text-white relative">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 shadow-sm z-10">
        <div>
          <h2 class="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            Live Narrative Stream
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">
            @if(collab.userRole() === 'host') {
              You are the Host (Broadcasting)
            } @else {
              Viewing Live (Read Only)
            }
          </p>
        </div>
        <div class="flex items-center gap-2">
           <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
             <span class="w-2 h-2 mr-1.5 bg-green-400 rounded-full animate-pulse"></span>
             Live
           </span>
        </div>
      </div>

      <!-- Messages Area -->
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        @for (msg of collab.messages(); track msg.id) {
          <div class="flex flex-col gap-1 animate-fadeIn" 
               [class.items-end]="msg.role === 'host'"
               [class.items-start]="msg.role === 'ai'">
            
            <div class="flex items-center gap-2 text-xs text-gray-400 px-1">
               <span class="font-medium">
                 {{ msg.role === 'host' ? 'Host' : 'Co-Narrator AI' }}
               </span>
               <span>{{ msg.timestamp | date:'shortTime' }}</span>
            </div>

            <div class="max-w-[85%] rounded-2xl p-4 shadow-md leading-relaxed"
                 [class.bg-blue-600]="msg.role === 'host'"
                 [class.text-white]="msg.role === 'host'"
                 [class.bg-gray-800]="msg.role === 'ai'"
                 [class.text-gray-100]="msg.role === 'ai'"
                 [class.rounded-br-none]="msg.role === 'host'"
                 [class.rounded-bl-none]="msg.role === 'ai'">
                 @if(msg.role === 'ai') {
                    <div [innerHTML]="msg.text | markdown"></div>
                 } @else {
                    <p class="whitespace-pre-wrap">{{ msg.text }}</p>
                 }
            </div>
          </div>
        }
        
        @if (isGenerating()) {
            <div class="flex flex-col gap-1 items-start animate-pulse">
                <div class="flex items-center gap-2 text-xs text-gray-400 px-1">
                   <span class="font-medium">Co-Narrator AI</span>
                </div>
                <div class="bg-gray-800 rounded-2xl rounded-bl-none p-4 shadow-md">
                    <div class="flex gap-1">
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                    </div>
                </div>
            </div>
        }
      </div>

      <!-- Host Input Area -->
      @if (collab.userRole() === 'host') {
        <div class="p-4 bg-gray-800 border-t border-gray-700">
          <div class="relative">
            <textarea
              [(ngModel)]="inputText"
              (keydown.enter)="handleEnter($event)"
              placeholder="Type your narrative instruction here..."
              class="w-full bg-gray-900 text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-4 pr-12 resize-none shadow-inner h-24 placeholder-gray-500"
              [disabled]="isGenerating()"></textarea>
            
            <button 
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || isGenerating()"
              class="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      } @else {
        <div class="p-4 bg-gray-800 border-t border-gray-700 text-center text-gray-400 italic">
          Only the host can add to the main narrative. You can send suggestions from the sidebar.
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
    }
  `]
})
export class ChatViewComponent {
  collab = inject(CollaborationService);
  gemini = inject(GeminiService);
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  inputText = '';
  isGenerating = signal(false);

  constructor() {
    // Auto-scroll on new messages
    effect(() => {
      const msgs = this.collab.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  handleEnter(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    if (!this.inputText.trim() || this.isGenerating()) return;

    const userText = this.inputText;
    this.inputText = '';
    this.isGenerating.set(true);

    // 1. Add Host Message
    this.collab.addMessage({
      id: crypto.randomUUID(),
      role: 'host',
      text: userText,
      timestamp: Date.now()
    });

    // 2. Call AI
    const responseText = await this.gemini.generateResponse(
        this.collab.messages().map(m => ({ role: m.role, text: m.text })),
        this.collab.documents(),
        userText
    );

    // 3. Add AI Response
    this.collab.addMessage({
      id: crypto.randomUUID(),
      role: 'ai',
      text: responseText,
      timestamp: Date.now()
    });

    this.isGenerating.set(false);
  }
}
