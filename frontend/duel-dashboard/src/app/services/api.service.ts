import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  userId: string;
  name?: string;
  email?: string;
  totalEngagement: number;
  totalSales: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalyticsEngagement {
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  postCount: number;
}

export interface PlatformStats {
  platform: string;
  postCount: number;
  totalEngagement: number;
  totalSales: number;
}

export interface AttributionAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface ProgramStats {
  programId: string;
  programName: string;
  userCount: number;
  totalEngagement: number;
  totalSales: number;
}

export interface SocialPost {
  postId: string;
  platform: string;
  url?: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagement: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(`${this.baseUrl}/users?page=${page}&limit=${limit}`);
  }

  getTopUsers(limit: number = 10): Observable<{ data: User[] }> {
    return this.http.get<{ data: User[] }>(`${this.baseUrl}/users/top?limit=${limit}`);
  }

  getEngagementAnalytics(): Observable<{ data: AnalyticsEngagement }> {
    return this.http.get<{ data: AnalyticsEngagement }>(`${this.baseUrl}/analytics/engagement`);
  }

  getPlatformAnalytics(): Observable<{ data: PlatformStats[] }> {
    return this.http.get<{ data: PlatformStats[] }>(`${this.baseUrl}/analytics/platforms`);
  }

  getProgramAnalytics(): Observable<{ data: ProgramStats[] }> {
    return this.http.get<{ data: ProgramStats[] }>(`${this.baseUrl}/analytics/programs`);
  }

  getAttributionAnalytics(): Observable<{ data: AttributionAnalytics }> {
    return this.http.get<{ data: AttributionAnalytics }>(`${this.baseUrl}/analytics/attribution`);
  }

  getUserPosts(
    userId: string,
    platform?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedResponse<SocialPost>> {
    let url = `${this.baseUrl}/users/${userId}/posts?page=${page}&limit=${limit}`;
    if (platform) {
      url += `&platform=${platform}`;
    }
    return this.http.get<PaginatedResponse<SocialPost>>(url);
  }

  getHealth(): Observable<any> {
    return this.http.get('http://localhost:3000/api/health');
  }
}

