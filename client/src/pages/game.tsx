import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HighScore } from "@shared/schema";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  gameStarted: boolean;
  lives: number;
  score: number;
  player: GameObject;
  obstacles: GameObject[];
  powerups: GameObject[];
  lastObstacleSpawn: number;
  lastPowerupSpawn: number;
  difficulty: number;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    isRunning: false,
    isPaused: false,
    gameStarted: false,
    lives: 3,
    score: 0,
    player: { x: 375, y: 500, width: 50, height: 80, speed: 5 },
    obstacles: [],
    powerups: [],
    lastObstacleSpawn: 0,
    lastPowerupSpawn: 0,
    difficulty: 1
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const animationIdRef = useRef<number>();

  const [gameState, setGameState] = useState(gameStateRef.current);
  const [localHighScore, setLocalHighScore] = useState(
    parseInt(localStorage.getItem('carRushHighScore') || '0')
  );

  const { data: highScores } = useQuery<HighScore[]>({
    queryKey: ['/api/high-scores'],
  });

  const addHighScoreMutation = useMutation({
    mutationFn: async (data: { playerName: string; score: number; createdAt: string }) => {
      const response = await apiRequest('POST', '/api/high-scores', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/high-scores'] });
    }
  });

  const updateGameState = useCallback(() => {
    setGameState({ ...gameStateRef.current });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
      e.preventDefault();
      if (gameStateRef.current.isRunning && !gameStateRef.current.isPaused) {
        pauseGame();
      } else if (gameStateRef.current.isPaused) {
        resumeGame();
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

  const spawnObstacle = () => {
    const now = Date.now();
    const state = gameStateRef.current;
    const spawnRate = Math.max(500 - (state.difficulty * 50), 100);
    
    if (now - state.lastObstacleSpawn > spawnRate) {
      state.obstacles.push({
        x: Math.random() * (800 - 60),
        y: -80,
        width: 60,
        height: 80,
        speed: 3 + (state.difficulty * 0.5)
      });
      state.lastObstacleSpawn = now;
    }
  };

  const spawnPowerup = () => {
    const now = Date.now();
    const state = gameStateRef.current;
    
    if (now - state.lastPowerupSpawn > 8000 && Math.random() < 0.3) {
      state.powerups.push({
        x: Math.random() * (800 - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 2
      });
      state.lastPowerupSpawn = now;
    }
  };

  const updateGameObjects = () => {
    const state = gameStateRef.current;
    
    // Update obstacles
    state.obstacles = state.obstacles.filter(obstacle => {
      obstacle.y += obstacle.speed;
      return obstacle.y < 600;
    });

    // Update powerups
    state.powerups = state.powerups.filter(powerup => {
      powerup.y += powerup.speed;
      return powerup.y < 600;
    });

    // Increase difficulty over time
    state.difficulty = Math.floor(state.score / 1000) + 1;
  };

  const checkCollisions = () => {
    const state = gameStateRef.current;
    
    // Check obstacle collisions
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

    // Check powerup collisions
    state.powerups = state.powerups.filter(powerup => {
      if (isColliding(state.player, powerup)) {
        state.lives = Math.min(3, state.lives + 1);
        state.score += 500;
        updateGameState();
        return false;
      }
      return true;
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

    // Draw player car (8-bit style)
    const player = state.player;
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(player.x + 10, player.y + 10, 10, 15);
    ctx.fillRect(player.x + 30, player.y + 10, 10, 15);
    ctx.fillRect(player.x + 10, player.y + 55, 10, 15);
    ctx.fillRect(player.x + 30, player.y + 55, 10, 15);

    // Draw obstacles
    state.obstacles.forEach(obstacle => {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 10, 10);
      ctx.fillRect(obstacle.x + 45, obstacle.y + 5, 10, 10);
      ctx.fillRect(obstacle.x + 5, obstacle.y + 65, 10, 10);
      ctx.fillRect(obstacle.x + 45, obstacle.y + 65, 10, 10);
    });

    // Draw powerups
    state.powerups.forEach(powerup => {
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      ctx.fillStyle = '#FF69B4';
      ctx.fillRect(powerup.x + 5, powerup.y + 5, 20, 5);
      ctx.fillRect(powerup.x + 10, powerup.y + 10, 10, 10);
      ctx.fillRect(powerup.x + 5, powerup.y + 20, 20, 5);
    });
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
    state.player = { x: 375, y: 500, width: 50, height: 80, speed: 5 };
    state.difficulty = 1;
    updateGameState();
    gameLoop();
  };

  const pauseGame = () => {
    const state = gameStateRef.current;
    state.isPaused = true;
    updateGameState();
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  const resumeGame = () => {
    const state = gameStateRef.current;
    state.isPaused = false;
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

    // Submit high score to server
    if (state.score > 0) {
      addHighScoreMutation.mutate({
        playerName: 'Anonymous',
        score: state.score,
        createdAt: new Date().toISOString()
      });
    }

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
                <div className="text-xs text-gray-300">SPACE: Pause</div>
                <div className="text-xs text-gray-300">ESC: Menu</div>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            onClick={startGame}
            className="retro-button text-lg"
          >
            START GAME
          </Button>
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
                  className="w-6 h-6 border-2 border-white"
                  style={{ 
                    backgroundColor: i < gameState.lives ? '#FF69B4' : '#333333' 
                  }}
                />
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
              <Button onClick={restartGame} className="retro-button">
                RESTART GAME
              </Button>
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
              <Button onClick={resumeGame} className="retro-button">
                RESUME
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
