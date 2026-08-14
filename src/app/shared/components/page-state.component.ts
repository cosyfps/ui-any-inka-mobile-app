import { Component, Input } from '@angular/core';
import { LucideAlertCircle, LucideInbox, LucideWifi, LucideRefreshCw } from '@lucide/angular';

export type PageStateType = 'loading' | 'error' | 'empty' | 'offline';

@Component({
  selector: 'inka-page-state',
  standalone: true,
  imports: [LucideAlertCircle, LucideInbox, LucideWifi, LucideRefreshCw],
  template: `
    @switch (type) {
      @case ('loading') {
        <div class="state">
          <div class="skeleton-group">
            <div class="skeleton-header">
              <div class="inka-skeleton-circle" style="width:44px;height:44px"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:8px">
                <div class="inka-skeleton-text lg"></div>
                <div class="inka-skeleton-text sm"></div>
              </div>
            </div>
            <div class="inka-skeleton-card"></div>
            <div class="skeleton-row">
              <div class="inka-skeleton-card" style="height:100px"></div>
              <div class="inka-skeleton-card" style="height:100px"></div>
            </div>
            <div class="inka-skeleton-card" style="height:80px"></div>
          </div>
        </div>
      }
      @case ('error') {
        <div class="inka-state">
          <div class="inka-state-icon error">
            <svg lucideAlertCircle [size]="24" [strokeWidth]="1.5"></svg>
          </div>
          <span class="inka-state-title">{{ title || 'Algo salió mal' }}</span>
          <span class="inka-state-desc">{{
            message || 'No pudimos cargar la información. Intenta de nuevo.'
          }}</span>
          @if (showRetry) {
            <button class="retry-btn" (click)="onRetry()">
              <svg lucideRefreshCw [size]="16" [strokeWidth]="2"></svg>
              Reintentar
            </button>
          }
        </div>
      }
      @case ('empty') {
        <div class="inka-state">
          <div class="inka-state-icon">
            <svg lucideInbox [size]="24" [strokeWidth]="1.5"></svg>
          </div>
          <span class="inka-state-title">{{ title || 'Sin datos' }}</span>
          <span class="inka-state-desc">{{
            message || 'Aún no hay información para mostrar.'
          }}</span>
        </div>
      }
      @case ('offline') {
        <div class="inka-state">
          <div class="inka-state-icon warning">
            <svg lucideWifi [size]="24" [strokeWidth]="1.5"></svg>
          </div>
          <span class="inka-state-title">Sin conexión</span>
          <span class="inka-state-desc">Revisa tu conexión a internet e intenta de nuevo.</span>
          @if (showRetry) {
            <button class="retry-btn" (click)="onRetry()">
              <svg lucideRefreshCw [size]="16" [strokeWidth]="2"></svg>
              Reintentar
            </button>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      .state {
        padding: 32px 24px;
      }
      .skeleton-group {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .skeleton-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .error {
        background: rgba(var(--inka-danger-rgb), 0.06);
        color: var(--inka-danger);
      }
      .warning {
        background: rgba(var(--inka-warning-rgb), 0.06);
        color: var(--inka-warning);
      }
      .retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: var(--inka-radius-sm);
        background: var(--inka-surface);
        border: 1px solid var(--inka-border-solid);
        color: var(--inka-text);
        font-family: var(--inka-font-family);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
        transition: background var(--inka-transition);
      }
      .retry-btn:active {
        background: var(--inka-surface-2);
      }
    `,
  ],
})
export class PageStateComponent {
  @Input() type: PageStateType = 'loading';
  @Input() title = '';
  @Input() message = '';
  @Input() showRetry = true;
  @Input() retry?: () => void;

  onRetry(): void {
    this.retry?.();
  }
}
