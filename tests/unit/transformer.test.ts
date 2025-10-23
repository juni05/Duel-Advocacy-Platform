// tests/unit/transformer.test.ts
import { transformUser } from '../../src/etl/transformer';

describe('Transformer', () => {
  describe('transformUser', () => {
    it('should transform clean user data', () => {
      const rawData = {
        user_id: 'c6940435-6029-4c6b-84f1-8f37fd882072',
        name: 'John Doe',
        email: 'john@example.com',
        instagram_handle: '@john_doe',
        tiktok_handle: '@johndoe_tt',
        joined_at: '2024-01-01T00:00:00Z',
        advocacy_programs: [
          {
            program_id: 'prog1',
            brand: 'Test Brand',
            tasks_completed: [
              {
                task_id: 'task1',
                platform: 'Instagram',
                post_url: 'https://example.com',
                likes: 100,
                comments: 10,
                shares: 5,
                reach: 1000,
              },
            ],
            total_sales_attributed: 500.5,
          },
        ],
      };

      const result = transformUser(rawData);

      expect(result.userId).toBe('c6940435-6029-4c6b-84f1-8f37fd882072');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.socialHandles).toHaveLength(2);
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].engagement).toBe(115); // 100 + 10 + 5
      expect(result.totalEngagement).toBe(115);
      expect(result.totalSales).toBe(500.5);
    });

    it('should normalize social handles', () => {
      const rawData = {
        user_id: 'user123',
        instagram_handle: '@JohnDoe',
        tiktok_handle: '@@johndoe',
        advocacy_programs: [],
      };

      const result = transformUser(rawData);

      expect(result.socialHandles).toHaveLength(2);
      expect(result.socialHandles[0].platform).toBe('instagram');
      expect(result.socialHandles[0].handle).toBe('johndoe');
      expect(result.socialHandles[1].platform).toBe('tiktok');
      expect(result.socialHandles[1].handle).toBe('johndoe');
    });

    it('should handle missing optional fields', () => {
      const rawData = {
        user_id: 'user123',
        advocacy_programs: [],
      };

      const result = transformUser(rawData);

      expect(result.userId).toBe('user123');
      expect(result.posts).toHaveLength(0);
      expect(result.programs).toHaveLength(0);
      expect(result.totalEngagement).toBe(0);
      expect(result.totalSales).toBe(0);
    });

    it('should calculate total sales from programs', () => {
      const rawData = {
        user_id: 'user123',
        advocacy_programs: [
          {
            program_id: 'prog1',
            brand: 'Brand A',
            tasks_completed: [],
            total_sales_attributed: 100.5,
          },
          {
            program_id: 'prog2',
            brand: 'Brand B',
            tasks_completed: [],
            total_sales_attributed: 50.25,
          },
        ],
      };

      const result = transformUser(rawData);

      expect(result.salesAttributions).toHaveLength(2);
      expect(result.totalSales).toBe(150.75);
    });

    it('should generate userId if missing', () => {
      const rawData = {
        user_id: null,
        name: 'John Doe',
        advocacy_programs: [],
      };

      const result = transformUser(rawData);

      expect(result.userId).toBeDefined();
      expect(result.userId).toMatch(/^user_/);
      expect(result.name).toBe('John Doe');
    });

    it('should handle null values gracefully', () => {
      const rawData = {
        user_id: 'user123',
        name: null,
        email: null,
        instagram_handle: null,
        tiktok_handle: null,
        advocacy_programs: [
          {
            program_id: null,
            brand: null,
            tasks_completed: [
              {
                task_id: null,
                platform: 'Instagram',
                post_url: null,
                likes: 'NaN',
                comments: null,
                shares: null,
                reach: null,
              },
            ],
            total_sales_attributed: 'no-data',
          },
        ],
      };

      const result = transformUser(rawData);

      expect(result.userId).toBe('user123');
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].likes).toBe(0);
      expect(result.posts[0].comments).toBe(0);
      expect(result.programs.length).toBe(0);
    });

    it('should parse timestamp formats', () => {
      const rawData = {
        user_id: 'user123',
        joined_at: '2024-01-01T00:00:00Z',
        advocacy_programs: [],
      };

      const result = transformUser(rawData);

      expect(result.joinDate).toBeInstanceOf(Date);
    });

    it('should handle brand as number', () => {
      const rawData = {
        user_id: 'user123',
        advocacy_programs: [
          {
            program_id: 'prog1',
            brand: 12345,
            tasks_completed: [],
            total_sales_attributed: 100,
          },
        ],
      };

      const result = transformUser(rawData);

      expect(result.programs).toHaveLength(1);
      expect(result.programs[0].programName).toBe('12345');
    });
  });
});