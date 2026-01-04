
import { Component, inject, signal, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyService } from '../services/daily.service';
import type { DailyParticipant } from '@daily-co/daily-js';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (daily.callState() === 'joined') {
      <div #videoContainer 
        class="fixed bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-[100] transition-all duration-300 ease-in-out flex flex-col overflow-hidden"
        [style.transform]="'translate(' + position().x + 'px, ' + position().y + 'px)'"
        [style.width]="isMinimized() ? '200px' : (daily.screenShareId() ? '600px' : '320px')"
        [style.height]="isMinimized() ? 'auto' : (daily.screenShareId() ? '450px' : '400px')"
        [class.bottom-4]="!isDragging"
        [class.right-4]="!isDragging">
        
        <!-- Draggable Header -->
        <div #dragHandle (mousedown)="onDragStart($event)" class="h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0 select-none">
          <div class="flex items-center gap-2">
             <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <span class="text-xs font-semibold text-gray-300">Live Audio & Screen</span>
          </div>
          <button (click)="toggleMinimize()" class="p-1 hover:bg-gray-700 rounded text-gray-400">
            @if(isMinimized()) {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4-4l-5 5M4 16v4m0 0h4m-4-4l-5-5m11 5v-4m0 0h-4m4 4l-5-5" /></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" /></svg>
            }
          </button>
        </div>

        @if(!isMinimized()) {
          
          <!-- MAIN CONTENT AREA -->
          <div class="flex-1 overflow-hidden relative flex flex-col">
             
             <!-- THEATER MODE (Screen Share Active) -->
             @if (daily.screenShareId(); as shareId) {
                <div class="flex-1 bg-black relative flex items-center justify-center">
                    <div class="w-full h-full" [id]="'screen-' + shareId"></div>
                    <!-- Overlay label -->
                    <div class="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                        {{ getParticipant(shareId)?.user_name || 'Presenter' }}'s Screen
                    </div>
                </div>
                <!-- Strip of Participants -->
                <div class="h-20 bg-gray-950 border-t border-gray-800 flex gap-2 p-2 overflow-x-auto">
                    @for(p of daily.participants(); track p.session_id) {
                        @if(p.session_id !== shareId) { <!-- Don't show sharer twice unless we want to -->
                            <div class="relative w-16 h-16 shrink-0 bg-gray-800 rounded-lg overflow-hidden border transition-colors"
                                 [class.border-green-500]="daily.activeSpeakerId() === p.session_id"
                                 [class.border-transparent]="daily.activeSpeakerId() !== p.session_id">
                                <div class="absolute inset-0" [id]="'video-' + p.session_id"></div>
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none" *ngIf="!p.video">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                                        {{ p.user_name?.slice(0,2) || 'U' }}
                                    </div>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white px-1 truncate text-center">
                                    {{ p.user_name }}
                                </div>
                            </div>
                        }
                    }
                </div>
             } 
             
             <!-- GRID MODE (Audio/Video Chat) -->
             @else {
                <div class="flex-1 p-2 grid gap-2 overflow-y-auto" 
                     [class.grid-cols-2]="daily.participants().length > 1"
                     [class.grid-cols-1]="daily.participants().length === 1">
                  @for(p of daily.participants(); track p.session_id) {
                    <div class="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 transition-all duration-200"
                         [class.border-green-500]="daily.activeSpeakerId() === p.session_id"
                         [class.border-transparent]="daily.activeSpeakerId() !== p.session_id"
                         [class.shadow-green-900/50]="daily.activeSpeakerId() === p.session_id"
                         [class.shadow-lg]="daily.activeSpeakerId() === p.session_id">
                      
                      <!-- Video container -->
                      <div class="absolute inset-0" [id]="'video-' + p.session_id"></div>
                      
                      <!-- Audio Visual Fallback -->
                      @if (!p.video) {
                          <div class="absolute inset-0 flex flex-col items-center justify-center">
                              <div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-300 relative">
                                  {{ p.user_name?.slice(0,2) || 'User' }}
                                  @if (daily.activeSpeakerId() === p.session_id) {
                                      <span class="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-75"></span>
                                  }
                              </div>
                              @if (!p.audio) {
                                  <div class="mt-2 text-red-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12.732a1 1 0 01-1.707.707L4.586 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.586l3.707-3.414a1 1 0 011.09-.51zM14.657 2.929a1 1 0 011.414 0A10 10 0 0119 10a10 10 0 01-2.929 7.071 1 1 0 01-1.414-1.414A8 8 0 0017 10a8 8 0 00-2.343-5.657 1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A6 6 0 0115 10a6 6 0 01-1.757 4.243 1 1 0 01-1.415-1.415A4 4 0 0013 10a4 4 0 00-1.172-2.828 1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                  </div>
                              }
                          </div>
                      }
                      
                      <!-- Name Tag -->
                      <div class="absolute bottom-1 left-1 right-1 flex justify-between items-end">
                          <span class="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm truncate max-w-[80%]">
                            {{ p.user_name }} {{ p.local ? '(You)' : '' }}
                          </span>
                      </div>
                    </div>
                  }
                </div>
             }
          </div>
        }

        <!-- Control Bar -->
        <div class="h-14 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-3 px-3 shrink-0">
          
          <!-- Mic Control -->
          <button (click)="daily.toggleMic()" 
            class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95"
            [class.bg-gray-600]="!getParticipant()?.audio"
            [class.bg-gray-700]="getParticipant()?.audio"
            [class.hover:bg-gray-600]="getParticipant()?.audio"
            [title]="getParticipant()?.audio ? 'Mute Mic' : 'Unmute Mic'">
             @if(getParticipant()?.audio) {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
             }
          </button>

          <!-- Camera Control (Default Off) -->
          <button (click)="daily.toggleCamera()" 
            class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95"
            [class.bg-blue-600]="getParticipant()?.video"
            [class.bg-gray-700]="!getParticipant()?.video"
            [class.hover:bg-gray-600]="!getParticipant()?.video"
            title="Toggle Camera">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>

          <!-- Screen Share Control -->
          <button (click)="daily.toggleScreenShare()" 
            class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95"
            [class.bg-green-600]="isScreenSharing()"
            [class.bg-gray-700]="!isScreenSharing()"
            [class.hover:bg-gray-600]="!isScreenSharing()"
            title="Share Screen">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </button>

          <div class="flex-1"></div>
          
          <button (click)="daily.leaveCall()" class="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-lg shadow-red-900/50">
            End Call
          </button>
        </div>
      </div>
    }
  `
})
export class VideoCallComponent implements AfterViewInit {
  daily = inject(DailyService);
  isMinimized = signal(false);
  position = signal({ x: 0, y: 0 });

  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLDivElement>;

  isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private positionStart = { x: 0, y: 0 };

  constructor() {
      // Re-run video attachment when participants or screen share changes
      effect(() => {
          const _ = this.daily.participants();
          const __ = this.daily.screenShareId();
          setTimeout(() => this.attachMedia(), 100);
      });
  }

  ngAfterViewInit() {
      // Handled by effect
  }

  toggleMinimize() {
    this.isMinimized.update(v => !v);
  }

  getParticipant(id?: string): DailyParticipant | undefined {
    const p = this.daily.participants();
    return id ? p.find(i => i.session_id === id) : p.find(i => i.local);
  }

  isScreenSharing(): boolean {
      const p = this.getParticipant();
      return p?.screenVideoTrack ? true : false;
  }
  
  private attachMedia() {
      if (!this.videoContainer) return;

      // Attach Screen Share if active
      const shareId = this.daily.screenShareId();
      if (shareId) {
          const shareP = this.getParticipant(shareId);
          const screenContainer = document.getElementById(`screen-${shareId}`);
          if (screenContainer && shareP?.screenVideoTrack) {
              this.attachTrack(screenContainer, shareP.screenVideoTrack, true); // Muted because it's video
          }
      }

      // Attach User Videos/Audio
      this.daily.participants().forEach(p => {
          const el = document.getElementById(`video-${p.session_id}`);
          if (el) {
              if (p.videoTrack) {
                  this.attachTrack(el, p.videoTrack, true);
              } else {
                 const videoEl = el.querySelector('video');
                 if(videoEl) videoEl.remove();
              }
              
              // Audio is handled automatically by Daily-js unless we customized it heavily,
              // but typically we need <audio> elements for remote participants if not handled by call object.
              // Daily-js default behavior is usually mixing audio. If strict mode, we attach.
              // Let's attach audio track to a hidden element just in case or rely on Daily default.
              // Daily.js handles audio automatically for 'active-speaker' mode usually, but explicit attach is safer for custom layouts.
              if (p.audioTrack && !p.local) {
                  this.attachAudio(p.audioTrack, p.session_id);
              }
          }
      });
  }
  
  private attachTrack(container: HTMLElement, track: MediaStreamTrack, muted: boolean) {
      let videoEl = container.querySelector('video');
      if (!videoEl) {
          videoEl = document.createElement('video');
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
          videoEl.style.objectFit = 'contain'; // changed to contain for screens
          container.appendChild(videoEl);
      }
      if (videoEl.srcObject instanceof MediaStream) {
          const currentTrack = videoEl.srcObject.getVideoTracks()[0];
          if (currentTrack?.id === track.id) return; // Already attached
      }
      const stream = new MediaStream([track]);
      videoEl.srcObject = stream;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.muted = true; // Always mute video elements to prevent feedback loops, we handle audio separately
  }

  private attachAudio(track: MediaStreamTrack, id: string) {
      let audioId = `audio-${id}`;
      let audioEl = document.getElementById(audioId) as HTMLAudioElement;
      if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.id = audioId;
          document.body.appendChild(audioEl);
      }
      if (audioEl.srcObject instanceof MediaStream) {
          const current = audioEl.srcObject.getAudioTracks()[0];
          if (current?.id === track.id) return;
      }
      audioEl.srcObject = new MediaStream([track]);
      audioEl.autoplay = true;
  }

  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.positionStart = { ...this.position() };
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  private onDrag = (event: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    this.position.set({
      x: this.positionStart.x + dx,
      y: this.positionStart.y + dy,
    });
  };

  private onDragEnd = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.onDragEnd);
  };
}
