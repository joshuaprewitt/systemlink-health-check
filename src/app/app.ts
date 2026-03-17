import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { HealthCheckComponent } from './health-check/health-check.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HealthCheckComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  currentTheme: 'light' | 'dark' = 'light';
  private themeObserver: MutationObserver | null = null;

  ngOnInit(): void {
    this.currentTheme = this.detectInitialTheme();
    this.watchParentTheme();
  }

  ngOnDestroy(): void {
    this.themeObserver?.disconnect();
  }

  private detectInitialTheme(): 'light' | 'dark' {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryTheme = params.get('theme');
      if (queryTheme === 'light' || queryTheme === 'dark') {
        return queryTheme;
      }
    } catch {}

    try {
      if (window.parent !== window) {
        const parentProvider = window.parent.document.querySelector('nimble-theme-provider');
        const parentTheme = parentProvider?.getAttribute('theme');
        if (parentTheme === 'light' || parentTheme === 'dark') {
          return parentTheme;
        }
      }
    } catch {}

    try {
      const savedTheme = localStorage.getItem('sl_app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {}

    try {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}

    return 'light';
  }

  private watchParentTheme(): void {
    try {
      if (window.parent === window) {
        return;
      }

      const parentProvider = window.parent.document.querySelector('nimble-theme-provider');
      if (!parentProvider) {
        return;
      }

      this.themeObserver = new MutationObserver(() => {
        const parentTheme = parentProvider.getAttribute('theme');
        if (parentTheme === 'light' || parentTheme === 'dark') {
          this.currentTheme = parentTheme;
        }
      });

      this.themeObserver.observe(parentProvider, {
        attributes: true,
        attributeFilter: ['theme'],
      });
    } catch {}
  }
}
