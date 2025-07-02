import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import blueCar from "@assets/blue_1751475426603.png";
import greenCar from "@assets/green_1751475426603.png";
import redCar from "@assets/red_1751475426603.png";
import myCar from "@assets/mycar_1751475557453.png";
import backgroundMusic from "@assets/SLOWER-TEMPO2019-12-11_-_Retro_Platforming_-_David_Fesliyan_1751478645287.mp3";
import shootSound from "@assets/8-bit-shoot_1751479421238.mp3";
import powerupSound from "@assets/8-bit-powerup_1751479421239.mp3";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type?: 'red' | 'blue' | 'green' | 'mycar';
}

interface Powerup extends GameObject {
  powerupType: 'life' | 'speed' | 'invulnerability' | 'gun';
}

interface Bullet extends GameObject {
  // bullets move upward
}

interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  gameStarted: boolean;
  lives: number;
  score: number;
  player: GameObject;
  obstacles: GameObject[];
  powerups: Powerup[];
  bullets: Bullet[];
  lastObstacleSpawn: number;
  lastPowerupSpawn: number;
  gameStartTime: number;
  baseObstacleSpeed: number;
  // Active powerup effects
  speedBoostEndTime: number;
  invulnerabilityEndTime: number;
  gunEndTime: number;
  originalPlayerSpeed: number;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shootAudioRef = useRef<HTMLAudioElement | null>(null);
  const powerupAudioRef = useRef<HTMLAudioElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const gameStateRef = useRef<GameState>({
    isRunning: false,
    isPaused: false,
    gameStarted: false,
    lives: 3,
    score: 0,
    player: { x: 375, y: 500, width: 50, height: 80, speed: 5, type: 'mycar' },
    obstacles: [],
    powerups: [],
    bullets: [],
    lastObstacleSpawn: 0,
    lastPowerupSpawn: 0,
    gameStartTime: 0,
    baseObstacleSpeed: 3,
    speedBoostEndTime: 0,
    invulnerabilityEndTime: 0,
    gunEndTime: 0,
    originalPlayerSpeed: 5
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const animationIdRef = useRef<number>();

  const [gameState, setGameState] = useState(gameStateRef.current);
  const [localHighScore, setLocalHighScore] = useState(
    parseInt(localStorage.getItem('carRushHighScore') || '0')
  );

  // Load car images and initialize audio
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = [
        { key: 'red', src: redCar },
        { key: 'blue', src: blueCar },
        { key: 'green', src: greenCar },
        { key: 'mycar', src: myCar }
      ].map(({ key, src }) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            imagesRef.current[key] = img;
            resolve();
          };
          img.src = src;
        });
      });

      await Promise.all(imagePromises);
      setImagesLoaded(true);
    };

    // Initialize all audio
    const initializeAudio = () => {
      const audio = new Audio(backgroundMusic);
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;

      const shootAudio = new Audio(shootSound);
      shootAudio.volume = 0.7;
      shootAudioRef.current = shootAudio;

      const powerupAudio = new Audio(powerupSound);
      powerupAudio.volume = 0.8;
      powerupAudioRef.current = powerupAudio;
    };

    loadImages();
    initializeAudio();
  }, []);

  const updateGameState = useCallback(() => {
    setGameState({ ...gameStateRef.current });
  }, []);

  const toggleMusic = useCallback(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play().catch(e => console.log('Could not play audio:', e));
        setIsMusicPlaying(true);
      }
    }
  }, [isMusicPlaying]);

  const startMusic = useCallback(() => {
    if (audioRef.current && !isMusicPlaying) {
      audioRef.current.play().catch(e => console.log('Could not play audio:', e));
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  const stopMusic = useCallback(() => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsMusicPlaying(false);
    }
  }, [isMusicPlaying]);

  const playShootSound = useCallback(() => {
    if (shootAudioRef.current) {
      shootAudioRef.current.currentTime = 0;
      shootAudioRef.current.play().catch(e => console.log('Could not play shoot sound:', e));
    }
  }, []);

  const playPowerupSound = useCallback(() => {
    if (powerupAudioRef.current) {
      powerupAudioRef.current.currentTime = 0;
      powerupAudioRef.current.play().catch(e => console.log('Could not play powerup sound:', e));
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = true;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      if (gameStateRef.current.isRunning && !gameStateRef.current.isPaused) {
        pauseGame();
      } else if (gameStateRef.current.isPaused) {
        resumeGame();
      }
    }
    
    if (e.key === ' ') {
      e.preventDefault();
      const state = gameStateRef.current;
      if (state.isRunning && !state.isPaused && Date.now() < state.gunEndTime) {
        shootBullet();
      }
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = false;
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isColliding = (rect1: GameObject, rect2: GameObject): boolean => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const handleInput = () => {
    const keys = keysRef.current;
    const player = gameStateRef.current.player;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (keys['arrowleft'] || keys['a']) {
      player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['arrowright'] || keys['d']) {
      player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }
    if (keys['arrowup'] || keys['w']) {
      player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['arrowdown'] || keys['s']) {
      player.y = Math.min(canvas.height - player.height, player.y + player.speed);
    }
  };

  const getCurrentObstacleSpeed = () => {
    const state = gameStateRef.current;
    const timeElapsed = Date.now() - state.gameStartTime;
    const speedIncreases = Math.floor(timeElapsed / 5000); // Every 5 seconds
    return state.baseObstacleSpeed + speedIncreases;
  };

  const shootBullet = () => {
    const state = gameStateRef.current;
    const player = state.player;
    
    state.bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 8
    });
    
    playShootSound();
  };

  const spawnObstacle = () => {
    const now = Date.now();
    const state = gameStateRef.current;
    const spawnRate = 800; // Fixed spawn rate
    
    if (now - state.lastObstacleSpawn > spawnRate) {
      const carTypes: ('red' | 'blue')[] = ['red', 'blue'];
      const randomType = carTypes[Math.floor(Math.random() * carTypes.length)];
      
      state.obstacles.push({
        x: Math.random() * (800 - 60),
        y: -80,
        width: 60,
        height: 80,
        speed: getCurrentObstacleSpeed(),
        type: randomType
      });
      state.lastObstacleSpawn = now;
    }
  };

  const spawnPowerup = () => {
    const now = Date.now();
    const state = gameStateRef.current;
    
    if (now - state.lastPowerupSpawn > 8000 && Math.random() < 0.3) {
      const powerupTypes: ('life' | 'speed' | 'invulnerability' | 'gun')[] = ['life', 'speed', 'invulnerability', 'gun'];
      const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
      
      state.powerups.push({
        x: Math.random() * (800 - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 2,
        powerupType: randomType
      });
      state.lastPowerupSpawn = now;
    }
  };

  const updateGameObjects = () => {
    const state = gameStateRef.current;
    const now = Date.now();
    
    // Update powerup effects
    if (now > state.speedBoostEndTime && state.player.speed > state.originalPlayerSpeed) {
      state.player.speed = state.originalPlayerSpeed;
    }
    
    // Update obstacles - all obstacles now move at the current speed
    state.obstacles.forEach(obstacle => {
      obstacle.speed = getCurrentObstacleSpeed();
    });
    
    state.obstacles = state.obstacles.filter(obstacle => {
      obstacle.y += obstacle.speed;
      return obstacle.y < 600;
    });

    // Update powerups
    state.powerups = state.powerups.filter(powerup => {
      powerup.y += powerup.speed;
      return powerup.y < 600;
    });

    // Update bullets
    state.bullets = state.bullets.filter(bullet => {
      bullet.y -= bullet.speed;
      return bullet.y > 0;
    });
  };

  const activatePowerup = (powerupType: 'life' | 'speed' | 'invulnerability' | 'gun') => {
    const state = gameStateRef.current;
    const now = Date.now();
    
    switch (powerupType) {
      case 'life':
        state.lives = Math.min(3, state.lives + 1);
        state.score += 500;
        break;
      case 'speed':
        state.player.speed = state.originalPlayerSpeed * 1.5;
        state.speedBoostEndTime = now + 5000; // 5 seconds
        break;
      case 'invulnerability':
        state.invulnerabilityEndTime = now + 3000; // 3 seconds
        break;
      case 'gun':
        state.gunEndTime = now + 5000; // 5 seconds
        break;
    }
  };

  const checkCollisions = () => {
    const state = gameStateRef.current;
    const now = Date.now();
    const isInvulnerable = now < state.invulnerabilityEndTime;
    
    // Check obstacle collisions (skip if invulnerable)
    if (!isInvulnerable) {
      state.obstacles = state.obstacles.filter(obstacle => {
        if (isColliding(state.player, obstacle)) {
          state.lives--;
          if (state.lives <= 0) {
            gameOver();
          }
          updateGameState();
          return false;
        }
        return true;
      });
    }

    // Check powerup collisions
    state.powerups = state.powerups.filter(powerup => {
      if (isColliding(state.player, powerup)) {
        activatePowerup(powerup.powerupType);
        playPowerupSound();
        updateGameState();
        return false;
      }
      return true;
    });

    // Check bullet-obstacle collisions
    state.bullets.forEach(bullet => {
      state.obstacles = state.obstacles.filter(obstacle => {
        if (isColliding(bullet, obstacle)) {
          // Remove both bullet and obstacle
          state.bullets = state.bullets.filter(b => b !== bullet);
          state.score += 100;
          return false;
        }
        return true;
      });
    });
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameStateRef.current;
    
    // Disable anti-aliasing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road lines
    ctx.fillStyle = '#333333';
    for (let i = 0; i < canvas.height; i += 60) {
      ctx.fillRect(canvas.width / 3, i + (Date.now() / 10) % 60, 4, 30);
      ctx.fillRect((canvas.width * 2) / 3, i + (Date.now() / 10) % 60, 4, 30);
    }

    // Draw player car using image
    const player = state.player;
    if (imagesLoaded && player.type && imagesRef.current[player.type]) {
      ctx.drawImage(
        imagesRef.current[player.type],
        player.x,
        player.y,
        player.width,
        player.height
      );
    } else {
      // Fallback to green rectangle if image not loaded
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Draw obstacles using images
    state.obstacles.forEach(obstacle => {
      if (imagesLoaded && obstacle.type && imagesRef.current[obstacle.type]) {
        ctx.drawImage(
          imagesRef.current[obstacle.type],
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height
        );
      } else {
        // Fallback to red rectangle if image not loaded
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    });

    // Draw powerups with consistent pixel art icons
    state.powerups.forEach(powerup => {
      const { x, y, width, height, powerupType } = powerup;
      
      // Background for all powerups
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      
      // Scale factor for pickup icons (larger than timer icons)
      const scale = 1.5;
      const baseSize = 32;
      const iconSize = baseSize * scale;
      const offsetX = (width - iconSize) / 2;
      const offsetY = (height - iconSize) / 2;
      const iconX = x + offsetX;
      const iconY = y + offsetY;
      
      switch (powerupType) {
        case 'life':
          // Draw plus sign (medical cross)
          ctx.fillStyle = '#FF1493';
          ctx.fillRect(iconX + 8 * scale, iconY + 4 * scale, 8 * scale, 24 * scale); // vertical bar
          ctx.fillRect(iconX + 4 * scale, iconY + 12 * scale, 16 * scale, 8 * scale); // horizontal bar
          break;
        case 'speed':
          // Draw arrow pointing right
          ctx.fillStyle = '#00FFFF';
          ctx.fillRect(iconX + 4 * scale, iconY + 12 * scale, 16 * scale, 8 * scale); // arrow body
          ctx.fillRect(iconX + 16 * scale, iconY + 8 * scale, 8 * scale, 16 * scale); // arrow head
          ctx.fillRect(iconX + 20 * scale, iconY + 12 * scale, 4 * scale, 8 * scale); // arrow tip
          break;
        case 'invulnerability':
          // Draw diamond shield
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(iconX + 12 * scale, iconY + 4 * scale, 8 * scale, 8 * scale); // top
          ctx.fillRect(iconX + 8 * scale, iconY + 8 * scale, 16 * scale, 8 * scale); // middle
          ctx.fillRect(iconX + 4 * scale, iconY + 12 * scale, 24 * scale, 8 * scale); // center
          ctx.fillRect(iconX + 8 * scale, iconY + 16 * scale, 16 * scale, 8 * scale); // lower middle
          ctx.fillRect(iconX + 12 * scale, iconY + 20 * scale, 8 * scale, 8 * scale); // bottom
          break;
        case 'gun':
          // Draw simplified gun shape
          ctx.fillStyle = '#FF6B6B';
          ctx.fillRect(iconX + 4 * scale, iconY + 12 * scale, 20 * scale, 8 * scale); // gun body
          ctx.fillRect(iconX + 20 * scale, iconY + 8 * scale, 8 * scale, 16 * scale); // grip
          ctx.fillRect(iconX + 24 * scale, iconY + 14 * scale, 4 * scale, 4 * scale); // barrel
          break;
      }
    });

    // Draw bullets
    state.bullets.forEach(bullet => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw invulnerability effect
    if (Date.now() < state.invulnerabilityEndTime) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);
    }

    // Draw powerup timers below player car with pixel art icons
    const now = Date.now();
    let timerY = player.y + player.height + 20;
    
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    
    const drawPowerupIcon = (x: number, y: number, type: 'life' | 'speed' | 'invulnerability' | 'gun', scale = 0.6) => {
      const size = 32 * scale;
      const iconX = x;
      const iconY = y - size + 4;
      
      // Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(iconX, iconY, size, size);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(iconX + 1, iconY + 1, size - 2, size - 2);
      
      switch (type) {
        case 'life':
          // Draw plus sign (medical cross)
          ctx.fillStyle = '#FF1493';
          ctx.fillRect(iconX + 8, iconY + 4, 8, 24); // vertical bar
          ctx.fillRect(iconX + 4, iconY + 12, 16, 8); // horizontal bar
          break;
        case 'speed':
          // Draw arrow pointing right
          ctx.fillStyle = '#00FFFF';
          ctx.fillRect(iconX + 4, iconY + 12, 16, 8); // arrow body
          ctx.fillRect(iconX + 16, iconY + 8, 8, 16); // arrow head
          ctx.fillRect(iconX + 20, iconY + 12, 4, 8); // arrow tip
          break;
        case 'invulnerability':
          // Draw diamond shield
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(iconX + 12, iconY + 4, 8, 8); // top
          ctx.fillRect(iconX + 8, iconY + 8, 16, 8); // middle
          ctx.fillRect(iconX + 4, iconY + 12, 24, 8); // center
          ctx.fillRect(iconX + 8, iconY + 16, 16, 8); // lower middle
          ctx.fillRect(iconX + 12, iconY + 20, 8, 8); // bottom
          break;
        case 'gun':
          // Draw simplified gun shape
          ctx.fillStyle = '#FF6B6B';
          ctx.fillRect(iconX + 4, iconY + 12, 20, 8); // gun body
          ctx.fillRect(iconX + 20, iconY + 8, 8, 16); // grip
          ctx.fillRect(iconX + 24, iconY + 14, 4, 4); // barrel
          break;
      }
    };
    
    if (now < state.speedBoostEndTime) {
      const timeLeft = Math.ceil((state.speedBoostEndTime - now) / 1000);
      const iconX = player.x + player.width / 2 - 40;
      drawPowerupIcon(iconX, timerY, 'speed');
      ctx.fillStyle = '#00FFFF';
      ctx.fillText(`${timeLeft}s`, iconX + 25, timerY - 4);
      timerY += 24;
    }
    
    if (now < state.invulnerabilityEndTime) {
      const timeLeft = Math.ceil((state.invulnerabilityEndTime - now) / 1000);
      const iconX = player.x + player.width / 2 - 40;
      drawPowerupIcon(iconX, timerY, 'invulnerability');
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`${timeLeft}s`, iconX + 25, timerY - 4);
      timerY += 24;
    }
    
    if (now < state.gunEndTime) {
      const timeLeft = Math.ceil((state.gunEndTime - now) / 1000);
      const iconX = player.x + player.width / 2 - 40;
      drawPowerupIcon(iconX, timerY, 'gun');
      ctx.fillStyle = '#FF6B6B';
      ctx.fillText(`${timeLeft}s`, iconX + 25, timerY - 4);
    }
  };

  const gameLoop = () => {
    const state = gameStateRef.current;
    
    if (!state.isRunning || state.isPaused) return;

    handleInput();
    spawnObstacle();
    spawnPowerup();
    updateGameObjects();
    checkCollisions();
    render();

    // Update score
    state.score += 10;
    updateGameState();

    animationIdRef.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    const state = gameStateRef.current;
    state.gameStarted = true;
    state.isRunning = true;
    state.isPaused = false;
    state.lives = 3;
    state.score = 0;
    state.obstacles = [];
    state.powerups = [];
    state.bullets = [];
    state.player = { x: 375, y: 500, width: 50, height: 80, speed: 5, type: 'mycar' };
    state.gameStartTime = Date.now();
    state.baseObstacleSpeed = 3;
    state.speedBoostEndTime = 0;
    state.invulnerabilityEndTime = 0;
    state.gunEndTime = 0;
    state.originalPlayerSpeed = 5;
    updateGameState();
    startMusic();
    gameLoop();
  };

  const pauseGame = () => {
    const state = gameStateRef.current;
    state.isPaused = true;
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.pause();
    }
    updateGameState();
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  const resumeGame = () => {
    const state = gameStateRef.current;
    state.isPaused = false;
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.play().catch(e => console.log('Could not resume audio:', e));
    }
    updateGameState();
    gameLoop();
  };

  const gameOver = () => {
    const state = gameStateRef.current;
    state.isRunning = false;
    
    if (state.score > localHighScore) {
      setLocalHighScore(state.score);
      localStorage.setItem('carRushHighScore', state.score.toString());
    }

    stopMusic();
    updateGameState();
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  const restartGame = () => {
    startGame();
  };

  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center pixel-font">
        <div className="text-center">
          <div className="text-4xl text-white mb-8 animate-pulse">8-BIT CAR RUSH</div>
          
          <Card className="mb-8 border-4 border-white bg-gray-900 w-80 mx-auto">
            <CardContent className="p-4">
              <div className="text-left space-y-2">
                <div className="text-sm text-green-400">🚗 AVOID OBSTACLES</div>
                <div className="text-sm text-red-400">🔥 COLLECT POWERUPS</div>
                <div className="text-sm text-yellow-400">⭐ SURVIVE AS LONG AS POSSIBLE</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-8 bg-gray-900 border-2 border-gray-600">
            <CardContent className="p-4">
              <div className="text-sm text-white mb-4">CONTROLS</div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-xs text-gray-300">ARROW KEYS: Move</div>
                <div className="text-xs text-gray-300">WASD: Move</div>
                <div className="text-xs text-gray-300">ESC: Pause/Menu</div>
                <div className="text-xs text-gray-300">SPACE: Shoot (with gun powerup)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-8 bg-gray-900 border-2 border-gray-600">
            <CardContent className="p-4">
              <div className="text-sm text-white mb-4">POWERUPS</div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="text-xs text-pink-400">♥ Life: +1 Life</div>
                <div className="text-xs text-cyan-400">⚡ Speed: 5s Boost</div>
                <div className="text-xs text-yellow-400">🛡 Shield: 3s Invulnerable</div>
                <div className="text-xs text-red-400">🔫 Gun: 5s Shooting</div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={startGame}
              className="retro-button text-lg"
            >
              START GAME
            </Button>
            
            <Button 
              onClick={toggleMusic}
              className="retro-button text-sm"
              variant="outline"
            >
              {isMusicPlaying ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-black">
      {/* Game Canvas */}
      <canvas 
        ref={canvasRef}
        className="border-4 border-white"
        width="800" 
        height="600"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Game UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 game-ui">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          {/* Lives Display */}
          <div className="flex items-center space-x-2">
            <span className="pixel-font text-sm text-white">LIVES:</span>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="w-6 h-6 flex items-center justify-center text-lg"
                  style={{ 
                    color: i < gameState.lives ? '#FF1493' : '#333333' 
                  }}
                >
                  ♥
                </div>
              ))}
            </div>
          </div>
          
          {/* Score Display */}
          <div className="text-center">
            <div className="pixel-font text-lg text-yellow-400">SCORE</div>
            <div className="pixel-font text-xl text-white">
              {gameState.score.toString().padStart(6, '0')}
            </div>
          </div>
          
          {/* High Score */}
          <div className="text-center">
            <div className="pixel-font text-sm text-gray-400">HIGH SCORE</div>
            <div className="pixel-font text-lg text-yellow-400">
              {localHighScore.toString().padStart(6, '0')}
            </div>
          </div>
        </div>
        
        {/* Active Powerups Indicator */}
        <div className="flex justify-center mt-2 space-x-4">
          {Date.now() < gameState.speedBoostEndTime && (
            <div className="pixel-font text-xs text-cyan-400 bg-black bg-opacity-75 px-2 py-1">
              SPEED BOOST
            </div>
          )}
          {Date.now() < gameState.invulnerabilityEndTime && (
            <div className="pixel-font text-xs text-yellow-400 bg-black bg-opacity-75 px-2 py-1">
              INVULNERABLE
            </div>
          )}
          {Date.now() < gameState.gunEndTime && (
            <div className="pixel-font text-xs text-red-400 bg-black bg-opacity-75 px-2 py-1">
              GUN ACTIVE
            </div>
          )}
        </div>
      </div>
      
      {/* Game Over Screen */}
      {!gameState.isRunning && gameState.gameStarted && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <Card className="bg-black border-4 border-white p-8 max-w-md">
            <CardContent className="text-center">
              <div className="pixel-font text-2xl text-red-500 mb-4">GAME OVER</div>
              <div className="pixel-font text-lg text-white mb-2">FINAL SCORE</div>
              <div className="pixel-font text-xl text-yellow-400 mb-6">
                {gameState.score.toString().padStart(6, '0')}
              </div>
              <div className="flex flex-col items-center space-y-4">
                <Button onClick={restartGame} className="retro-button">
                  RESTART GAME
                </Button>
                
                <Button 
                  onClick={toggleMusic}
                  className="retro-button text-sm"
                  variant="outline"
                >
                  {isMusicPlaying ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Pause Screen */}
      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <Card className="bg-black border-4 border-white p-8">
            <CardContent className="text-center">
              <div className="pixel-font text-2xl text-yellow-400 mb-6">PAUSED</div>
              <div className="flex flex-col items-center space-y-4">
                <Button onClick={resumeGame} className="retro-button">
                  RESUME
                </Button>
                
                <Button 
                  onClick={toggleMusic}
                  className="retro-button text-sm"
                  variant="outline"
                >
                  {isMusicPlaying ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
