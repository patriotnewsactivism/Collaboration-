import { Injectable, signal, effect, OnDestroy } from '@angular/core';
import Daily, { DailyCall, DailyParticipant } from '@daily-co/daily-js';

export type CallState = 'idle' | 'joining' | 'joined' | 'leaving' | 'error';

@Injectable({
  providedIn: 'root'
})
export class DailyService implements OnDestroy {
  callObject = signal<DailyCall | null>(null);
  callState = signal<CallState>('idle');
  participants = signal<DailyParticipant[]>([]);
  
  // Track specific states for UI layout
  activeSpeakerId = signal<string | null>(null);
  screenShareId = signal<string | null>(null); // Session ID of person sharing screen
  
  // Local state
  private isScreenSharing = signal(false);

  constructor() {
    effect(() => {
        const co = this.callObject();
        if (co) this.setupListeners(co);
    }, { allowSignalWrites: true });
  }

  ngOnDestroy() {
    this.callObject()?.destroy();
  }

  async joinCall(url: string, startScreenShare = false) {
    if (this.callState() !== 'idle') return;
    
    this.callState.set('joining');
    try {
      const co = Daily.createCallObject();
      this.callObject.set(co); // This triggers setupListeners via effect

      // Default: Audio ON (Phone call style), Camera OFF
      await co.join({ 
        url,
        audioSource: true, 
        videoSource: false 
      });
      
      this.callState.set('joined');

      if (startScreenShare) {
          // Small delay to ensure browser readiness
          setTimeout(() => {
              this.toggleScreenShare().catch(e => console.warn("Auto screen share cancelled/failed", e));
          }, 500);
      }

    } catch (e) {
      console.error('Failed to join call', e);
      this.callState.set('error');
      this.callObject.set(null);
    }
  }

  async leaveCall() {
    const co = this.callObject();
    if (!co) return;

    this.callState.set('leaving');
    try {
        await co.leave();
        await co.destroy();
    } catch(e) { console.error("Error leaving", e); }
    
    this.callObject.set(null);
    this.callState.set('idle');
    this.participants.set([]);
    this.activeSpeakerId.set(null);
    this.screenShareId.set(null);
    this.isScreenSharing.set(false);
  }

  toggleCamera() {
    const co = this.callObject();
    if (!co) return;
    const currentVideoState = co.localVideo();
    co.setLocalVideo(!currentVideoState);
  }

  toggleMic() {
    const co = this.callObject();
    if (!co) return;
    const currentAudioState = co.localAudio();
    co.setLocalAudio(!currentAudioState);
  }

  async toggleScreenShare() {
      const co = this.callObject();
      if (!co) return;

      if(this.isScreenSharing()) {
          co.stopScreenShare();
      } else {
          await co.startScreenShare();
      }
  }

  private setupListeners(co: DailyCall) {
    co.on('participant-joined', this.updateParticipants)
      .on('participant-updated', this.updateParticipants)
      .on('participant-left', this.updateParticipants)
      .on('active-speaker-change', (e) => {
          this.activeSpeakerId.set(e.activeSpeaker?.peerId || null);
      })
      .on('error', (e) => {
        console.error('Daily call error', e);
        this.callState.set('error');
      })
      .on('left-meeting', () => {
          this.leaveCall();
      })
      .on('track-started', (e: any) => {
        if(e.track.kind === 'screenVideo') {
            if (e.participant?.local) this.isScreenSharing.set(true);
            this.screenShareId.set(e.participant?.session_id || null);
        }
        this.updateParticipants();
      })
      .on('track-stopped', (e: any) => {
        if(e.track.kind === 'screenVideo') {
            if (e.participant?.local) this.isScreenSharing.set(false);
            // Re-check if anyone else is sharing (simple approach: just clear if it was this user)
            if (this.screenShareId() === e.participant?.session_id) {
                this.screenShareId.set(null);
                // Ideally we scan participants to see if anyone else is sharing
                const sharer = (Object.values(co.participants()) as any[]).find(p => p.screenVideoTrack);
                if (sharer) this.screenShareId.set(sharer.session_id);
            }
        }
        this.updateParticipants();
      });
    
    // Initial participant state
    this.updateParticipants();
  }

  private updateParticipants = () => {
    const co = this.callObject();
    if (!co) return;
    const parts = Object.values(co.participants());
    this.participants.set(parts);
    
    // Sync screen share state if we missed an event
    const sharer = parts.find(p => (p as any).screenVideoTrack);
    this.screenShareId.set(sharer?.session_id || null);
  };
}