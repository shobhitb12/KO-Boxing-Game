
import React, { useRef, useEffect, useState } from 'react';
import { Player } from './Player';
import { CANVAS_WIDTH, CANVAS_HEIGHT, P1_CONTROLS, P2_CONTROLS, SETTINGS } from '../constants';
import { PlayerConfig, Particle } from '../types';

interface BoxingGameProps {
  p1Config: PlayerConfig;
  p2Config: PlayerConfig;
  isMuted: boolean;
  onGameOver: (winner: string) => void;
}

const BoxingGame: React.FC<BoxingGameProps> = ({ p1Config, p2Config, isMuted, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p1HP, setP1HP] = useState(100);
  const [p2HP, setP2HP] = useState(100);
  const playersRef = useRef<{ p1: Player; p2: Player } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const prevKeysRef = useRef<Set<string>>(new Set());
  const screenShakeRef = useRef(0);
  const isGameOverTriggered = useRef(false);
  
  // Audio Refs
  const sounds = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    // Initialize Sounds with interaction-friendly loading
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
      ko: createAudio('https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3', 0.6),
    };

    const playSound = (name: string, pitchShift: boolean = false) => {
      if (isMuted) return;
      
      const s = sounds.current[name];
      if (s) {
        // Clone for overlapping sounds if needed, or just reset
        s.currentTime = 0;
        if (pitchShift) {
            s.playbackRate = 0.8 + Math.random() * 0.4;
        } else {
            s.playbackRate = 1.0;
        }
        s.play().catch(e => console.warn("Audio playback blocked or failed:", e));
      }
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p1 = new Player(200, p1Config);
    const p2 = new Player(CANVAS_WIDTH - 260, p2Config);
    p1.facing = 1;
    p2.facing = -1;
    playersRef.current = { p1, p2 };

    let animationId: number;

    const spawnParticles = (x: number, y: number, color: string, count: number = 15) => {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1.0,
          color
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
      const { p1, p2 } = playersRef.current!;

      // 1. Handle Input (Charging Logic)
      const handleInput = (player: Player, controls: typeof P1_CONTROLS) => {
        if (player.state === 'KO') return;

        player.vx = 0;
        if (keysRef.current.has(controls.LEFT)) {
          player.vx = -SETTINGS.moveSpeed;
          player.facing = -1;
        }
        if (keysRef.current.has(controls.RIGHT)) {
          player.vx = SETTINGS.moveSpeed;
          player.facing = 1;
        }
        if (keysRef.current.has(controls.JUMP) && !prevKeysRef.current.has(controls.JUMP)) {
          if (player.jump()) playSound('jump');
        }

        // Handle PUNCH
        if (keysRef.current.has(controls.PUNCH)) {
          player.startCharging('PUNCH');
        } else if (prevKeysRef.current.has(controls.PUNCH)) {
          const atk = player.releaseAttack();
          if (atk) playSound('punch', atk.isCharged);
        }

        // Handle KICK
        if (keysRef.current.has(controls.KICK)) {
          player.startCharging('KICK');
        } else if (prevKeysRef.current.has(controls.KICK)) {
          const atk = player.releaseAttack();
          if (atk) playSound('kick', atk.isCharged);
        }
      };

      handleInput(p1, P1_CONTROLS);
      handleInput(p2, P2_CONTROLS);

      // Save keys for release detection
      prevKeysRef.current = new Set(keysRef.current);

      // 2. Physics & State
      p1.update();
      p2.update();

      const dist = Math.abs(p1.x - p2.x);
      if (dist < 50) {
        if (p1.x < p2.x) { p1.x -= 2; p2.x += 2; } 
        else { p1.x += 2; p2.x -= 2; }
      }

      // 3. Combat Logic
      const resolveHit = (attacker: Player, victim: Player, setVictimHP: Function) => {
        const atkHitbox = attacker.getAttackHitbox();
        const victimBody = victim.getHitbox();

        if (atkHitbox && checkCollision(atkHitbox, victimBody) && victim.state !== 'HIT' && victim.state !== 'KO') {
          const isCharged = attacker.lastAttackWasCharged;
          const baseDmg = attacker.state === 'PUNCH' ? SETTINGS.punchDamage : SETTINGS.kickDamage;
          const finalDmg = isCharged ? baseDmg * 2 : baseDmg;
          
          victim.takeDamage(finalDmg);
          setVictimHP(victim.health);
          
          // Sound selection and pitch variation
          if (isCharged) {
            playSound('hit_heavy', true);
            screenShakeRef.current = 20;
            spawnParticles(atkHitbox.x, atkHitbox.y, '#fff', 25);
          } else {
            playSound('hit_light', true);
            screenShakeRef.current = 8;
            spawnParticles(atkHitbox.x, atkHitbox.y, attacker.config.color, 12);
          }
        }
      };

      resolveHit(p1, p2, setP2HP);
      resolveHit(p2, p1, setP1HP);

      // 4. Drawing
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.save();
      if (screenShakeRef.current > 0) {
        ctx.translate((Math.random() - 0.5) * screenShakeRef.current, (Math.random() - 0.5) * screenShakeRef.current);
        screenShakeRef.current -= 1;
      }

      // Environment
      const floorGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 50, 0, CANVAS_HEIGHT);
      floorGrad.addColorStop(0, '#333'); floorGrad.addColorStop(1, '#111');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT - 150 - i * 40);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 150 - i * 40);
        ctx.stroke();
      }

      ctx.fillStyle = '#666';
      ctx.fillRect(0, CANVAS_HEIGHT - 300, 15, 250);
      ctx.fillRect(CANVAS_WIDTH - 15, CANVAS_HEIGHT - 300, 15, 250);

      p1.draw(ctx);
      p2.draw(ctx);

      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        if (p.life <= 0) particlesRef.current.splice(idx, 1);
      });
      ctx.globalAlpha = 1.0;
      ctx.restore();

      // Check for Game Over (with KO animation delay)
      if (!isGameOverTriggered.current) {
        if (p1.state === 'KO' && p1.stateTimer === 0) {
          isGameOverTriggered.current = true;
          playSound('ko');
          setTimeout(() => onGameOver(p2.config.name), 1000);
          return;
        }
        if (p2.state === 'KO' && p2.stateTimer === 0) {
          isGameOverTriggered.current = true;
          playSound('ko');
          setTimeout(() => onGameOver(p1Config.name), 1000);
          return;
        }
      }

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
      // Clean up audio objects
      // Fix: cast to HTMLAudioElement[] to avoid unknown property errors
      (Object.values(sounds.current) as HTMLAudioElement[]).forEach(s => {
        s.pause();
        s.src = '';
      });
    };
  }, [p1Config, p2Config, onGameOver, isMuted]);

  return (
    <div className="relative flex flex-col items-center">
      {/* HUD */}
      <div className="absolute top-8 w-full px-12 flex justify-between items-start pointer-events-none z-10">
        <div className="w-1/3">
          <div className="flex justify-between mb-1 font-bungee">
            <span className="text-red-500">{p1Config.name}</span>
            <span>{p1HP}%</span>
          </div>
          <div className="h-6 bg-zinc-800 border-2 border-red-500 rounded-full overflow-hidden shadow-lg">
            <div className="h-full bg-red-500 transition-all duration-300 ease-out" style={{ width: `${p1HP}%` }} />
          </div>
        </div>

        <div className="w-1/3 flex justify-end flex-col items-end">
          <div className="flex justify-between mb-1 font-bungee w-full">
            <span>{p2HP}%</span>
            <span className="text-blue-500">{p2Config.name}</span>
          </div>
          <div className="h-6 bg-zinc-800 border-2 border-blue-500 rounded-full overflow-hidden shadow-lg w-full">
            <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${p2HP}%` }} />
          </div>
        </div>
      </div>

      <div className="p-4 bg-zinc-800 rounded-xl shadow-2xl border-8 border-zinc-700">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="bg-black cursor-none" />
      </div>

      <div className="mt-6 flex space-x-12 font-mono text-zinc-400 text-sm bg-zinc-950/50 p-4 rounded-lg">
        <div className="flex flex-col items-center">
          <span className="text-red-500 font-bold mb-1">P1: {p1Config.name}</span>
          <span>W:Jump | Q/E:Move</span>
          <span className="text-white text-xs mt-1">HOLD S:Charge Punch | HOLD D:Charge Kick</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-blue-500 font-bold mb-1">P2: {p2Config.name}</span>
          <span>O:Jump | I/P:Move</span>
          <span className="text-white text-xs mt-1">HOLD J:Charge Punch | HOLD K:Charge Kick</span>
        </div>
      </div>
    </div>
  );
};

export default BoxingGame;
