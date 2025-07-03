// Clean canvas fix - simple approach that always renders the canvas
import { useEffect, useRef } from 'react';

export default function GameClean() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    console.log('Canvas found! Starting game...');
    // Game logic goes here
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Canvas is always rendered */}
      <canvas 
        ref={canvasRef}
        width={1200}
        height={800}
        className="hidden"
      />
      
      {/* Start screen */}
      <div className="flex items-center justify-center h-full">
        <button 
          onClick={startGame}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          START GAME
        </button>
      </div>
    </div>
  );
}