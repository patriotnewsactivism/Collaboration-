
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    // Very basic markdown parsing for demo purposes
    // 1. Headers
    let html = value
      .replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg my-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl my-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl my-4">$1</h1>');
      
    // 2. Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // 3. Lists
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    
    // 4. Line breaks
    html = html.replace(/\n/gim, '<br>');
    
    return html;
  }
}
