
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollaborationService, AppRole } from './services/collaboration.service';
import { ChatViewComponent } from './components/chat-view.component';
import { DocManagerComponent } from './components/doc-manager.component';
import { VideoCallComponent } from './components/video-call.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatViewComponent, DocManagerComponent, VideoCallComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  collab = inject(CollaborationService);
  
  // Mobile Navigation State ('chat' | 'docs')
  activeMobileTab = signal<'chat' | 'docs'>('chat');

  ngOnInit() {
    // Check for invite links (e.g., ?role=viewer or ?role=host)
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    
    if (roleParam === 'host' || roleParam === 'viewer') {
      this.collab.setRole(roleParam as AppRole);
      // Clean URL without refresh
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  selectRole(role: AppRole) {
    this.collab.setRole(role);
  }
}
