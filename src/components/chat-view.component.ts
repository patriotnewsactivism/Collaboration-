
import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollaborationService } from '../services/collaboration.service';
import { DailyService } from '../services/daily.service';
import { GeminiService } from '../services/gemini.service';
import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, MarkdownPipe],
  template: `
    <div class="flex flex-col h-full bg-gray-900 text-white relative">
      <!-- Header -->
      <div class="p-3 md:p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 shadow-sm z-10 shrink-0 gap-2">
        <div class="min-w-0 flex-1">
          <h2 class="text-base md:text-lg font-semibold text-gray-100 flex items-center gap-2 truncate">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <span class="truncate">Live Narrative Stream</span>
          </h2>
          <p class="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate flex items-center gap-2">
            @if(collab.userRole() === 'host') {
              <span class="text-blue-400 font-medium">Host (Broadcasting)</span>
            } @else {
              <span class="text-purple-400 font-medium">Viewer (Read Only)</span>
            }
            <span class="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span>{{ collab.messages().length }} events</span>
          </p>
        </div>
        
        <!-- Controls -->
        <div class="flex items-center gap-2 shrink-0">
           <!-- Project Menu -->
           <div class="relative group">
             <button class="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
             </button>
             <div class="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
               <button (click)="collab.exportProject()" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-700 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
                 Download Project
               </button>
               <div class="relative w-full">
                 <input #importInput type="file" class="hidden" (change)="handleImport($event)" accept=".json" />
                 <button (click)="importInput.click()" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   Import Project
                 </button>
               </div>
               <button (click)="handleInvite()" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Invite Others
               </button>
               <button (click)="collab.clearProject()" class="w-full text-left px-4 py-3 text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-2 border-t border-gray-700">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 Clear All
               </button>
             </div>
           </div>

           <button (click)="handleCallButtonClick()" [disabled]="daily.callState() === 'joining'"
             class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
             [ngClass]="{
                'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20': daily.callState() === 'idle',
                'bg-red-500 hover:bg-red-600 text-white': daily.callState() === 'joined',
                'bg-gray-600 text-gray-300 cursor-not-allowed': daily.callState() === 'joining'
             }">
             @if(daily.callState() === 'idle') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span class="hidden md:inline">{{ collab.userRole() === 'host' ? 'Start Live' : 'Join Live' }}</span>
                <span class="md:hidden">Live</span>
             } @else if(daily.callState() === 'joined') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                <span class="hidden md:inline">End</span>
             } @else {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             }
           </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div #scrollContainer class="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 scroll-smooth">
        @for (msg of collab.messages(); track msg.id) {
          <div class="flex flex-col gap-1 animate-fadeIn" 
               [class.items-end]="msg.role === 'host'"
               [class.items-start]="msg.role === 'ai' || msg.role === 'viewer'">
            
            <div class="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 px-1">
               <span class="font-medium">
                 {{ msg.role === 'host' ? 'Host' : msg.role === 'ai' ? 'Co-Narrator AI' : msg.author }}
               </span>
               <span>{{ msg.timestamp | date:'shortTime' }}</span>
            </div>

            <div class="max-w-[90%] md:max-w-[85%] rounded-2xl p-3 md:p-4 shadow-md leading-relaxed text-sm md:text-base"
                 [class.bg-blue-600]="msg.role === 'host'"
                 [class.text-white]="msg.role === 'host'"
                 [class.bg-gray-800]="msg.role === 'ai'"
                 [class.text-gray-100]="msg.role === 'ai'"
                 [class.bg-purple-800]="msg.role === 'viewer'"
                 [class.text-purple-100]="msg.role === 'viewer'"
                 [class.rounded-br-none]="msg.role === 'host'"
                 [class.rounded-bl-none]="msg.role === 'ai' || msg.role === 'viewer'">
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
        
        <!-- Spacer for auto-scroll visibility -->
        <div class="h-2"></div>
      </div>

      <!-- Host Input Area -->
      @if (collab.userRole() === 'host') {
        <div class="p-3 md:p-4 bg-gray-800 border-t border-gray-700 shrink-0">
          <div class="relative">
            <textarea
              [(ngModel)]="inputText"
              (keydown.enter)="handleEnter($event)"
              placeholder="Type your narrative instruction here..."
              class="w-full bg-gray-900 text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-3 md:p-4 pr-12 resize-none shadow-inner h-16 md:h-24 placeholder-gray-500 text-base"
              [disabled]="isGenerating()"></textarea>
            
            <button 
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || isGenerating()"
              class="absolute right-2 bottom-2 md:right-3 md:bottom-3 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <p class="hidden md:block text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      } @else {
        <div class="p-4 bg-gray-800 border-t border-gray-700 text-center text-gray-400 italic text-sm md:text-base shrink-0">
          Only the host can add to the main narrative. You can send contributions from the Docs tab.
        </div>
      }
      
      <!-- Invite Modal (Simple Alert for Demo) -->
      <div *ngIf="showInviteModal" class="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl">
          <h3 class="text-xl font-bold text-white mb-4">Invite Collaborators</h3>
          
          <div class="space-y-4">
            <div>
                <label class="text-xs text-purple-400 uppercase font-bold tracking-wider">Viewer Link (Read Only)</label>
                <div class="flex gap-2 mt-1">
                    <input readonly [value]="getInviteLink('viewer')" class="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-400 select-all" />
                    <button (click)="copyLink('viewer')" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">Copy</button>
                </div>
            </div>
            
            <div>
                <label class="text-xs text-blue-400 uppercase font-bold tracking-wider">Co-Author Link (Full Access)</label>
                <div class="flex gap-2 mt-1">
                    <input readonly [value]="getInviteLink('host')" class="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-400 select-all" />
                    <button (click)="copyLink('host')" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">Copy</button>
                </div>
            </div>
            
            <p class="text-[10px] text-gray-500 italic mt-2">
                Note: Links work immediately for tabs on this device. For remote users, please "Download Project" and send them the file.
            </p>
          </div>
          
          <button (click)="showInviteModal = false" class="mt-6 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium">Close</button>
        </div>
      </div>
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
  daily = inject(DailyService);
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  inputText = '';
  isGenerating = signal(false);
  showInviteModal = false;

  constructor() {
    effect(() => {
      const msgs = this.collab.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  handleCallButtonClick() {
    if (this.daily.callState() === 'joined') {
      this.daily.leaveCall();
    } else if (this.daily.callState() === 'idle') {
      // Privacy check before starting
      if (this.collab.userRole() === 'host') {
          if(confirm("Start Live Session?\n\n- Audio will be enabled (Call Mode).\n- You will be prompted to share your screen.\n\nPlease ensure no sensitive information is visible.")) {
            const url = `https://co-narrator.daily.co/co-narrator-${Date.now()}`;
            this.collab.setRoomUrl(url);
            // Host joins: Auto-start screen share
            this.daily.joinCall(url, true);
          }
      } else {
        const roomUrl = this.collab.roomUrl();
        if (roomUrl) {
          // Viewer joins: No auto screen share
          this.daily.joinCall(roomUrl, false);
        } else {
          alert("Host has not started the call yet.");
        }
      }
    }
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

    this.collab.addMessage({
      id: crypto.randomUUID(),
      role: 'host',
      text: userText,
      timestamp: Date.now()
    });

    const responseText = await this.gemini.generateResponse(
        this.collab.messages().map(m => ({ role: m.role, text: m.text })),
        this.collab.documents(),
        userText
    );

    this.collab.addMessage({
      id: crypto.randomUUID(),
      role: 'ai',
      text: responseText,
      timestamp: Date.now()
    });

    this.isGenerating.set(false);
  }

  async handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
        const success = await this.collab.importProject(input.files[0]);
        if(success) alert("Project loaded successfully!");
        input.value = '';
    }
  }

  handleInvite() {
      this.showInviteModal = true;
  }

  getInviteLink(role: 'host' | 'viewer') {
      const url = new URL(window.location.href);
      url.searchParams.set('role', role);
      return url.toString();
  }

  copyLink(role: 'host' | 'viewer') {
      navigator.clipboard.writeText(this.getInviteLink(role));
      alert("Link copied to clipboard!");
  }
}
