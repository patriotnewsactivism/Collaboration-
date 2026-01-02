
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollaborationService, AppRole } from './services/collaboration.service';
import { ChatViewComponent } from './components/chat-view.component';
import { DocManagerComponent } from './components/doc-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatViewComponent, DocManagerComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  collab = inject(CollaborationService);

  selectRole(role: AppRole) {
    this.collab.setRole(role);
  }
}
