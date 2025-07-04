# HODL the Wheel - Retro Arcade Game

## Overview

HODL the Wheel is a retro-style top-down car obstacle avoidance game built with a modern tech stack. The application features a React frontend with a sleek retro aesthetic and an Express.js backend for high score management. Players control a car using arrow keys or WASD, avoiding obstacles while collecting powerups to achieve the highest score possible.

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

### Local Development Setup

After cloning the repository, follow these steps to run the project locally:

#### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

#### Installation Steps
1. **Clone and Navigate**:
   ```bash
   git clone <repository-url>
   cd hodl-the-wheel
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   
   **Note**: Use `npm run dev` for development, NOT `npm start`. The `npm start` command is for production builds only.

4. **Access the Game**:
   - Open your browser to `http://localhost:5000`
   - The game runs entirely client-side with no database required
   - High scores are saved to browser localStorage

#### Development Commands
- `npm run dev` - Start development server with hot reload (use this for local development)
- `npm run build` - Build for production
- `npm start` - Start production server (only after building)
- `npm run check` - Run TypeScript type checking

#### Troubleshooting
- **"Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:5000"**: Use `npm run dev` instead of `npm start` for local development
- **HTTP 403 Forbidden Error**: Try these solutions in order:
  1. Make sure you're using `npm run dev` (not `npm start`)
  2. Try accessing `http://localhost:5000/health` to test if the server is running
  3. Clear your browser cache and try again
  4. Try a different browser or incognito/private mode
  5. If on Windows, try running your terminal as administrator
  6. Check if you have any antivirus software blocking the connection
- **Port already in use**: If port 5000 is occupied, the server will automatically try port 5001
- **Canvas not found errors**: Refresh the browser page if the game doesn't load initially
- **Touch controls not working**: Ensure you're using a modern browser with touch event support
- **Audio not playing**: Some browsers require user interaction before playing audio - click/tap anywhere first
- **High scores not saving**: Check that localStorage is enabled in your browser settings

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
- July 02, 2025. Game screen expansion and icon updates
  * Increased canvas size from 800x600 to 1200x800 for better gameplay experience
  * Updated game boundaries and spawn positions for larger playing field
  * Replaced speed powerup icon with new speed bolt design
  * Added dedicated exp star icon for double points powerup
- July 02, 2025. Enhanced destruction effects and powerup improvements
  * Fixed powerup icon aspect ratios to respect original designs
  * Added multi-layered explosion effects with colored rings and flash centers
  * Implemented car debris particle system for realistic destruction
  * Enhanced screen shake and multiple particle colors for dramatic impact
  * Increased explosion radius and added secondary delayed explosions
- July 02, 2025. Final polish improvements
  * Centered powerup status descriptions to align with score display
  * Added dramatic death explosion with multiple large explosions and massive debris field
  * Integrated game over sound effect with enhanced audio system
  * Added double points powerup status indicator to UI
- July 02, 2025. UI alignment and powerup spawn improvements
  * Fixed powerup status descriptions to be perfectly centered on full page width
  * Increased powerup spawn rate by 50% (from 8 seconds to 5.33 seconds) for more frequent powerup generation
  * Multiple powerups can now appear simultaneously on screen for enhanced gameplay
- July 02, 2025. Music settings persistence fix
  * Fixed music settings to properly persist when starting new games after dying
  * Music now respects user's ON/OFF preference stored in localStorage across game sessions
- July 02, 2025. Top bar layout improvement
  * Changed top bar from flex justify-between to 3-column grid layout
  * Lives, Score, and High Score indicators now equally spaced and centered
  * Improved visual balance with consistent spacing across all three sections
- July 02, 2025. Start page powerup icons enhancement
  * Replaced emoji icons with actual game powerup PNG images on start page
  * Added missing double points powerup description with star icon
  * Improved visual consistency between start page and in-game powerup representations
  * Used proper icon sizing to match the retro 8-bit aesthetic
- July 02, 2025. Shield icon update
  * Updated shield powerup icon to new green chevron shield design
  * Applied to both in-game powerups and start page display
  * Enhanced visual consistency with 8-bit pixel art style
- July 02, 2025. Powerup naming update
  * Changed shield powerup name from "Shield: 3s Invulnerable" to "Warden Protection"
  * Updated both start page description and in-game status indicator
  * Improved thematic consistency with fantasy/RPG naming convention
- July 02, 2025. Double points powerup display enhancement
  * Changed timer display from "2X" to "2x EXP" near player car
  * Enhanced clarity by explicitly showing this affects experience/score points
  * Maintains consistent visual styling with pink color and countdown timer
- July 02, 2025. Complete powerup icon overhaul
  * Updated all powerup icons with new high-quality 8-bit designs
  * Life: New red pixel heart icon
  * Speed: New yellow lightning bolt with dynamic design
  * Warden Protection: Updated to "warden" shield with enhanced green chevron design
  * Gun: New detailed gray pistol icon
  * Double Points: New bright yellow star icon
  * All icons maintain consistent pixel art style and transparent backgrounds
- July 02, 2025. Icon display system update
  * Changed to hybrid icon system: emojis for life (❤️), gun (🔫), and double points (⭐)
  * Kept PNG images for speed lightning bolt and warden protection shield
  * Updated both in-game powerups and start page to use consistent icon types
  * Enhanced visual consistency while reducing image dependencies
- July 02, 2025. Speed icon emoji conversion
  * Changed speed powerup from PNG lightning bolt to ⚡ emoji
  * Now only warden protection uses PNG image, all others use emojis
  * Simplified icon system with consistent emoji styling
  * Reduced image loading dependencies to single shield icon
- July 02, 2025. Warden icon final update
  * Updated warden protection to use new layered green chevron shield design (warden_1751489700206.png)
  * Enhanced 8-bit pixel art style with improved visual clarity
  * Maintained consistent shield iconography for protection powerup
- July 02, 2025. Smooth speed transition system
  * Replaced abrupt speed increases with gradual 1-second transitions
  * Implemented ease-out cubic easing for natural acceleration feel
  * Speed still increases every 5 seconds but now smoothly ramps up over transition period
  * Enhanced gameplay experience with less jarring difficulty spikes
- July 02, 2025. Project rebrand to WardenRacer
  * Changed project name from "8-Bit Car Rush" to "WardenRacer"
  * Updated HTML title, meta description, and all game UI text
  * Migrated localStorage keys from "carRush*" to "wardenRacer*" prefix
  * Maintained all functionality while establishing new brand identity
- July 02, 2025. Cryptocurrency coin collection system
  * Added 4 cryptocurrency coins as collectible items: BTC, ETH, BNB, DOGE
  * Implemented tiered point system: BTC (100pts), ETH (75pts), BNB/DOGE (25pts each)
  * Coins spawn every 3 seconds with 40% probability, separate from powerups
  * Added coin collision detection with golden particle effects and sound feedback
  * Updated to use new high-quality PNG cryptocurrency logos with proper branding
  * Removed SOL, SUI, UNI, USDC and replaced with BNB and DOGE variants
- July 03, 2025. Final project rebrand to HODL the Wheel
  * Changed project name from "WardenRacer" to "HODL the Wheel"
  * Updated HTML title, meta description, and game title display
  * Migrated localStorage keys from "wardenRacer*" to "hodlTheWheel*" prefix
  * Maintained all functionality while establishing crypto-themed brand identity
- July 03, 2025. Complete mobile optimization and touch controls
  * Implemented fullscreen mobile layout using entire screen real estate
  * Enhanced swipe controls with improved sensitivity (20px threshold)
  * Added visual touch control guide with transparent circular indicator
  * Implemented real-time touch feedback with color changes and animations
  * Added direction indicators showing active swipe directions
  * Created ultra-compact mobile HUD with touch status indicator
  * Fixed canvas positioning to use absolute fullscreen (100vw x 100vh)
  * All overlays now use fixed positioning for proper mobile display
- July 03, 2025. Touch-to-position control system implementation
  * Replaced directional swipe controls with direct touch-to-position movement
  * Car now follows finger position in real-time for intuitive mobile gameplay
  * Implemented smooth movement with 1.5x speed multiplier for responsiveness
  * Added accurate canvas coordinate mapping for precise touch input
  * Maintained keyboard controls for desktop while enhancing mobile experience
  * Removed debug overlays and cleaned up touch control system
- July 03, 2025. Dual shoot button system for mobile accessibility
  * Added dedicated shoot buttons on both left and right sides of screen
  * Accommodates both left-handed and right-handed players
  * Buttons only appear when gun powerup is active
  * Positioned to avoid interference with movement controls
  * Responsive sizing and visual feedback with press animations
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```