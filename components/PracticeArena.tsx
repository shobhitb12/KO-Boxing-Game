
import React, { useRef, useEffect } from 'react';
import { Player } from './Player';
import { PunchingBag } from './PunchingBag';
import { CANVAS_WIDTH, CANVAS_HEIGHT, P1_CONTROLS, SETTINGS } from '../constants';
import { PlayerConfig, Particle } from '../types';

interface PracticeArenaProps {
  playerConfig: PlayerConfig;
  bagConfig: PlayerConfig;
  isMuted: boolean;
  onExit: () => void;
}

const PracticeArena: React.FC<PracticeArenaProps> = ({ playerConfig, bagConfig, isMuted, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<{ p1: Player; bag: PunchingBag } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const prevKeysRef = useRef<Set<string>>(new Set());
  const screenShakeRef = useRef(0);
  const sounds = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    const createAudio = (url: string, vol: number = 0.4) => {
      const audio = new Audio(url);
      audio.volume = vol;
      audio.preload = 'auto';
      return audio;
    };

    sounds.current = {
      punch: createAudio('https://www.soundjay.com/misc/sounds/punch-01.mp3'),
      kick: createAudio('https://www.soundjay.com/misc/sounds/kick-01.mp3'),
      hit_light: createAudio('https://www.soundjay.com/misc/sounds/slap-01.mp3'),
      hit_heavy: createAudio('https://www.soundjay.com/misc/sounds/punch-02.mp3'),
      jump: createAudio('https://www.soundjay.com/button/sounds/button-16.mp3'),
    };

    const playSound = (name: string, pitchShift: boolean = false) => {
      if (isMuted) return;
      const s = sounds.current[name];
      if (s) {
        s.currentTime = 0;
        s.playbackRate = pitchShift ? 0.8 + Math.random() * 0.4 : 1.0;
        s.play().catch(e => console.warn("Practice audio blocked:", e));
      }
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p1 = new Player(200, playerConfig);
    const bag = new PunchingBag(bagConfig);
    playersRef.current = { p1, bag };

    let animationId: number;

    const spawnParticles = (x: number, y: number, color: string, count: number = 15) => {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1.0, color
        });
      }
    };

    const checkCollision = (rect1: any, rect2: any) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    };

    const gameLoop = () => {
      const { p1, bag } = playersRef.current!;

      // Input
      p1.vx = 0;
      if (keysRef.current.has(P1_CONTROLS.LEFT)) { p1.vx = -SETTINGS.moveSpeed; p1.facing = -1; }
      if (keysRef.current.has(P1_CONTROLS.RIGHT)) { p1.vx = SETTINGS.moveSpeed; p1.facing = 1; }
      if (keysRef.current.has(P1_CONTROLS.JUMP) && !prevKeysRef.current.has(P1_CONTROLS.JUMP)) {
        if (p1.jump()) playSound('jump');
      }
      if (keysRef.current.has(P1_CONTROLS.PUNCH)) { p1.startCharging('PUNCH'); } 
      else if (prevKeysRef.current.has(P1_CONTROLS.PUNCH)) {
        const atk = p1.releaseAttack();
        if (atk) playSound('punch', atk.isCharged);
      }
      if (keysRef.current.has(P1_CONTROLS.KICK)) { p1.startCharging('KICK'); } 
      else if (prevKeysRef.current.has(P1_CONTROLS.KICK)) {
        const atk = p1.releaseAttack();
        if (atk) playSound('kick', atk.isCharged);
      }

      prevKeysRef.current = new Set(keysRef.current);

      p1.update();
      bag.update();

      // Combat
      const atkHitbox = p1.getAttackHitbox();
      const bagBody = bag.getHitbox();

      if (atkHitbox && checkCollision(atkHitbox, bagBody)) {
        const isCharged = p1.lastAttackWasCharged;
        const force = isCharged ? 12 : 5;
        bag.applyHit(p1.facing * force);
        
        if (isCharged) {
          playSound('hit_heavy', true);
          screenShakeRef.current = 15;
          spawnParticles(atkHitbox.x, atkHitbox.y, '#fff', 20);
        } else {
          playSound('hit_light', true);
          screenShakeRef.current = 5;
          spawnParticles(atkHitbox.x, atkHitbox.y, p1.config.color, 10);
        }
        // Force reset player state to prevent multiple hits in one frame
        p1.stateTimer = Math.min(p1.stateTimer, 2); 
      }

      // Draw
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.save();
      if (screenShakeRef.current > 0) {
        ctx.translate((Math.random() - 0.5) * screenShakeRef.current, (Math.random() - 0.5) * screenShakeRef.current);
        screenShakeRef.current -= 1;
      }

      // Gym Background
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Floor
      ctx.fillStyle = '#333';
      ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
      // Walls
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      for(let x=0; x<CANVAS_WIDTH; x+=100) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT-50); ctx.stroke();
      }

      p1.draw(ctx);
      bag.draw(ctx);

      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        if (p.life <= 0) particlesRef.current.splice(idx, 1);
      });
      ctx.globalAlpha = 1.0;
      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Fix: cast to HTMLAudioElement[] to avoid unknown property errors
      (Object.values(sounds.current) as HTMLAudioElement[]).forEach(s => {
        s.pause();
        s.src = '';
      });
    };
  }, [playerConfig, bagConfig, isMuted]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={onExit}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bungee shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          LEAVE GYM
        </button>
      </div>
      <div className="absolute top-8 text-center pointer-events-none z-10">
        <h2 className="text-4xl font-bungee text-white opacity-50">TRAINING ROOM</h2>
      </div>
      <div className="p-4 bg-zinc-800 rounded-xl shadow-2xl border-8 border-zinc-700">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="bg-black cursor-none" />
      </div>
      <div className="mt-4 text-zinc-400 font-mono text-xs">
        PRACTICE YOUR COMBO TIMING ON THE BAG
      </div>
    </div>
  );
};

export default PracticeArena;
