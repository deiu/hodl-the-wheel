# 8-Bit Car Rush - Retro Arcade Game

## Overview

8-Bit Car Rush is a retro-style top-down car obstacle avoidance game built with a modern tech stack. The application features a React frontend with a sleek retro aesthetic and an Express.js backend for high score management. Players control a car using arrow keys or WASD, avoiding obstacles while collecting powerups to achieve the highest score possible.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks with refs for game state, TanStack Query for server state
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for development and production builds
- **Game Rendering**: HTML5 Canvas for 2D game graphics

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints for high score management
- **Data Validation**: Zod schemas for runtime type checking
- **Development**: tsx for TypeScript execution in development

### Data Storage Solutions
- **Primary Database**: PostgreSQL configured via Drizzle ORM
- **Development Fallback**: In-memory storage implementation
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL adapter

## Key Components

### Game Engine
- **Canvas-based rendering**: 60 FPS game loop with requestAnimationFrame
- **Collision detection**: AABB (Axis-Aligned Bounding Box) collision system
- **Progressive difficulty**: Dynamic obstacle spawn rates and speeds
- **Power-up system**: Collectible items affecting gameplay

### User Interface
- **Retro styling**: Press Start 2P font and 8-bit color palette
- **Responsive design**: Mobile-friendly with touch controls consideration
- **Component library**: shadcn/ui for consistent UI elements
- **Toast notifications**: User feedback for game events

### API Layer
- **High scores endpoint**: GET /api/high-scores for leaderboard
- **Score submission**: POST /api/high-scores with validation
- **Error handling**: Comprehensive error responses with proper HTTP status codes
- **Type safety**: Shared schemas between frontend and backend

## Data Flow

1. **Game Initialization**: Canvas setup, event listeners, initial game state
2. **Game Loop**: Update positions → Check collisions → Render frame → Request next frame
3. **Score Tracking**: Local state management with periodic server synchronization
4. **High Score Submission**: Form validation → API request → Server persistence → UI update
5. **Leaderboard Display**: Server query → Data transformation → Component rendering

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing solution
- **drizzle-orm**: Type-safe database ORM
- **zod**: Runtime type validation

### UI and Styling
- **@radix-ui/**: Accessible primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **drizzle-kit**: Database schema management
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite bundles React app to `dist/public`
2. **Backend Build**: esbuild compiles Express server to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required for production)
- **NODE_ENV**: Environment detection for development vs production features
- **REPL_ID**: Replit-specific development mode detection

### Production Considerations
- Static file serving for the built React application
- Database connection pooling via Neon Database
- Error logging and monitoring setup
- CORS configuration for cross-origin requests

## Changelog

```
Changelog:
- July 02, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```