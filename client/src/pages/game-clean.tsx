// Clean working version to replace corrupted game.tsx
// This addresses the canvas reference issue properly

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function GameClean() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  const startGame = () => {
    console.log('Starting game...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found - this should not happen as canvas is always rendered');
      return;
    }
    console.log('Canvas found successfully:', canvas.width, 'x', canvas.height);
    setGameStarted(true);
    // Game initialization logic would go here
  };

  return (
    <>
      {/* Canvas is always rendered to ensure it's available */}
      <canvas 
        ref={canvasRef}
        width={1200}
        height={800}
        className={gameStarted ? "fixed inset-0 touch-none" : "fixed inset-0 opacity-0 pointer-events-none"}
        style={{
          imageRendering: 'pixelated',
          touchAction: 'none',
          userSelect: 'none',
          width: gameStarted ? '100vw' : 'auto',
          height: gameStarted ? '100vh' : 'auto',
          objectFit: gameStarted ? 'contain' : 'none'
        }}
      />
      
      {!gameStarted && (
        <div className="fixed inset-0 min-h-screen bg-black text-white flex flex-col justify-center items-center pixel-font z-10">
          <div className="text-center">
            <h1 className="text-4xl mb-8 animate-pulse">HODL THE WHEEL</h1>
            <Button 
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
            >
              START GAME
            </Button>
          </div>
        </div>
      )}
      
      {gameStarted && (
        <div className="fixed inset-0 bg-black z-0">
          <div className="text-white text-center mt-4">
            Game is running! Canvas is available.
          </div>
        </div>
      )}
    </>
  );
}