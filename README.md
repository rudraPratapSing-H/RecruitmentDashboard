# Recruitment Dashboard

An internal recruitment operations platform for managing candidate pipelines, conducting interview scoring, and tracking hiring decisions.

## Features

- **Admin Authentication:** Secure login for recruitment administrators.
- **Candidate Search:** Search candidates by name and filter by organizational verticals.
- **Interview Scoring:** Rate candidates across multiple criteria (confidence, dedication, experience, etc.) with duplicate scoring prevention.
- **Candidate Profiles:** View comprehensive candidate summaries, task submissions, and portfolios.
- **Score Analytics:** View aggregated statistics, average scores, and feedback from multiple interviewers.

## Architecture

```mermaid
graph TD
    Client[Browser Client] -->|Next.js API Routes| API[Next.js Serverless API]
    API -->|Prisma Client| ORM[Prisma ORM]
    ORM -->|TCP Connection| DB[(MySQL Database)]
    
    subgraph Client Pages
    Login[Login Page]
    Search[Search & Interview Portal]
    Admin[Admin Dashboard]
    end
    
    Client -.-> Login
    Client -.-> Search
    Client -.-> Admin
    
    subgraph API Endpoints
    APILogin["/api/login"]
    APISearch["/api/search"]
    APIScores["/api/scores"]
    end
    
    API -.-> APILogin
    API -.-> APISearch
    API -.-> APIScores
```

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes (Serverless APIs)
- **Database:** Prisma ORM, MySQL (or PostgreSQL)

## Getting Started

### 1. Prerequisites

- Node.js (v24 LTS or higher)
- A MySQL or PostgreSQL database

### 2. Installation

Navigate to the dashboard directory and install dependencies:

```bash
cd Dashboard/RecruitmentDashboard
npm install
```

### 3. Environment Setup

Create a `.env` file in the `Dashboard/RecruitmentDashboard` directory and add your database connection string:

```env
# For MySQL:
DATABASE_URL="mysql://username:password@localhost:3306/recruitment"

# For PostgreSQL (Remember to change provider="postgresql" in prisma/schema.prisma):
# DATABASE_URL="postgresql://username:password@localhost:5432/recruitment"
```

### 4. Database Setup

Generate the Prisma client and push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

- `app/` - Next.js application router, containing all UI pages (`/admin`, `/search`, `/login`).
- `app/api/` - Backend API route handlers for authentication, search, and scoring.
- `prisma/schema.prisma` - Database schema definition.
- `lib/prisma.js` - Prisma client singleton setup.
