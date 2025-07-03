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
import gameOverSound from "@assets/game-over_1751484756101.mp3";
import shieldIcon from "@assets/warden_1751489700206.png";
import lifeIcon from "@assets/1up_1751492808696.png";
import btcIcon from "@assets/BTC_1751491424662.png";
import ethIcon from "@assets/ETH_1751491424662.png";
import bnbIcon from "@assets/BNB_1751491424662.png";
import dogeIcon from "@assets/DOGE_1751491424662.png";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type?: 'red' | 'blue' | 'green' | 'mycar';
}

interface Powerup extends GameObject {
  powerupType: 'life' | 'speed' | 'invulnerability' | 'gun' | 'doublepoints';
}

interface Bullet extends GameObject {
  // bullets move upward
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  startTime: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  alpha: number;
  startTime: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Coin extends GameObject {
  coinType: 'btc' | 'eth' | 'bnb' | 'doge';
  points: number;
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
  coins: Coin[];
  explosions: Explosion[];
  scorePopups: ScorePopup[];
  particles: Particle[];
  lastObstacleSpawn: number;
  lastPowerupSpawn: number;
  lastCoinSpawn: number;
  gameStartTime: number;
  baseObstacleSpeed: number;
  totalPausedTime: number;
  pauseStartTime: number;
  // Active powerup effects
  speedBoostEndTime: number;
  invulnerabilityEndTime: number;
  gunEndTime: number;
  doublePointsEndTime: number;
  originalPlayerSpeed: number;
  // Scoring system
  comboCount: number;
  comboEndTime: number;
  streakCount: number;
  bestStreak: number;
  lastHitTime: number;
  // Visual effects
  screenShake: number;
  resumeCountdown: number;
  gameOverAnimationEndTime: number;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shootAudioRef = useRef<HTMLAudioElement | null>(null);
  const powerupAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => {
    const saved = localStorage.getItem('hodlTheWheelMusicEnabled');
    return saved !== null ? saved === 'true' : true; // Default to enabled
  });
  
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
    coins: [],
    explosions: [],
    scorePopups: [],
    particles: [],
    lastObstacleSpawn: 0,
    lastPowerupSpawn: 0,
    lastCoinSpawn: 0,
    gameStartTime: 0,
    baseObstacleSpeed: 3,
    totalPausedTime: 0,
    pauseStartTime: 0,
    speedBoostEndTime: 0,
    invulnerabilityEndTime: 0,
    gunEndTime: 0,
    doublePointsEndTime: 0,
    originalPlayerSpeed: 5,
    comboCount: 0,
    comboEndTime: 0,
    streakCount: 0,
    bestStreak: 0,
    lastHitTime: 0,
    screenShake: 0,
    resumeCountdown: 0,
    gameOverAnimationEndTime: 0
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const animationIdRef = useRef<number>();

  const [gameState, setGameState] = useState(gameStateRef.current);
  const [localHighScore, setLocalHighScore] = useState(
    parseInt(localStorage.getItem('hodlTheWheelHighScore') || '0')
  );

  // Load car images and initialize audio
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = [
        { key: 'red', src: redCar },
        { key: 'blue', src: blueCar },
        { key: 'green', src: greenCar },
        { key: 'mycar', src: myCar },
        { key: 'shield', src: shieldIcon },
        { key: 'life', src: lifeIcon },
        { key: 'btc', src: btcIcon },
        { key: 'eth', src: ethIcon },
        { key: 'bnb', src: bnbIcon },
        { key: 'doge', src: dogeIcon }
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

      const gameOverAudio = new Audio(gameOverSound);
      gameOverAudio.volume = 0.9;
      gameOverAudioRef.current = gameOverAudio;
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
        localStorage.setItem('hodlTheWheelMusicEnabled', 'false');
      } else {
        audioRef.current.play().catch(e => console.log('Could not play audio:', e));
        setIsMusicPlaying(true);
        localStorage.setItem('hodlTheWheelMusicEnabled', 'true');
      }
    }
  }, [isMusicPlaying]);

  const startMusic = useCallback(() => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.play().catch(e => console.log('Could not play audio:', e));
    }
  }, [isMusicPlaying]);

  const stopMusic = useCallback(() => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsMusicPlaying(false);
    }
  }, [isMusicPlaying]);

  const pauseMusicTemporarily = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

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

  const playGameOverSound = useCallback(() => {
    if (gameOverAudioRef.current) {
      gameOverAudioRef.current.currentTime = 0;
      gameOverAudioRef.current.play().catch(e => console.log('Could not play game over sound:', e));
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

  // Touch controls for mobile
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchKeysRef = useRef<Record<string, boolean>>({});
  const [showTouchFeedback, setShowTouchFeedback] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { 
      x: touch.clientX, 
      y: touch.clientY, 
      time: Date.now() 
    };
    setShowTouchFeedback(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Clear previous touch keys
    touchKeysRef.current = {};
    
    // Reduced minimum swipe distance for more responsive control
    const minDistance = 20;
    
    // Set movement keys based on swipe direction with improved sensitivity
    if (Math.abs(deltaX) > minDistance) {
      if (deltaX > 0) {
        touchKeysRef.current['arrowright'] = true;
        touchKeysRef.current['d'] = true;
      } else {
        touchKeysRef.current['arrowleft'] = true;
        touchKeysRef.current['a'] = true;
      }
    }
    
    if (Math.abs(deltaY) > minDistance) {
      if (deltaY > 0) {
        touchKeysRef.current['arrowdown'] = true;
        touchKeysRef.current['s'] = true;
      } else {
        touchKeysRef.current['arrowup'] = true;
        touchKeysRef.current['w'] = true;
      }
    }
    
    // Update the touch start position for continuous movement
    touchStartRef.current = { 
      x: touch.clientX, 
      y: touch.clientY, 
      time: touchStartRef.current.time 
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    // Check if this was a tap (short touch with minimal movement)
    if (touchStartRef.current) {
      const touchDuration = Date.now() - touchStartRef.current.time;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // If touch was short (<300ms) and minimal movement (<30px), treat as tap for shooting
      if (touchDuration < 300 && distance < 30) {
        const state = gameStateRef.current;
        if (state.isRunning && !state.isPaused && state.gunEndTime > Date.now()) {
          // Trigger shooting
          shootBullet();
        }
      }
    }
    
    touchStartRef.current = null;
    touchKeysRef.current = {};
    setShowTouchFeedback(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Add touch event listeners for mobile
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const isColliding = (rect1: GameObject, rect2: GameObject): boolean => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const handleInput = () => {
    const keys = keysRef.current;
    const touchKeys = touchKeysRef.current;
    const player = gameStateRef.current.player;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Combine keyboard and touch controls
    if (keys['arrowleft'] || keys['a'] || touchKeys['arrowleft'] || touchKeys['a']) {
      player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['arrowright'] || keys['d'] || touchKeys['arrowright'] || touchKeys['d']) {
      player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }
    if (keys['arrowup'] || keys['w'] || touchKeys['arrowup'] || touchKeys['w']) {
      player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['arrowdown'] || keys['s'] || touchKeys['arrowdown'] || touchKeys['s']) {
      player.y = Math.min(canvas.height - player.height, player.y + player.speed);
    }
  };

  const getCurrentObstacleSpeed = () => {
    const state = gameStateRef.current;
    const currentPauseTime = state.isPaused ? (Date.now() - state.pauseStartTime) : 0;
    const timeElapsed = Date.now() - state.gameStartTime - state.totalPausedTime - currentPauseTime;
    const speedIncreaseInterval = 5000; // Every 5 seconds
    const transitionDuration = 1000; // 1 second transition period
    
    // Calculate which speed level we're at
    const speedLevel = Math.floor(timeElapsed / speedIncreaseInterval);
    const baseSpeed = state.baseObstacleSpeed + speedLevel;
    
    // Check if we're in a transition period
    const timeInCurrentInterval = timeElapsed % speedIncreaseInterval;
    if (timeInCurrentInterval < transitionDuration && speedLevel > 0) {
      // Smoothly transition from previous speed to current speed
      const previousSpeed = state.baseObstacleSpeed + (speedLevel - 1);
      const transitionProgress = timeInCurrentInterval / transitionDuration;
      // Use easing function for smoother transition
      const easedProgress = 1 - Math.pow(1 - transitionProgress, 3); // Ease-out cubic
      return previousSpeed + (baseSpeed - previousSpeed) * easedProgress;
    }
    
    return baseSpeed;
  };

  // Visual effect functions
  const createExplosion = (x: number, y: number, maxRadius = 50) => {
    const state = gameStateRef.current;
    state.explosions.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: maxRadius,
      alpha: 1,
      startTime: Date.now()
    });
  };

  const createScorePopup = (x: number, y: number, text: string, color: string = '#FFD700') => {
    const state = gameStateRef.current;
    state.scorePopups.push({
      x: x,
      y: y,
      text: text,
      alpha: 1,
      startTime: Date.now(),
      color: color
    });
  };

  const createParticles = (x: number, y: number, color: string, count: number = 5) => {
    const state = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 60,
        maxLife: 60,
        color: color
      });
    }
  };

  const createDebrisParticles = (x: number, y: number) => {
    const state = gameStateRef.current;
    const debrisColors = ['#333333', '#666666', '#999999', '#FF6B6B', '#FFA500'];
    
    // Create car debris particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      const color = debrisColors[Math.floor(Math.random() * debrisColors.length)];
      
      state.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2, // Slight upward bias
        life: 80 + Math.random() * 40,
        maxLife: 80 + Math.random() * 40,
        color: color
      });
    }
  };

  const addScreenShake = (intensity: number = 5) => {
    const state = gameStateRef.current;
    state.screenShake = Math.max(state.screenShake, intensity);
  };

  const addScore = (points: number, x?: number, y?: number) => {
    const state = gameStateRef.current;
    const multiplier = Date.now() < state.doublePointsEndTime ? 2 : 1;
    const finalPoints = points * multiplier;
    state.score += finalPoints;
    
    if (x && y) {
      const displayText = multiplier > 1 ? `+${finalPoints} (x2!)` : `+${finalPoints}`;
      createScorePopup(x, y, displayText, multiplier > 1 ? '#FF1493' : '#FFD700');
    }
  };

  const shootBullet = () => {
    const state = gameStateRef.current;
    const player = state.player;
    
    state.bullets.push({
      x: player.x + player.width / 2 - 4,
      y: player.y,
      width: 8,
      height: 16,
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
        x: Math.random() * (1200 - 60),
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
    
    if (now - state.lastPowerupSpawn > 5333 && Math.random() < 0.3) {
      const powerupTypes: ('life' | 'speed' | 'invulnerability' | 'gun' | 'doublepoints')[] = ['life', 'speed', 'invulnerability', 'gun', 'doublepoints'];
      const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
      
      // Set dimensions based on powerup type to maintain aspect ratio
      let width = 40, height = 40;
      if (randomType === 'speed') {
        width = 32; // Narrower for the diagonal lightning bolt
        height = 48; // Taller to match the diagonal shape
      } else if (randomType === 'doublepoints') {
        width = 40; // Square for the star
        height = 40;
      }
      
      state.powerups.push({
        x: Math.random() * (1200 - width),
        y: -height,
        width: width,
        height: height,
        speed: 2,
        powerupType: randomType
      });
      state.lastPowerupSpawn = now;
    }
  };

  const spawnCoin = () => {
    const now = Date.now();
    const state = gameStateRef.current;
    
    if (now - state.lastCoinSpawn > 3000 && Math.random() < 0.4) { // Spawn every 3 seconds, 40% chance
      const coinTypes: { type: Coin['coinType'], points: number }[] = [
        { type: 'btc', points: 100 },    // Bitcoin - highest value
        { type: 'eth', points: 75 },     // Ethereum - second highest  
        { type: 'bnb', points: 25 },     // Binance Coin - lower value
        { type: 'doge', points: 25 }     // Dogecoin - same as BNB
      ];
      
      const randomCoinData = coinTypes[Math.floor(Math.random() * coinTypes.length)];
      
      const coin: Coin = {
        x: Math.random() * (1200 - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 2,
        coinType: randomCoinData.type,
        points: randomCoinData.points
      };
      
      state.coins.push(coin);
      state.lastCoinSpawn = now;
    }
  };

  const updateGameObjects = () => {
    const state = gameStateRef.current;
    const now = Date.now();
    
    // Update powerup effects
    if (now > state.speedBoostEndTime && state.player.speed > state.originalPlayerSpeed) {
      state.player.speed = state.originalPlayerSpeed;
    }
    
    // Reset combo if timeout
    if (now > state.comboEndTime) {
      state.comboCount = 0;
    }
    
    // Add distance-based scoring (every second survived = 10 points)
    if (state.isRunning && !state.isPaused && now - state.lastHitTime > 1000) {
      addScore(10);
      state.lastHitTime = now;
    }
    
    // Update visual effects
    state.explosions = state.explosions.filter(explosion => {
      const elapsed = now - explosion.startTime;
      const progress = elapsed / 500; // 500ms duration
      explosion.radius = explosion.maxRadius * progress;
      explosion.alpha = 1 - progress;
      return progress < 1;
    });
    
    state.scorePopups = state.scorePopups.filter(popup => {
      const elapsed = now - popup.startTime;
      const progress = elapsed / 1000; // 1s duration
      popup.y -= 2; // Float upward
      popup.alpha = 1 - progress;
      return progress < 1;
    });
    
    state.particles = state.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      return particle.life > 0;
    });
    
    // Reduce screen shake
    if (state.screenShake > 0) {
      state.screenShake *= 0.9;
      if (state.screenShake < 0.1) state.screenShake = 0;
    }
    
    // Update obstacles - all obstacles now move at the current speed
    state.obstacles.forEach(obstacle => {
      obstacle.speed = getCurrentObstacleSpeed();
    });
    
    state.obstacles = state.obstacles.filter(obstacle => {
      obstacle.y += obstacle.speed;
      return obstacle.y < 800;
    });

    // Update powerups
    state.powerups = state.powerups.filter(powerup => {
      powerup.y += powerup.speed;
      return powerup.y < 800; // Remove when off-screen
    });
    
    // Update coins
    state.coins = state.coins.filter(coin => {
      coin.y += coin.speed;
      return coin.y < 800; // Remove when off-screen
    });

    // Update bullets
    state.bullets = state.bullets.filter(bullet => {
      bullet.y -= bullet.speed;
      return bullet.y > 0;
    });
  };

  const activatePowerup = (powerupType: 'life' | 'speed' | 'invulnerability' | 'gun' | 'doublepoints') => {
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
      case 'doublepoints':
        state.doublePointsEndTime = now + 10000; // 10 seconds
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
          state.streakCount = 0; // Reset streak on hit
          state.comboCount = 0; // Reset combo on hit
          addScreenShake(8);
          createExplosion(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
          createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, '#FF0000', 8);
          
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
        addScore(50, powerup.x + powerup.width/2, powerup.y + powerup.height/2);
        createParticles(powerup.x + powerup.width/2, powerup.y + powerup.height/2, '#00FF00', 6);
        playPowerupSound();
        updateGameState();
        return false;
      }
      return true;
    });

    // Check coin collisions
    state.coins = state.coins.filter(coin => {
      if (isColliding(state.player, coin)) {
        addScore(coin.points, coin.x + coin.width/2, coin.y + coin.height/2);
        createParticles(coin.x + coin.width/2, coin.y + coin.height/2, '#FFD700', 4);
        playPowerupSound(); // Reuse powerup sound for coins
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
          
          // Scoring and combo system
          state.comboCount++;
          state.streakCount++;
          state.bestStreak = Math.max(state.bestStreak, state.streakCount);
          state.comboEndTime = now + 2000; // 2 second combo window
          
          const basePoints = 100;
          const comboBonus = state.comboCount > 1 ? state.comboCount * 25 : 0;
          const totalPoints = basePoints + comboBonus;
          
          addScore(totalPoints, obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
          createExplosion(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
          createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, '#FFD700', 15);
          createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, '#FF6B6B', 8);
          createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, '#FFA500', 12);
          createDebrisParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
          addScreenShake(6);
          
          // Create multiple explosions for enhanced effect
          setTimeout(() => {
            createExplosion(obstacle.x + obstacle.width/2 + (Math.random() - 0.5) * 20, 
                          obstacle.y + obstacle.height/2 + (Math.random() - 0.5) * 20);
          }, 100);
          
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
    
    // Apply screen shake
    if (state.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake;
      const shakeY = (Math.random() - 0.5) * state.screenShake;
      ctx.save();
      ctx.translate(shakeX, shakeY);
    }
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road lines
    ctx.fillStyle = '#333333';
    for (let i = 0; i < canvas.height; i += 60) {
      ctx.fillRect(canvas.width / 3, i + (Date.now() / 10) % 60, 4, 30);
      ctx.fillRect((canvas.width * 2) / 3, i + (Date.now() / 10) % 60, 4, 30);
    }

    // Draw player car using image with invulnerability flashing
    const player = state.player;
    
    // Draw speed boost particles
    if (Date.now() < state.speedBoostEndTime) {
      createParticles(player.x + player.width/2, player.y + player.height, '#00FFFF', 3);
    }
    const isInvulnerable = Date.now() < state.invulnerabilityEndTime;
    const shouldFlash = isInvulnerable && Math.floor(Date.now() / 100) % 2; // Flash every 100ms
    
    if (!shouldFlash) {
      const playerImage = imagesRef.current[player.type || 'mycar'];
      if (playerImage) {
        ctx.drawImage(
          playerImage,
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
    }

    // Draw obstacles using images
    state.obstacles.forEach(obstacle => {
      const obstacleImage = imagesRef.current[obstacle.type || 'red'];
      if (obstacleImage) {
        ctx.drawImage(
          obstacleImage,
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

    // Draw powerups with icons (mix of images and emojis)
    state.powerups.forEach(powerup => {
      const { x, y, width, height, powerupType } = powerup;
      
      // Draw the appropriate powerup icon
      switch (powerupType) {
        case 'life':
          const lifeImage = imagesRef.current['life'];
          if (lifeImage) {
            ctx.drawImage(lifeImage, x, y, width, height);
          }
          break;
        case 'speed':
          ctx.font = `${height}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('⚡️', x + width/2, y + height - 2);
          break;
        case 'invulnerability':
          const shieldImage = imagesRef.current['shield'];
          if (shieldImage) {
            ctx.drawImage(shieldImage, x, y, width, height);
          }
          break;
        case 'gun':
          ctx.font = `${height}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('🔫', x + width/2, y + height - 2);
          break;
        case 'doublepoints':
          ctx.font = `${height}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('⭐', x + width/2, y + height - 2);
          break;
      }
    });

    // Draw coins
    state.coins.forEach(coin => {
      const { x, y, width, height, coinType } = coin;
      const coinImage = imagesRef.current[coinType];
      if (coinImage) {
        ctx.drawImage(coinImage, x, y, width, height);
      } else {
        // Fallback to colored circle if image not loaded
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2, width/2, 0, 2 * Math.PI);
        ctx.fill();
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

    // Draw explosions with enhanced effects
    state.explosions.forEach(explosion => {
      const progress = explosion.radius / explosion.maxRadius;
      
      ctx.save();
      ctx.globalAlpha = explosion.alpha;
      
      // Draw multiple colored rings for more dramatic effect
      const colors = ['#FF6B6B', '#FFA500', '#FFD700', '#FF1493'];
      colors.forEach((color, index) => {
        const ringRadius = explosion.radius - (index * 8);
        if (ringRadius > 0) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 4 - index;
          ctx.beginPath();
          ctx.arc(explosion.x, explosion.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      
      // Add a filled center flash effect for early explosion
      if (progress < 0.3) {
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = (0.3 - progress) / 0.3 * 0.8;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
    
    // Draw particles with enhanced debris effects
    state.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      
      // Make debris particles larger and more varied
      if (particle.color.includes('#333') || particle.color.includes('#666') || particle.color.includes('#999')) {
        // Debris particles - make them rectangular like car parts
        const size = 2 + Math.random() * 3;
        ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size * 1.5);
      } else {
        // Regular explosion particles
        ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
      }
      
      ctx.restore();
    });
    
    // Draw score popups
    state.scorePopups.forEach(popup => {
      ctx.save();
      ctx.globalAlpha = popup.alpha;
      ctx.fillStyle = popup.color;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.restore();
    });
    
    // Restore screen shake transform
    if (state.screenShake > 0) {
      ctx.restore();
    }
    
    // Draw powerup timers below player car with pixel art icons
    const now = Date.now();
    let timerY = player.y + player.height + 20;
    
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    
    const drawPowerupIcon = (x: number, y: number, type: 'life' | 'speed' | 'invulnerability' | 'gun' | 'doublepoints', scale = 0.6) => {
      const size = 32 * scale;
      const iconX = x;
      const iconY = y - size + 4;
      
      // Draw the appropriate powerup icon (mix of images and emojis)
      switch (type) {
        case 'life':
          const lifeImage = imagesRef.current['life'];
          if (lifeImage) {
            ctx.drawImage(lifeImage, iconX, iconY, size, size);
          }
          break;
        case 'speed':
          ctx.font = `${size}px monospace`;
          ctx.textAlign = 'left';
          ctx.fillText('⚡️', iconX, iconY + size - 2);
          break;
        case 'invulnerability':
          const shieldImage = imagesRef.current['shield'];
          if (shieldImage) {
            ctx.drawImage(shieldImage, iconX, iconY, size, size);
          }
          break;
        case 'gun':
          ctx.font = `${size}px monospace`;
          ctx.textAlign = 'left';
          ctx.fillText('🔫', iconX, iconY + size - 2);
          break;
        case 'doublepoints':
          ctx.font = `${size}px monospace`;
          ctx.textAlign = 'left';
          ctx.fillText('⭐', iconX, iconY + size - 2);
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
      timerY += 24;
    }
    
    if (now < state.doublePointsEndTime) {
      const timeLeft = Math.ceil((state.doublePointsEndTime - now) / 1000);
      const iconX = player.x + player.width / 2 - 40;
      drawPowerupIcon(iconX, timerY, 'doublepoints'); // Use exp icon for double points
      ctx.fillStyle = '#FF1493';
      ctx.fillText(`2x EXP ${timeLeft}s`, iconX + 25, timerY - 4);
    }
  };

  const gameLoop = () => {
    const state = gameStateRef.current;
    
    // Check if game over animation delay has ended
    if (state.gameOverAnimationEndTime > 0 && Date.now() >= state.gameOverAnimationEndTime) {
      state.gameOverAnimationEndTime = 0;
      finalizeGameOver();
      return;
    }
    
    // During game over animation, continue rendering but skip game logic
    const isGameOverAnimation = state.gameOverAnimationEndTime > 0;
    
    if (!state.isRunning && !isGameOverAnimation) return;
    if (state.isPaused) return;

    // Only run game logic during normal gameplay, not during game over animation
    if (!isGameOverAnimation) {
      handleInput();
      spawnObstacle();
      spawnPowerup();
      spawnCoin();
      updateGameObjects();
      checkCollisions();
    }
    
    render();

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
    state.coins = [];
    state.explosions = [];
    state.scorePopups = [];
    state.particles = [];
    state.player = { x: 575, y: 700, width: 50, height: 80, speed: 5, type: 'mycar' };
    state.gameStartTime = Date.now();
    state.baseObstacleSpeed = 3;
    state.totalPausedTime = 0;
    state.pauseStartTime = 0;
    state.lastObstacleSpawn = 0;
    state.lastPowerupSpawn = 0;
    state.lastCoinSpawn = 0;
    state.speedBoostEndTime = 0;
    state.invulnerabilityEndTime = 0;
    state.gunEndTime = 0;
    state.doublePointsEndTime = 0;
    state.originalPlayerSpeed = 5;
    state.comboCount = 0;
    state.comboEndTime = 0;
    state.streakCount = 0;
    state.lastHitTime = Date.now();
    state.screenShake = 0;
    state.resumeCountdown = 0;
    state.gameOverAnimationEndTime = 0;
    updateGameState();
    
    // Only start music if user preference is enabled
    if (isMusicPlaying) {
      startMusic();
    }
    
    gameLoop();
  };

  const pauseGame = () => {
    const state = gameStateRef.current;
    state.isPaused = true;
    state.pauseStartTime = Date.now();
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
    state.resumeCountdown = 3; // Start 3-second countdown
    updateGameState();
    
    const countdownInterval = setInterval(() => {
      const currentState = gameStateRef.current;
      currentState.resumeCountdown--;
      updateGameState();
      
      if (currentState.resumeCountdown <= 0) {
        clearInterval(countdownInterval);
        currentState.isPaused = false;
        // Add paused time to total
        currentState.totalPausedTime += Date.now() - currentState.pauseStartTime;
        if (audioRef.current && isMusicPlaying) {
          audioRef.current.play().catch(e => console.log('Could not resume audio:', e));
        }
        updateGameState();
        gameLoop();
      }
    }, 1000);
  };

  const quitToMainMenu = () => {
    const state = gameStateRef.current;
    state.isRunning = false;
    state.isPaused = false;
    state.gameStarted = false;
    
    // Stop music if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Cancel animation frame
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    updateGameState();
  };

  const gameOver = () => {
    const state = gameStateRef.current;
    const player = state.player;
    
    // Use same visual effects as car destruction when shooting
    createExplosion(player.x + player.width/2, player.y + player.height/2);
    createParticles(player.x + player.width/2, player.y + player.height/2, '#FFD700', 15);
    createParticles(player.x + player.width/2, player.y + player.height/2, '#FF6B6B', 8);
    createParticles(player.x + player.width/2, player.y + player.height/2, '#FFA500', 12);
    createDebrisParticles(player.x + player.width/2, player.y + player.height/2);
    addScreenShake(6);
    
    // Create multiple explosions for enhanced effect (same as car destruction)
    setTimeout(() => {
      createExplosion(player.x + player.width/2 + (Math.random() - 0.5) * 20, 
                    player.y + player.height/2 + (Math.random() - 0.5) * 20);
    }, 100);
    
    // Add additional colored circle explosions around the player
    setTimeout(() => {
      createExplosion(player.x + player.width/2 - 30, player.y + player.height/2 - 15);
      createExplosion(player.x + player.width/2 + 30, player.y + player.height/2 - 15);
      createExplosion(player.x + player.width/2, player.y + player.height/2 + 25);
    }, 200);
    
    setTimeout(() => {
      createExplosion(player.x + player.width/2 - 20, player.y + player.height/2 + 20);
      createExplosion(player.x + player.width/2 + 25, player.y + player.height/2 + 15);
    }, 300);
    
    // Play game over sound
    playGameOverSound();
    
    // Set animation end time for 1.5 second delay
    state.gameOverAnimationEndTime = Date.now() + 1500;
    
    // Continue game loop to show effects, but delay final game over state
    updateGameState();
  };

  const finalizeGameOver = () => {
    const state = gameStateRef.current;
    state.isRunning = false;
    
    if (state.score > localHighScore) {
      setLocalHighScore(state.score);
      localStorage.setItem('hodlTheWheelHighScore', state.score.toString());
    }

    pauseMusicTemporarily();
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
      <div className="min-h-screen bg-black text-white flex flex-col justify-start pixel-font p-2 sm:p-4 overflow-y-auto">
        <div className="text-center w-full max-w-md mx-auto">
          <div className="text-xl sm:text-4xl text-white mb-3 sm:mb-8 animate-pulse mt-2 sm:mt-8">HODL THE WHEEL</div>
          
          {/* Portrait optimization notice */}
          <div className="block sm:hidden mb-3 text-xs text-gray-400 bg-gray-800 rounded px-2 py-1">
            📱 Optimized for portrait mode
          </div>
          
          <Card className="mb-3 sm:mb-8 border-2 sm:border-4 border-white bg-gray-900 w-full mx-auto">
            <CardContent className="p-4">
              <div className="text-left space-y-2">
                <div className="text-sm text-green-400">🚗 AVOID OBSTACLES</div>
                <div className="text-sm text-red-400">🔥 COLLECT POWERUPS</div>
                <div className="text-sm text-blue-400">💰 COLLECT CRYPTO COINS</div>
                <div className="text-sm text-yellow-400">⭐ SURVIVE AS LONG AS POSSIBLE</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-3 sm:mb-8 bg-gray-900 border-2 border-gray-600 w-full mx-auto">
            <CardContent className="p-2 sm:p-4">
              <div className="text-sm text-white mb-2 sm:mb-4">CONTROLS</div>
              <div className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-4 text-left">
                <div className="text-xs text-gray-300">SWIPE / ARROW KEYS: Move</div>
                <div className="text-xs text-gray-300">TAP / SPACE: Shoot</div>
                <div className="text-xs text-gray-300">ESC: Pause/Menu</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-3 sm:mb-8 bg-gray-900 border-2 border-gray-600 w-full mx-auto">
            <CardContent className="p-2 sm:p-4">
              <div className="text-sm text-white mb-2 sm:mb-4">POWERUPS</div>
              <div className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-2 text-left">
                <div className="text-xs text-pink-400 flex items-center gap-1">
                  <img src={lifeIcon} alt="Life" className="w-3 h-3 sm:w-4 sm:h-4" />
                  Life
                </div>
                <div className="text-xs text-cyan-400 flex items-center gap-1">
                  <span className="text-sm">⚡️</span>
                  Speed
                </div>
                <div className="text-xs text-yellow-400 flex items-center gap-1">
                  <img src={shieldIcon} alt="Shield" className="w-3 h-3 sm:w-4 sm:h-4" />
                  Shield
                </div>
                <div className="text-xs text-red-400 flex items-center gap-1">
                  <span className="text-sm">🔫</span>
                  Gun
                </div>
                <div className="text-xs text-purple-400 flex items-center gap-1 sm:col-span-2 sm:justify-center">
                  <span className="text-sm">⭐</span>
                  Double Points
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col items-center space-y-2 sm:space-y-4 mb-4">
            <Button 
              onClick={startGame}
              className="retro-button text-sm sm:text-lg w-full max-w-xs"
            >
              START GAME
            </Button>
            
            <Button 
              onClick={toggleMusic}
              className="retro-button text-xs sm:text-sm w-full max-w-xs"
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
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Game Canvas - Fullscreen on mobile */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        width="1200" 
        height="800"
        style={{ 
          imageRendering: 'pixelated',
          touchAction: 'none',
          userSelect: 'none',
          width: '100vw',
          height: '100vh'
        }}
      />
      
      {/* Resume Countdown - Fullscreen */}
      {gameState.resumeCountdown > 0 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="text-6xl pixel-font text-white animate-pulse">
            {gameState.resumeCountdown}
          </div>
        </div>
      )}
      
      {/* Game UI Overlay */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-20">
        {/* Mobile Layout - Ultra-compact for small screens */}
        <div className="block sm:hidden">
          <div className="flex justify-between items-center text-xs bg-black bg-opacity-60 rounded px-1 py-0.5 border border-white border-opacity-20">
            {/* Lives */}
            <div className="flex space-x-0.5">
              {[...Array(3)].map((_, i) => (
                <span 
                  key={i}
                  className="text-xs"
                  style={{ 
                    color: i < gameState.lives ? '#FF1493' : '#333333' 
                  }}
                >
                  ♥
                </span>
              ))}
              {/* Touch status indicator */}
              {showTouchFeedback && (
                <span className="text-xs text-cyan-400 ml-1">📱</span>
              )}
            </div>
            
            {/* Score in center */}
            <div className="pixel-font text-xs text-yellow-400">
              {gameState.score}
            </div>
            
            {/* High Score on right */}
            <div className="pixel-font text-xs text-green-400">
              H:{Math.max(gameState.score, localHighScore)}
            </div>
          </div>
          
          {/* Combo and Streak - Only show when active, very compact */}
          {(gameState.comboCount > 1 || gameState.streakCount > 0) && (
            <div className="flex justify-center space-x-2 mt-1">
              {gameState.comboCount > 1 && (
                <div className="pixel-font text-xs text-cyan-400 bg-black bg-opacity-75 px-1 rounded">
                  x{gameState.comboCount}
                </div>
              )}
              {gameState.streakCount > 0 && (
                <div className="pixel-font text-xs text-green-400 bg-black bg-opacity-75 px-1 rounded">
                  {gameState.streakCount}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Desktop Layout - Full information display */}
        <div className="hidden sm:grid grid-cols-3 gap-4 max-w-4xl mx-auto items-center bg-black bg-opacity-50 p-2 rounded">
          {/* Lives Display */}
          <div className="flex items-center justify-center space-x-2">
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
            {gameState.comboCount > 1 && (
              <div className="pixel-font text-sm text-cyan-400">
                COMBO x{gameState.comboCount}
              </div>
            )}
            {gameState.streakCount > 0 && (
              <div className="pixel-font text-xs text-green-400">
                Streak: {gameState.streakCount}
              </div>
            )}
          </div>
          
          {/* High Score */}
          <div className="text-center">
            <div className="pixel-font text-sm text-gray-400">HIGH SCORE</div>
            <div className="pixel-font text-lg text-yellow-400">
              {localHighScore.toString().padStart(6, '0')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Touch Control Guide */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 block sm:hidden">
        <div className="relative">
          {/* Main control circle with touch feedback */}
          <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            showTouchFeedback 
              ? 'border-cyan-400 bg-cyan-400 bg-opacity-20 scale-110' 
              : 'border-white border-opacity-30 bg-white bg-opacity-10'
          }`}>
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center ${
              showTouchFeedback 
                ? 'border-cyan-400 border-opacity-70' 
                : 'border-white border-opacity-50'
            }`}>
              <div className={`text-xs text-center pixel-font ${
                showTouchFeedback 
                  ? 'text-cyan-400' 
                  : 'text-white text-opacity-75'
              }`}>
                {showTouchFeedback ? 'MOVE' : 'SWIPE'}
              </div>
            </div>
          </div>
          
          {/* Direction indicators with active states */}
          <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 text-xs ${
            touchKeysRef.current['arrowup'] || touchKeysRef.current['w'] 
              ? 'text-cyan-400 scale-125' 
              : 'text-white text-opacity-50'
          }`}>↑</div>
          <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs ${
            touchKeysRef.current['arrowdown'] || touchKeysRef.current['s'] 
              ? 'text-cyan-400 scale-125' 
              : 'text-white text-opacity-50'
          }`}>↓</div>
          <div className={`absolute left-1 top-1/2 transform -translate-y-1/2 text-xs ${
            touchKeysRef.current['arrowleft'] || touchKeysRef.current['a'] 
              ? 'text-cyan-400 scale-125' 
              : 'text-white text-opacity-50'
          }`}>←</div>
          <div className={`absolute right-1 top-1/2 transform -translate-y-1/2 text-xs ${
            touchKeysRef.current['arrowright'] || touchKeysRef.current['d'] 
              ? 'text-cyan-400 scale-125' 
              : 'text-white text-opacity-50'
          }`}>→</div>
        </div>
        
        {/* Tap to shoot indicator */}
        {Date.now() < gameState.gunEndTime && (
          <div className="text-center mt-2 text-xs text-white text-opacity-75 pixel-font animate-pulse">
            TAP TO SHOOT
          </div>
        )}
      </div>

      {/* Active Powerups Indicator - Mobile fullscreen optimized */}
      <div className="absolute top-14 left-2 right-2 flex flex-wrap justify-center gap-1 z-20">
        {Date.now() < gameState.speedBoostEndTime && (
          <div className="pixel-font text-xs text-cyan-400 bg-black bg-opacity-75 px-2 py-1 rounded">
            SPEED BOOST
          </div>
        )}
        {Date.now() < gameState.invulnerabilityEndTime && (
          <div className="pixel-font text-xs text-yellow-400 bg-black bg-opacity-75 px-2 py-1 rounded">
            WARDEN PROTECTION
          </div>
        )}
        {Date.now() < gameState.gunEndTime && (
          <div className="pixel-font text-xs text-red-400 bg-black bg-opacity-75 px-2 py-1 rounded">
            GUN ACTIVE
          </div>
        )}
        {Date.now() < gameState.doublePointsEndTime && (
          <div className="pixel-font text-xs text-pink-400 bg-black bg-opacity-75 px-2 py-1 rounded">
            DOUBLE POINTS
          </div>
        )}
      </div>
      
      {/* Game Over Screen - Fullscreen */}
      {!gameState.isRunning && gameState.gameStarted && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <Card className="bg-black border-4 border-white p-4 sm:p-8 max-w-md w-full">
            <CardContent className="text-center">
              <div className="pixel-font text-xl sm:text-2xl text-red-500 mb-4">GAME OVER</div>
              <div className="pixel-font text-sm sm:text-lg text-white mb-2">FINAL SCORE</div>
              <div className="pixel-font text-lg sm:text-xl text-yellow-400 mb-6">
                {gameState.score.toString().padStart(6, '0')}
              </div>
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <Button onClick={restartGame} className="retro-button w-full sm:w-auto">
                  RESTART GAME
                </Button>
                
                <Button 
                  onClick={toggleMusic}
                  className="retro-button text-sm w-full sm:w-auto"
                  variant="outline"
                >
                  {isMusicPlaying ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF'}
                </Button>
                
                <Button 
                  onClick={quitToMainMenu}
                  className="retro-button text-sm w-full sm:w-auto"
                  variant="destructive"
                >
                  QUIT TO MAIN MENU
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Pause Screen - Fullscreen */}
      {gameState.isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <Card className="bg-black border-4 border-white p-4 sm:p-8 w-full max-w-sm">
            <CardContent className="text-center">
              <div className="pixel-font text-xl sm:text-2xl text-yellow-400 mb-6">PAUSED</div>
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <Button onClick={resumeGame} className="retro-button w-full sm:w-auto">
                  RESUME
                </Button>
                
                <Button 
                  onClick={toggleMusic}
                  className="retro-button text-sm w-full sm:w-auto"
                  variant="outline"
                >
                  {isMusicPlaying ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF'}
                </Button>
                
                <Button 
                  onClick={quitToMainMenu}
                  className="retro-button text-sm w-full sm:w-auto"
                  variant="destructive"
                >
                  QUIT TO MAIN MENU
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
