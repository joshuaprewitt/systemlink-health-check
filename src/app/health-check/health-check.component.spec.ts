import { TestBed } from '@angular/core/testing';
import { HealthCheckComponent, ServiceCheck } from './health-check.component';
import { resolveTestResources } from '../../resolve-test-resources';

describe('HealthCheckComponent', () => {
  let component: HealthCheckComponent;

  beforeAll(async () => {
    await resolveTestResources();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthCheckComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HealthCheckComponent);
    component = fixture.componentInstance;

    // Prevent auto-run in tests
    vi.spyOn(component, 'runAllChecks').mockResolvedValue();
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes checks from service list', () => {
    expect(component.checks.length).toBeGreaterThan(0);
    expect(component.checks.every((c: ServiceCheck) => c.status === 'pending')).toBe(true);
  });

  it('resetChecks sets all to pending', () => {
    component.checks[0].status = 'pass';
    component.resetChecks();
    expect(component.checks.every((c: ServiceCheck) => c.status === 'pending')).toBe(true);
  });

  it('statusIcon returns correct symbols', () => {
    expect(component.statusIcon('pass')).toBe('✓');
    expect(component.statusIcon('fail')).toBe('✗');
    expect(component.statusIcon('error')).toBe('⚠');
    expect(component.statusIcon('running')).toBe('…');
    expect(component.statusIcon('pending')).toBe('○');
  });

  it('runAllChecks sets isRunning and calls fetch for each check', async () => {
    (component.runAllChecks as any).mockRestore();

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200, statusText: 'OK' })
    );

    await component.runAllChecks();

    expect(component.isRunning).toBe(false);
    expect(component.lastRun).toBeTruthy();
    expect(component.checks.every((c: ServiceCheck) => c.status === 'pass')).toBe(true);
  });

  it('marks checks as fail on non-ok response', async () => {
    (component.runAllChecks as any).mockRestore();

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{"message":"unauthorized"}', { status: 401, statusText: 'Unauthorized' })
    );

    await component.runAllChecks();

    expect(component.checks.every((c: ServiceCheck) => c.status === 'fail')).toBe(true);
    expect(component.checks[0].statusCode).toBe(401);
  });

  it('marks checks as error on network failure', async () => {
    (component.runAllChecks as any).mockRestore();

    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    await component.runAllChecks();

    expect(component.checks.every((c: ServiceCheck) => c.status === 'error')).toBe(true);
    expect(component.checks[0].message).toContain('Network error');
  });

  it('summary shows all healthy when all pass', async () => {
    (component.runAllChecks as any).mockRestore();

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200, statusText: 'OK' })
    );

    await component.runAllChecks();

    expect(component.summary).toContain('All');
    expect(component.summary).toContain('healthy');
  });

  it('summary shows issues when some fail', async () => {
    (component.runAllChecks as any).mockRestore();

    let callCount = 0;
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(new Response('{}', { status: 500, statusText: 'Error' }));
      }
      return Promise.resolve(new Response('{}', { status: 200, statusText: 'OK' }));
    });

    await component.runAllChecks();

    expect(component.summary).toContain('issue');
  });
});
