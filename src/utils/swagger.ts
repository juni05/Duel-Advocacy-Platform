import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Duel Advocacy Platform API',
    version: '1.0.0',
    description: 'REST API for processing and analyzing advocacy platform data',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-10-23T10:30:00.000Z',
          },
          uptime: {
            type: 'string',
            example: '3600s',
          },
          database: {
            type: 'string',
            enum: ['connected', 'disconnected'],
            example: 'connected',
          },
          environment: {
            type: 'string',
            example: 'development',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'An error occurred',
          },
          statusCode: {
            type: 'integer',
            example: 400,
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
          },
          limit: {
            type: 'integer',
            example: 10,
          },
          total: {
            type: 'integer',
            example: 100,
          },
          totalPages: {
            type: 'integer',
            example: 10,
          },
        },
      },
      AnalyticsEngagement: {
        type: 'object',
        properties: {
          totalEngagement: {
            type: 'integer',
            example: 12500,
          },
          totalLikes: {
            type: 'integer',
            example: 8500,
          },
          totalComments: {
            type: 'integer',
            example: 2100,
          },
          totalShares: {
            type: 'integer',
            example: 1900,
          },
          totalReach: {
            type: 'integer',
            example: 45000,
          },
          totalImpressions: {
            type: 'integer',
            example: 75000,
          },
          averageEngagement: {
            type: 'number',
            example: 2.45,
          },
          postCount: {
            type: 'integer',
            example: 250,
          },
        },
      },
      PlatformStats: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: [
              'twitter',
              'facebook',
              'instagram',
              'linkedin',
              'tiktok',
              'youtube',
            ],
            example: 'twitter',
          },
          postCount: {
            type: 'integer',
            example: 50,
          },
          totalEngagement: {
            type: 'integer',
            example: 2500,
          },
          averageEngagement: {
            type: 'number',
            example: 3.2,
          },
          totalReach: {
            type: 'integer',
            example: 15000,
          },
          totalSales: {
            type: 'number',
            example: 1250.5,
          },
        },
      },
      ProgramStats: {
        type: 'object',
        properties: {
          programId: {
            type: 'string',
            example: '60d5ecb74b24c72b8c8b4567',
          },
          programName: {
            type: 'string',
            example: 'Summer Campaign 2023',
          },
          userCount: {
            type: 'integer',
            example: 25,
          },
          postCount: {
            type: 'integer',
            example: 150,
          },
          totalEngagement: {
            type: 'integer',
            example: 8500,
          },
          totalSales: {
            type: 'number',
            example: 5000.0,
          },
          averageEngagementPerUser: {
            type: 'number',
            example: 340.0,
          },
        },
      },
      AttributionAnalytics: {
        type: 'object',
        properties: {
          totalSales: {
            type: 'number',
            example: 25000.0,
          },
          totalOrders: {
            type: 'integer',
            example: 125,
          },
          averageOrderValue: {
            type: 'number',
            example: 200.0,
          },
          salesByPlatform: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: {
                  type: 'string',
                  enum: [
                    'twitter',
                    'facebook',
                    'instagram',
                    'linkedin',
                    'tiktok',
                    'youtube',
                  ],
                  example: 'instagram',
                },
                sales: {
                  type: 'number',
                  example: 8500.0,
                },
                orders: {
                  type: 'integer',
                  example: 42,
                },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d5ecb74b24c72b8c8b4567',
          },
          userId: {
            type: 'string',
            example: 'user123',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
          },
          platform: {
            type: 'string',
            enum: [
              'twitter',
              'facebook',
              'instagram',
              'linkedin',
              'tiktok',
              'youtube',
            ],
            example: 'twitter',
          },
          programId: {
            type: 'string',
            example: '60d5ecb74b24c72b8c8b4568',
          },
          engagementScore: {
            type: 'number',
            example: 85.5,
          },
          totalLikes: {
            type: 'integer',
            example: 1250,
          },
          totalComments: {
            type: 'integer',
            example: 340,
          },
          totalShares: {
            type: 'integer',
            example: 85,
          },
          totalReach: {
            type: 'integer',
            example: 15000,
          },
          totalSales: {
            type: 'number',
            example: 2500.0,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-10-23T08:45:00.000Z',
          },
        },
      },
      Post: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d5ecb74b24c72b8c8b4569',
          },
          userId: {
            type: 'string',
            example: 'user123',
          },
          platform: {
            type: 'string',
            enum: [
              'twitter',
              'facebook',
              'instagram',
              'linkedin',
              'tiktok',
              'youtube',
            ],
            example: 'instagram',
          },
          content: {
            type: 'string',
            example:
              'Excited to share my experience with this amazing product! #advocacy',
          },
          likes: {
            type: 'integer',
            example: 25,
          },
          comments: {
            type: 'integer',
            example: 8,
          },
          shares: {
            type: 'integer',
            example: 3,
          },
          reach: {
            type: 'integer',
            example: 500,
          },
          impressions: {
            type: 'integer',
            example: 800,
          },
          url: {
            type: 'string',
            format: 'uri',
            example: 'https://instagram.com/p/abc123',
          },
          postedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-10-20T14:30:00.000Z',
          },
        },
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      UserIdParam: {
        name: 'id',
        in: 'path',
        description: 'User ID',
        required: true,
        schema: {
          type: 'string',
        },
      },
    },
  },
  security: [],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/api/routes/health.ts',
    './src/api/routes/analytics/analytics.controller.ts',
    './src/api/routes/users/users.controller.ts',
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};

export default specs;
