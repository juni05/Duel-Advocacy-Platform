import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService, SocialPost, PaginatedResponse } from '../../services/api.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-user-posts',
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="user-posts">
      <div *ngIf="loading" class="loading">Loading posts...</div>
      <div *ngIf="!loading && error" class="error">
        {{ error }}
      </div>
      <div *ngIf="!loading && !error && posts.length === 0" class="empty">
        No posts found for this user.
      </div>

      <div *ngIf="!loading && !error && posts.length > 0" class="posts-container">
        <div class="posts-header">
          <h3>Posts by {{ userName || userId }}</h3>
          <div class="filters">
            <select [(ngModel)]="selectedPlatform" (change)="onPlatformChange()" class="platform-filter">
              <option value="">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
        </div>

        <div class="posts-list">
          <div *ngFor="let post of posts" class="post-card">
            <div class="post-header">
              <span class="platform-badge" [class]="'platform-' + post.platform">
                {{ post.platform | titlecase }}
              </span>
              <span class="engagement-score">Engagement: {{ post.engagement | number:'1.1-1' }}</span>
            </div>

            <div class="post-stats">
              <div class="stat">
                <span class="stat-label">Likes</span>
                <span class="stat-value">{{ post.likes | number }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Comments</span>
                <span class="stat-value">{{ post.comments | number }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Shares</span>
                <span class="stat-value">{{ post.shares | number }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Reach</span>
                <span class="stat-value">{{ post.reach | number }}</span>
              </div>
            </div>

            <div *ngIf="post.url" class="post-link">
              <a [href]="post.url" target="_blank" rel="noopener">View Post</a>
            </div>
          </div>
        </div>

        <div *ngIf="pagination.totalPages > 1" class="pagination">
          <button
            (click)="changePage(pagination.page - 1)"
            [disabled]="pagination.page <= 1"
            class="page-btn">
            Previous
          </button>

          <span class="page-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
            ({{ pagination.total }} total posts)
          </span>

          <button
            (click)="changePage(pagination.page + 1)"
            [disabled]="pagination.page >= pagination.totalPages"
            class="page-btn">
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-posts {
      width: 100%;
    }

    .loading, .error, .empty {
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 16px;
    }

    .error {
      color: #d32f2f;
      background: #ffebee;
      border-radius: 4px;
    }

    .posts-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .posts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .posts-header h3 {
      margin: 0;
      color: #333;
    }

    .platform-filter {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 14px;
    }

    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .post-card {
      background: white;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .platform-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .platform-instagram { background: #e1306c; color: white; }
    .platform-facebook { background: #1877f2; color: white; }
    .platform-twitter { background: #1da1f2; color: white; }
    .platform-tiktok { background: #000000; color: white; }
    .platform-youtube { background: #ff0000; color: white; }
    .platform-linkedin { background: #0077b5; color: white; }

    .engagement-score {
      font-weight: 600;
      color: #333;
    }

    .post-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    .stat {
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-value {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .post-link {
      text-align: center;
    }

    .post-link a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .post-link a:hover {
      text-decoration: underline;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-top: 1px solid #eee;
    }

    .page-btn {
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .page-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .page-btn:hover:not(:disabled) {
      background: #1565c0;
    }

    .page-info {
      font-size: 14px;
      color: #666;
    }
  `]
})
export class UserPostsComponent implements OnInit, OnChanges {
  @Input() userId!: string;
  @Input() userName?: string;

  posts: SocialPost[] = [];
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  };
  loading = false;
  error = '';
  selectedPlatform = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadPosts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && !changes['userId'].firstChange) {
      this.loadPosts();
    }
  }

  loadPosts() {
    if (!this.userId) return;

    this.loading = true;
    this.error = '';

    this.apiService.getUserPosts(
      this.userId,
      this.selectedPlatform || undefined,
      this.pagination.page,
      this.pagination.limit
    ).pipe(
      catchError((error) => {
        if (error.status === 404) {
          this.error = 'User not found or has no posts.';
        } else {
          this.error = 'Failed to load posts. Please try again.';
        }
        this.posts = [];
        this.pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
        return of(null);
      })
    ).subscribe({
      next: (response: PaginatedResponse<SocialPost> | null) => {
        if (response) {
          this.posts = response.data;
          this.pagination = response.pagination;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPlatformChange() {
    this.pagination.page = 1; // Reset to first page when filter changes
    this.loadPosts();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.pagination.totalPages) {
      this.pagination.page = newPage;
      this.loadPosts();
    }
  }
}
