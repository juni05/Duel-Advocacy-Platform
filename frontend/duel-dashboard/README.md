# Duel Advocacy Platform - Angular Dashboard

A simple Angular 19 dashboard to visualize advocacy platform data.

## Features

- 📊 **Metrics Cards**: Total users, engagement, sales, and posts
- 🏆 **Top Advocates**: Leaderboard of top 10 users by engagement
- 📈 **Platform Charts**: Visual comparison of platform performance
- 📋 **Programs List**: Overview of advocacy programs

## Prerequisites

- Node.js 18+
- Angular CLI 19
- Running backend API on `http://localhost:3000`

## Installation

```bash
cd frontend/duel-dashboard
npm install
```

## Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`

## Build for Production

```bash
npm run build
```

Build artifacts will be in the `dist/` directory.

## API Connection

The dashboard connects to the backend API at `http://localhost:3000/api/v1`.

Make sure the backend is running:
```bash
# In the root directory
npm run dev
```

## Components

- **DashboardComponent**: Main dashboard layout
- **MetricsCardComponent**: Reusable metric display card
- **TopUsersComponent**: Table of top advocates
- **PlatformChartComponent**: Chart.js bar chart for platform comparison
- **ProgramsListComponent**: Table of program statistics

## Services

- **ApiService**: HTTP client for backend API communication

## Technologies

- Angular 19
- TypeScript
- Chart.js
- RxJS
- Standalone Components
