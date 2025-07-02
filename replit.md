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
- **Local Storage**: Browser localStorage for high score persistence
- **No Server Storage**: Game runs entirely client-side for simplicity

## Key Components

### Game Engine
- **Canvas-based rendering**: 60 FPS game loop with requestAnimationFrame
- **Collision detection**: AABB (Axis-Aligned Bounding Box) collision system
- **Speed progression**: Obstacle speed increases every 5 seconds
- **Power-up system**: Collectible items providing extra lives

### User Interface
- **Retro styling**: Press Start 2P font and 8-bit color palette
- **Responsive design**: Mobile-friendly with touch controls consideration
- **Component library**: shadcn/ui for consistent UI elements
- **Toast notifications**: User feedback for game events

### Game Logic
- **Local high score tracking**: Browser localStorage persistence
- **Speed scaling system**: Base speed increases every 5 seconds
- **Lives system**: Maximum 3 lives, powerups provide extra lives
- **Pixel-perfect collision detection**: AABB algorithm for precise gameplay

## Data Flow

1. **Game Initialization**: Canvas setup, event listeners, initial game state with start time
2. **Game Loop**: Handle input → Update positions → Check collisions → Render frame → Request next frame
3. **Speed Management**: Calculate current obstacle speed based on elapsed time (increases every 5 seconds)
4. **Score Tracking**: Local state management with localStorage persistence
5. **Collision System**: AABB detection for obstacles (lose life) and powerups (gain life)

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
- July 02, 2025. Added complete audio system with background music, shoot sound, and powerup sound effects
- July 02, 2025. Implemented music persistence in localStorage for consistent user experience
- July 02, 2025. Updated powerup icons - life powerup now uses heart symbols for better visual consistency
- July 02, 2025. Enhanced UI with heart symbols for lives display and improved powerup visibility
- July 02, 2025. MAJOR UPDATE: Complete visual effects and advanced scoring system
  * Added explosion effects when obstacles are destroyed or player takes damage
  * Implemented particle system for visual feedback and speed boost trails
  * Added screen shake effects for impacts and explosions
  * Created floating score popup animations with combo multipliers
  * Added invulnerability flashing effect
  * Implemented comprehensive scoring system:
    - Combo system with bonus points for consecutive hits
    - Streak counter tracking destruction chains
    - Distance-based survival scoring (10 points per second)
    - Double points powerup (10 seconds, 2x multiplier)
  * Added 3-second countdown when resuming from pause
  * Enhanced UI with real-time combo and streak displays
  * All powerup icons now use professional PNG assets with transparency
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```