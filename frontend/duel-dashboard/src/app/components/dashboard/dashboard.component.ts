import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { MetricsCardComponent } from '../metrics-card/metrics-card.component';
import { TopUsersComponent } from '../top-users/top-users.component';
import { PlatformChartComponent } from '../platform-chart/platform-chart.component';
import { ProgramsListComponent } from '../programs-list/programs-list.component';
import { UserPostsComponent } from '../user-posts/user-posts.component';
import { User } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    HttpClientModule,
    MetricsCardComponent,
    TopUsersComponent,
    PlatformChartComponent,
    ProgramsListComponent,
    UserPostsComponent
  ],
  template: `
    <div class="dashboard">
      <div class="metrics-grid">
        <app-metrics-card 
          title="Total Users" 
          [value]="totalUsers" 
          icon="👥">
        </app-metrics-card>
        <app-metrics-card 
          title="Total Engagement" 
          [value]="totalEngagement" 
          icon="❤️">
        </app-metrics-card>
        <app-metrics-card 
          title="Total Sales" 
          [value]="totalSales" 
          prefix="$"
          icon="💰">
        </app-metrics-card>
        <app-metrics-card 
          title="Total Posts" 
          [value]="totalPosts" 
          icon="📝">
        </app-metrics-card>
      </div>

      <div class="content-grid">
        <div class="card">
          <h2>Top Advocates</h2>
          <p class="card-description">Click on a user to view their posts</p>
          <app-top-users (userSelected)="onUserSelected($event)"></app-top-users>
        </div>

        <div class="card">
          <h2>Platform Performance</h2>
          <app-platform-chart></app-platform-chart>
        </div>
      </div>

      <div *ngIf="selectedUser" class="card full-width">
        <div class="user-posts-header">
          <h2> </h2>
          <button (click)="clearSelectedUser()" class="close-btn">×</button>
        </div>
        <app-user-posts
          [userId]="selectedUser.userId"
          [userName]="selectedUser.name">
        </app-user-posts>
      </div>

      <div class="card full-width">
        <h2>Programs Overview</h2>
        <app-programs-list></app-programs-list>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .full-width {
      grid-column: 1 / -1;
    }
    h2 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
    }
    .card-description {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 14px;
    }
    .user-posts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    .close-btn:hover {
      background-color: #f5f5f5;
      color: #333;
    }
  `]
})
export class DashboardComponent implements OnInit {
  totalUsers = 0;
  totalEngagement = 0;
  totalSales = 0;
  totalPosts = 0;
  selectedUser: User | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.apiService.getEngagementAnalytics().subscribe({
      next: (response) => {
        this.totalEngagement = response.data.totalEngagement;
        this.totalPosts = response.data.postCount;
      },
      error: (err) => console.error('Error loading engagement:', err)
    });

    this.apiService.getUsers(1, 1).subscribe({
      next: (response) => {
        this.totalUsers = response.pagination.total;
      },
      error: (err) => console.error('Error loading users:', err)
    });

    // Get total sales from attribution analytics
    this.apiService.getAttributionAnalytics().subscribe({
      next: (response) => {
        this.totalSales = response.data.totalSales;
      },
      error: (err) => console.error('Error loading attribution analytics:', err)
    });
  }

  onUserSelected(user: User) {
    this.selectedUser = user;
  }

  clearSelectedUser() {
    this.selectedUser = null;
  }
}

