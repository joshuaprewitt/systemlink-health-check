import {
  Component,
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ServiceStatus {
  name: string;
  status: string;
}

@Component({
  selector: 'app-health-check',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './health-check.component.html',
  styleUrl: './health-check.component.css',
})
export class HealthCheckComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  services: ServiceStatus[] = [];
  isRunning = false;
  lastRun: string | null = null;
  latencyMs: number | null = null;
  summary = '';
  errorMessage = '';

  ngOnInit(): void {
    this.fetchServices();
  }

  async fetchServices(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.services = [];
    this.errorMessage = '';
    this.syncView();

    const start = performance.now();

    try {
      const response = await fetch('/niserviceregistry/v1/services', {
        credentials: 'include',
      });
      this.latencyMs = Math.round(performance.now() - start);

      if (!response.ok) {
        this.errorMessage = `${response.status} ${response.statusText}`;
      } else {
        const data = await response.json();
        this.services = (data.services ?? []).sort((a: ServiceStatus, b: ServiceStatus) =>
          a.name.localeCompare(b.name)
        );
      }
    } catch (err) {
      this.latencyMs = Math.round(performance.now() - start);
      this.errorMessage = err instanceof Error ? err.message : String(err);
    }

    this.isRunning = false;
    this.lastRun = new Date().toLocaleTimeString();
    this.updateSummary();
    this.syncView();
  }

  private updateSummary(): void {
    if (this.errorMessage) {
      this.summary = `Failed to fetch service registry`;
      return;
    }
    const live = this.services.filter((s) => s.status === 'LIVE').length;
    const total = this.services.length;
    if (live === total) {
      this.summary = `All ${total} services LIVE`;
    } else {
      this.summary = `${live}/${total} LIVE, ${total - live} issue(s)`;
    }
  }

  statusIcon(status: string): string {
    return status === 'LIVE' ? '✓' : '✗';
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
