import {
  Component,
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ServiceCheck {
  name: string;
  endpoint: string;
  method: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'error';
  statusCode: number | null;
  latencyMs: number | null;
  message: string;
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

  checks: ServiceCheck[] = [];
  isRunning = false;
  lastRun: string | null = null;
  summary = '';

  private readonly serviceChecks: { name: string; endpoint: string; method?: string }[] = [
    { name: 'User / Auth', endpoint: '/niuser/v1/auth' },
    { name: 'Workspaces', endpoint: '/niuser/v1/workspaces?take=1' },
    { name: 'Tags', endpoint: '/nitag/v2/tags?take=1' },
    { name: 'Tag Subscriptions', endpoint: '/nitag/v2/subscriptions?take=1' },
    { name: 'Test Monitor — Results', endpoint: '/nitestmonitor/v2/results?take=1' },
    { name: 'Test Monitor — Steps', endpoint: '/nitestmonitor/v2/steps?take=1' },
    { name: 'Test Monitor — Products', endpoint: '/nitestmonitor/v2/products?take=1' },
    { name: 'Asset Management', endpoint: '/niapm/v1/assets?take=1' },
    { name: 'Systems Management', endpoint: '/nisysmgmt/v1/query-systems', method: 'POST' },
    { name: 'File Service', endpoint: '/nifile/v1/service-groups/Default/files?take=1' },
    { name: 'Notebook Execution', endpoint: '/ninotebook/v1/executions?take=1' },
    { name: 'Feeds', endpoint: '/nifeed/v1/feeds?take=1' },
    { name: 'Work Items', endpoint: '/niworkorder/v1/query-workitems', method: 'POST' },
    { name: 'Work Item Templates', endpoint: '/niworkitem/v1/query-workitem-templates', method: 'POST' },
    { name: 'Dashboards', endpoint: '/nidashboard/v2/dashboards?take=1' },
    { name: 'Alarm Rules', endpoint: '/nialarmrule/v1/rules?take=1' },
    { name: 'Data Spaces', endpoint: '/nidataspace/v1/spaces?take=1' },
    { name: 'Spec Compliance', endpoint: '/nispec/v1/specs?take=1' },
  ];

  ngOnInit(): void {
    this.resetChecks();
    this.runAllChecks();
  }

  resetChecks(): void {
    this.checks = this.serviceChecks.map((s) => ({
      name: s.name,
      endpoint: s.endpoint,
      method: s.method || 'GET',
      status: 'pending',
      statusCode: null,
      latencyMs: null,
      message: '',
    }));
  }

  async runAllChecks(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.resetChecks();
    this.syncView();

    const promises = this.checks.map((check, index) => this.runCheck(index));
    await Promise.allSettled(promises);

    this.isRunning = false;
    this.lastRun = new Date().toLocaleTimeString();
    this.updateSummary();
    this.syncView();
  }

  private async runCheck(index: number): Promise<void> {
    const check = this.checks[index];
    check.status = 'running';
    this.syncView();

    const start = performance.now();

    try {
      const options: RequestInit = {
        method: check.method,
        credentials: 'include',
      };

      if (check.method === 'POST') {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify({ take: 1 });
      }

      const response = await fetch(check.endpoint, options);
      const elapsed = Math.round(performance.now() - start);

      check.statusCode = response.status;
      check.latencyMs = elapsed;

      if (response.ok) {
        check.status = 'pass';
        check.message = `${response.status} OK`;
      } else {
        check.status = 'fail';
        let detail = '';
        try {
          const body = await response.text();
          const parsed = JSON.parse(body);
          detail = parsed.error?.message || parsed.message || '';
        } catch {}
        check.message = `${response.status} ${response.statusText}${detail ? ': ' + detail : ''}`;
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      check.latencyMs = elapsed;
      check.status = 'error';
      check.message = err instanceof Error ? err.message : String(err);
    }

    this.syncView();
  }

  private updateSummary(): void {
    const pass = this.checks.filter((c) => c.status === 'pass').length;
    const fail = this.checks.filter((c) => c.status === 'fail').length;
    const error = this.checks.filter((c) => c.status === 'error').length;
    const total = this.checks.length;

    if (fail === 0 && error === 0) {
      this.summary = `All ${total} services healthy`;
    } else {
      this.summary = `${pass}/${total} healthy, ${fail + error} issue(s)`;
    }
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'error': return '⚠';
      case 'running': return '…';
      default: return '○';
    }
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
