
export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'PRACTICE';

export interface PlayerConfig {
  name: string;
  faceUrl: string | null;
  color: string;
}

export type MoveType = 'IDLE' | 'PUNCH' | 'KICK' | 'HIT' | 'JUMP' | 'CHARGING' | 'KO';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface GameSettings {
  gravity: number;
  jumpForce: number;
  moveSpeed: number;
  punchDamage: number;
  kickDamage: number;
  maxHealth: number;
}
