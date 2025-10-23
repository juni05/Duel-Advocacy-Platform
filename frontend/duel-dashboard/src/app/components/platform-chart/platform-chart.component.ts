import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, PlatformStats } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-platform-chart',
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 300px;
    }
  `]
})
export class PlatformChartComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  chart: Chart | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getPlatformAnalytics().subscribe({
      next: (response) => {
        this.createChart(response.data);
      },
      error: (err) => console.error('Error loading platform data:', err)
    });
  }

  createChart(data: PlatformStats[]) {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(p => p.platform.toUpperCase()),
        datasets: [
          {
            label: 'Engagement',
            data: data.map(p => p.totalEngagement),
            backgroundColor: 'rgba(102, 126, 234, 0.7)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 1
          },
          {
            label: 'Posts',
            data: data.map(p => p.postCount),
            backgroundColor: 'rgba(118, 75, 162, 0.7)',
            borderColor: 'rgba(118, 75, 162, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}

