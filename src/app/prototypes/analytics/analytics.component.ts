import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-analytics',
  template: `
    <iframe [src]="iframeSrc" class="prototype-frame"></iframe>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }
      .prototype-frame {
        width: 100%;
        height: 100%;
        border: none;
      }
    `
  ]
})
export class AnalyticsComponent {
  iframeSrc: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl('assets/prototypes/analytics.html');
  }
}
