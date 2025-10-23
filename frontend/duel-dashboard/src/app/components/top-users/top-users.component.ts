import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../services/api.service';

@Component({
  selector: 'app-top-users',
  imports: [CommonModule],
  template: `
    <div class="top-users">
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="!loading && users.length === 0" class="empty">No data available</div>
      
      <table *ngIf="!loading && users.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Engagement</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users; let i = index"
              (click)="onUserClick(user)"
              class="clickable-row">
            <td>{{ i + 1 }}</td>
            <td>
              <div class="user-name">{{ user.name || 'N/A' }}</div>
              <div class="user-email">{{ user.email || user.userId }}</div>
            </td>
            <td>{{ formatNumber(user.totalEngagement) }}</td>
            <td>\${{ formatNumber(user.totalSales) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .top-users {
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
    .user-name {
      font-weight: 500;
      color: #333;
    }
    .user-email {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
    .loading, .empty {
      text-align: center;
      padding: 20px;
      color: #999;
    }
    .clickable-row {
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .clickable-row:hover {
      background-color: #f8f9fa;
    }
  `]
})
export class TopUsersComponent implements OnInit {
  @Output() userSelected = new EventEmitter<User>();

  users: User[] = [];
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getTopUsers(10).subscribe({
      next: (response) => {
        this.users = response.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading top users:', err);
        this.loading = false;
      }
    });
  }

  onUserClick(user: User) {
    this.userSelected.emit(user);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}

