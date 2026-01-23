import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy } from 'lucide-react';

const GRID_SIZE = 20;
const SPEED = 100;

export default function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [snake, setSnake] = useState<{ x: number, y: number }[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<{ x: number, y: number }>({ x: 15, y: 15 });
    const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isPaused, setIsPaused] = useState(true);

    // Initialize Game
    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setDirection('RIGHT');
        setGameOver(false);
        setScore(0);
        setIsPaused(false);
        spawnFood();
    };

    const spawnFood = () => {
        const x = Math.floor(Math.random() * (400 / GRID_SIZE));
        const y = Math.floor(Math.random() * (400 / GRID_SIZE));
        setFood({ x, y });
    };

    // Game Loop
    useEffect(() => {
        if (isPaused || gameOver) return;

        const interval = setInterval(() => {
            setSnake(prev => {
                const newHead = { ...prev[0] };

                switch (direction) {
                    case 'UP': newHead.y -= 1; break;
                    case 'DOWN': newHead.y += 1; break;
                    case 'LEFT': newHead.x -= 1; break;
                    case 'RIGHT': newHead.x += 1; break;
                }

                // Check Wall Collision
                if (newHead.x < 0 || newHead.x >= (400 / GRID_SIZE) || newHead.y < 0 || newHead.y >= (400 / GRID_SIZE)) {
                    setGameOver(true);
                    return prev;
                }

                // Check Self Collision
                if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                    setGameOver(true);
                    return prev;
                }

                const newSnake = [newHead, ...prev];

                // Check Food Collision
                if (newHead.x === food.x && newHead.y === food.y) {
                    setScore(s => s + 10);
                    spawnFood();
                } else {
                    newSnake.pop();
                }

                return newSnake;
            });
        }, SPEED);

        return () => clearInterval(interval);
    }, [direction, isPaused, gameOver, food]);

    // Draw Canvas
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 400, 400);

        // Draw Snake
        ctx.fillStyle = gameOver ? '#ef4444' : '#22c55e';
        snake.forEach(segment => {
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
        });

        // Draw Food
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();

    }, [snake, food, gameOver]);

    // Input Handling
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
                case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
                case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
                case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [direction]);

    // High Score Sync
    useEffect(() => {
        if (score > highScore) setHighScore(score);
    }, [score]);

    return (
        <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center relative overflow-hidden text-white font-mono">
            {/* Header */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-white/10 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold text-xl">SNAKE</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/50 rounded text-green-300">v1.0</span>
                </div>
                <div className="flex gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase">Score</span>
                        <span className="text-lg font-bold">{score}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase flex items-center gap-1"><Trophy size={10} /> High</span>
                        <span className="text-lg font-bold text-yellow-400">{highScore}</span>
                    </div>
                </div>
            </div>

            {/* Game Canvas */}
            <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="bg-[#222] shadow-2xl rounded-lg border border-white/10"
            />

            {/* Overlays */}
            {(isPaused && !gameOver) && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col z-20">
                    <button
                        onClick={resetGame}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-full font-bold transition-transform hover:scale-105"
                    >
                        <Play size={20} fill="black" /> START GAME
                    </button>
                    <p className="mt-4 text-sm text-gray-400">Use Arrow Keys to Move</p>
                </div>
            )}

            {gameOver && (
                <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center flex-col z-20 animate-in fade-in zoom-in duration-300">
                    <h2 className="text-4xl font-black text-white mb-2 text-shadow">GAME OVER</h2>
                    <p className="text-xl mb-6">Score: {score}</p>
                    <button
                        onClick={resetGame}
                        className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-full font-bold transition-transform hover:scale-105"
                    >
                        <RotateCcw size={20} /> TRY AGAIN
                    </button>
                </div>
            )}
        </div>
    );
}
