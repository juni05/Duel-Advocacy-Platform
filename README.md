# Duel Advocacy Platform - ETL Pipeline & REST API

A production-ready ETL pipeline and REST API for processing and analyzing advocacy platform data, built with TypeScript, Node.js, and MongoDB.

## 🏗️ Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  JSON Files │ ───▶ │ ETL Pipeline │ ───▶ │MongoDB Atlas│
│  (10,000+)  │      │  (Streaming) │      │ (Cloud DB)  │
└─────────────┘      └──────────────┘      └─────────────┘
                                                   │
                                                   ▼
                                           ┌──────────────┐
                                           │   REST API   │
                                           │  (Express)   │
                                           └──────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────┐
                                          │   Angular    │
                                          │  Dashboard   │
                                          └──────────────┘
```

### Key Components

- **ETL Pipeline**: Streams and processes JSON files with validation, transformation, and batch loading
- **REST API**: Express.js API with pagination, filtering, and analytics aggregations
- **Database**: MongoDB Atlas (cloud database) with optimized indexes and aggregation pipelines
- **Frontend**: Angular 19 dashboard for data visualization
- **DevOps**: Docker containerization + GitHub Actions CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- Make

### Option 1: Quick Setup with Makefile

The easiest way to get started is using the provided Makefile:

1. **Clone and setup everything**
   ```bash
   git clone <repository-url>
   cd Duel-Advocacy-Platform
   make env            # Create environment file
   Replace the MONGODB_URI in the .env file shared in email.
   make setup          # Install all dependencies
   make demo           # Run ETL on existing data and start services
   ```

2. **Access the application**
   - API: http://localhost:3000
   - Frontend: http://localhost:4200 (when running)
   - Health check: `curl http://localhost:3000/api/health`
   - API Docs: http://localhost:3000/api-docs

**Available Makefile commands:**
```bash
make help           # Show all available commands
make setup          # Install backend + frontend dependencies
make dev            # Start development environment (API + Frontend)
make demo           # Run complete demo (ETL on existing data + services)
make etl            # Run ETL pipeline on existing data
make status         # Check system status and data files
make test           # Run all tests
make clean          # Clean up everything
```

**Note:** This system uses your existing JSON data files in the `./data/` directory. The ETL pipeline will process all `.json` files in this directory.

### Option 2: Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Duel-Advocacy-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the API service**
   ```bash
   npm run dev
   ```
   This starts the API on `localhost:3000` (connects to MongoDB Atlas)

### Running the ETL Pipeline

1. **Run the ETL pipeline**
   ```bash
   npm run etl
   ```

### Running Locally (Development)

```bash
# Run API in development mode (uses MongoDB Atlas)
npm run dev

# In another terminal, run ETL
npm run etl

# In another terminal, run Angular dashboard
npm run frontend
# Dashboard will be available at http://localhost:4200
```

## 📊 API Documentation

Base URL: `http://localhost:3000/api`

### Health

- `GET /api/health` - Health check

### Users

- `GET /api/v1/users` - List users with pagination and filtering
  - Query params: `page`, `limit`, `sort`, `order`, `programId`, `platform`, `minEngagement`, `minSales`
- `GET /api/v1/users/top` - Get top advocates by engagement
  - Query params: `limit`
- `GET /api/v1/users/:id` - Get user details
- `GET /api/v1/users/:id/posts` - Get user's social posts
  - Query params: `page`, `limit`, `platform`

### Analytics

- `GET /api/v1/analytics/engagement` - Total engagement data
- `GET /api/v1/analytics/platforms` - Platform-wise breakdown
- `GET /api/v1/analytics/programs` - Program performance
- `GET /api/v1/analytics/attribution` - Sales attribution insights

### Example Requests

```bash
# Get top 10 users by engagement
curl http://localhost:3000/api/v1/users/top?limit=10

# Get users with minimum 1000 engagement
curl http://localhost:3000/api/v1/users?minEngagement=1000&sort=totalEngagement&order=desc

# Get platform analytics
curl http://localhost:3000/api/v1/analytics/platforms

# Get user details
curl http://localhost:3000/api/v1/users/USER_ID
```

## 🧪 Testing

```bash
# Run all tests
npm test


Test coverage includes:
- Unit tests for transformers and validators
- Integration tests for API endpoints


## 📦 Project Structure

```
.
├── src/
│   ├── etl/               # ETL pipeline components
│   │   ├── extractor.ts   # File reading with streaming
│   │   ├── validator.ts   # Zod schema validation
│   │   ├── transformer.ts # Data normalization
│   │   ├── loader.ts      # MongoDB batch operations
│   │   └── pipeline.ts    # Pipeline orchestration
│   ├── api/
│   │   ├── routes/        # Express route handlers
│   │   ├── middleware/    # Error handling, validation, rate limiting
│   │   └── server.ts      # Express app setup
│   ├── models/            # Mongoose schemas
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Logger, DB connection, env validation
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Docker services
└── Dockerfile             # Multi-stage build
```

## 🎨 Frontend Dashboard

An Angular 19 dashboard is included to visualize the data:

- **Metrics Cards**: Total users, engagement, sales, posts
- **Top Advocates**: Leaderboard showing top 10 users
- **Platform Charts**: Bar chart comparing platform performance
- **Programs Table**: Overview of all advocacy programs

**Access**: http://localhost:4200 (after running `npm start` in `frontend/duel-dashboard`)

See [frontend/duel-dashboard/README.md](frontend/duel-dashboard/README.md) for details.

## 🐳 Docker & Deployment

### Build Docker Image

```bash
docker build -t duel-advocacy-platform .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

### Environment Variables

See `.env.example` for all configuration options:

- `NODE_ENV`: Environment (development/production)
- `PORT`: API server port
- `MONGODB_URI`: MongoDB connection string
- `DATA_DIR`: Directory containing JSON files
- `BATCH_SIZE`: Records per batch for ETL
- `LOG_LEVEL`: Logging level (error/warn/info/debug)

## 🔄 CI/CD Pipeline

### GitHub Secrets Setup

Before running the pipelines, configure these GitHub secrets in your repository:

#### Required Secrets:
- `MONGODB_URI_CI`: MongoDB connection string for CI testing
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

### Continuous Integration (.github/workflows/ci.yml)

Runs on every PR and push to dev:

### Continuous Deployment (.github/workflows/cd.yml)

Runs on push to main and tags:

## 📝 License

MIT

## 👤 Author

Built as part of Duel's take-home engineering challenge.