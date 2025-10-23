import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, ProgramStats } from '../../services/api.service';

@Component({
  selector: 'app-programs-list',
  imports: [CommonModule],
  template: `
    <div class="programs">
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="!loading && programs.length === 0" class="empty">No programs found</div>
      
      <table *ngIf="!loading && programs.length > 0">
        <thead>
          <tr>
            <th>Program Name</th>
            <th>Users</th>
            <th>Total Engagement</th>
            <th>Total Sales</th>
            <th>Avg Engagement/User</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let program of programs">
            <td><strong>{{ program.programName }}</strong></td>
            <td>{{ formatNumber(program.userCount) }}</td>
            <td>{{ formatNumber(program.totalEngagement) }}</td>
            <td>\${{ formatNumber(program.totalSales) }}</td>
            <td>{{ formatNumber(program.totalEngagement / program.userCount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .programs {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 10px;
      background: #f5f5f5;
      font-weight: 600;
      font-size: 14px;
      color: #666;
    }
    td {
      padding: 12px 10px;
      border-bottom: 1px solid #eee;
    }
    .loading, .empty {
      text-align: center;
      padding: 20px;
      color: #999;
    }
  `]
})
export class ProgramsListComponent implements OnInit {
  programs: ProgramStats[] = [];
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getProgramAnalytics().subscribe({
      next: (response) => {
        this.programs = response.data.slice(0, 10); // Top 10 programs
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading programs:', err);
        this.loading = false;
      }
    });
  }

  formatNumber(num: number): string {
    return Math.round(num).toLocaleString();
  }
}

