// tests/integration/api.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { UserModel } from '../../src/models/User';
import { ProgramModel } from '../../src/models/Program';

// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';

// Now import app
import app from '../../src/api/server';

let mongoServer: MongoMemoryServer;

type HealthResponse = {
  status: string;
  database: string;
};

type PaginatedUserResponse = {
  data: Array<{ userId: string; name: string; postId?: string; platform?: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UserResponse = {
  data: {
    userId: string;
    name: string;
  };
};

type TopUsersResponse = {
  data: Array<{ userId: string }>;
};

type EngagementResponse = {
  data: {
    totalEngagement: number;
    totalLikes: number;
    postCount: number;
  };
};

type PlatformResponse = {
  data: unknown[];
};

type AttributionResponse = {
  data: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
  };
};

type ProgramsResponse = {
  data: Array<{
    programId: string;
    programName: string;
    userCount: number;
    totalEngagement: number;
    totalSales: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ErrorResponse = {
  message: string;
};

beforeAll(async () => {
  // Disconnect any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
  
  console.log('Test database connected');
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('API Integration Tests', () => {
  describe('Health Endpoints', () => {
    it('GET /api/health should return 200', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect((response.body as HealthResponse).status).toBe('ok');
    });
  });

  describe('Users Endpoints', () => {
    beforeEach(async () => {
      // Seed test data
      await UserModel.create([
        {
          userId: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          totalEngagement: 1000,
          totalSales: 500,
          posts: [
            {
              postId: 'post1',
              platform: 'instagram',
              url: 'https://example.com/post1',
              likes: 100,
              comments: 50,
              shares: 20,
              reach: 1000,
              engagement: 170,
            },
          ],
          programs: [
            {
              programId: 'prog1',
              programName: 'Campaign 1',
            },
          ],
          salesAttributions: [
            {
              programId: 'prog1',
              amount: 500,
            },
          ],
        },
        {
          userId: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          totalEngagement: 2000,
          totalSales: 1000,
          posts: [],
          programs: [],
          salesAttributions: [],
        },
      ]);
    });

    it('GET /api/v1/users should return paginated users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect((response.body as PaginatedUserResponse).data).toHaveLength(2);
      expect((response.body as PaginatedUserResponse).pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('GET /api/v1/users/:id should return user details', async () => {
      const response = await request(app).get('/api/v1/users/user1');

      expect(response.status).toBe(200);
      expect((response.body as UserResponse).data.userId).toBe('user1');
      expect((response.body as UserResponse).data.name).toBe('John Doe');
    });

    it('GET /api/v1/users/:id should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/v1/users/nonexistent');

      expect(response.status).toBe(404);
      expect((response.body as ErrorResponse).message).toContain('not found');
    });

    it('GET /api/v1/users/top should return top users by engagement', async () => {
      const response = await request(app)
        .get('/api/v1/users/top')
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect((response.body as TopUsersResponse).data).toHaveLength(2);
      expect((response.body as TopUsersResponse).data[0].userId).toBe('user2'); // Higher engagement
    });

    it('GET /api/v1/users should filter by minEngagement', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ minEngagement: 1500 });

      expect(response.status).toBe(200);
      expect((response.body as PaginatedUserResponse).data).toHaveLength(1);
      expect((response.body as PaginatedUserResponse).data[0].userId).toBe('user2');
    });

    it('GET /api/v1/users/:id/posts should return user posts', async () => {
      const response = await request(app).get('/api/v1/users/user1/posts');

      expect(response.status).toBe(200);
      expect((response.body as PaginatedUserResponse).data).toHaveLength(1);
      expect((response.body as PaginatedUserResponse).data[0].postId).toBe('post1');
    });

    it('GET /api/v1/users/:id/posts should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/v1/users/nonexistent/posts');

      expect(response.status).toBe(404);
    });
  });

  describe('Analytics Endpoints', () => {
    beforeEach(async () => {
      await UserModel.create({
        userId: 'user1',
        name: 'John Doe',
        totalEngagement: 1000,
        totalSales: 500,
        posts: [
          {
            postId: 'post1',
            platform: 'instagram',
            url: 'https://example.com/post1',
            likes: 100,
            comments: 50,
            shares: 20,
            reach: 1000,
            impressions: 2000,
            engagement: 170,
          },
        ],
        programs: [
          {
            programId: 'prog1',
            programName: 'Campaign 1',
          },
        ],
        salesAttributions: [
          {
            programId: 'prog1',
            amount: 100,
          },
        ],
      });

      // Seed program data
      await ProgramModel.create([
        {
          programId: 'prog1',
          programName: 'Campaign 1',
          userCount: 50,
          totalEngagement: 50000,
          totalSales: 25000,
          status: 'active',
        },
        {
          programId: 'prog2',
          programName: 'Campaign 2',
          userCount: 30,
          totalEngagement: 30000,
          totalSales: 15000,
          status: 'active',
        },
        {
          programId: 'prog3',
          programName: 'Campaign 3',
          userCount: 20,
          totalEngagement: 20000,
          totalSales: 10000,
          status: 'completed',
        },
      ]);
    });

    it('GET /api/v1/analytics/engagement should return engagement data', async () => {
      const response = await request(app).get('/api/v1/analytics/engagement');

      expect(response.status).toBe(200);
      expect((response.body as EngagementResponse).data).toHaveProperty('totalEngagement');
      expect((response.body as EngagementResponse).data).toHaveProperty('totalLikes');
      expect((response.body as EngagementResponse).data).toHaveProperty('postCount');
    });

    it('GET /api/v1/analytics/platforms should return platform breakdown', async () => {
      const response = await request(app).get('/api/v1/analytics/platforms');

      expect(response.status).toBe(200);
      expect(Array.isArray((response.body as PlatformResponse).data)).toBe(true);
    });

    it('GET /api/v1/analytics/attribution should return sales attribution', async () => {
      const response = await request(app).get('/api/v1/analytics/attribution');

      expect(response.status).toBe(200);
      expect((response.body as AttributionResponse).data).toHaveProperty('totalSales');
      expect((response.body as AttributionResponse).data).toHaveProperty('totalOrders');
      expect((response.body as AttributionResponse).data).toHaveProperty('averageOrderValue');
    });

    it('GET /api/v1/analytics/programs should return paginated program statistics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/programs')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect((response.body as ProgramsResponse).data).toHaveLength(2);
      expect((response.body as ProgramsResponse).pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown');

      expect(response.status).toBe(404);
      expect((response.body as ErrorResponse).message).toBeDefined();
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ page: -1 });

      expect(response.status).toBe(400);
    });
  });
});