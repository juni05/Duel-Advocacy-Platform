// tests/unit/validator.test.ts
import { validateUser } from '../../src/etl/validator';

describe('Validator', () => {
  describe('validateUser', () => {
    it('should validate clean user data', () => {
      const cleanData = {
        user_id: 'c6940435-6029-4c6b-84f1-8f37fd882072',
        name: 'John Doe',
        email: 'john@example.com',
        instagram_handle: '@john_doe',
        tiktok_handle: '@johndoe',
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

      const result = validateUser(cleanData);

      expect(result.success).toBe(true);
      expect(result.isClean).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should accept messy but fixable data', () => {
      const messyData = {
        user_id: 'user123',
        email: 'test@test.com',
        advocacy_programs: [],
      };

      const result = validateUser(messyData);

      expect(result.success).toBe(true);
      expect(result.isClean).toBe(false);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        // Missing user_id
        name: 123, // Wrong type
        advocacy_programs: 'not-an-array', // Wrong type
      };

      const result = validateUser(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle string numbers in numeric fields', () => {
      const data = {
        user_id: 'user123',
        advocacy_programs: [
          {
            program_id: 'prog1',
            brand: 'Test',
            tasks_completed: [
              {
                task_id: 'task1',
                platform: 'Instagram',
                post_url: 'https://example.com',
                likes: '100', // String number
                comments: '10',
                shares: '5',
                reach: '1000',
              },
            ],
            total_sales_attributed: '250.50',
          },
        ],
      };

      const result = validateUser(data);

      expect(result.success).toBe(true);
    });

    it('should accept platform names as-is', () => {
      const data = {
        user_id: 'user123',
        advocacy_programs: [
          {
            program_id: 'prog1',
            brand: 'Test',
            tasks_completed: [
              {
                task_id: 'task1',
                platform: 'Instagram', // Capital I
                post_url: 'https://example.com',
              },
            ],
          },
        ],
      };

      const result = validateUser(data);

      expect(result.success).toBe(true);
    });

    it('should handle null values gracefully', () => {
      const data = {
        user_id: null,
        name: null,
        email: null,
        instagram_handle: null,
        tiktok_handle: null,
        advocacy_programs: [
          {
            program_id: null,
            brand: null,
            tasks_completed: [],
            total_sales_attributed: null,
          },
        ],
      };

      const result = validateUser(data);

      expect(result.success).toBe(true);
    });
  });
});