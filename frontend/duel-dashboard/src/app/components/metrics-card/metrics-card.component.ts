import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metrics-card',
  imports: [CommonModule],
  template: `
    <div class="metric-card">
      <div class="icon">{{ icon }}</div>
      <div class="content">
        <div class="title">{{ title }}</div>
        <div class="value">{{ prefix }}{{ formatNumber(value) }}</div>
      </div>
    </div>
  `,
  styles: [`
    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .icon {
      font-size: 40px;
    }
    .content {
      flex: 1;
    }
    .title {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
  `]
})
export class MetricsCardComponent {
  @Input() title = '';
  @Input() value: number = 0;
  @Input() icon = '📊';
  @Input() prefix = '';

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}

