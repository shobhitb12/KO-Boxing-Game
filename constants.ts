
import { GameSettings } from './types';

export const SETTINGS: GameSettings = {
  gravity: 0.8,
  jumpForce: -15,
  moveSpeed: 5,
  punchDamage: 5,
  kickDamage: 8,
  maxHealth: 100,
};

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 600;

export const P1_CONTROLS = {
  LEFT: 'q',
  RIGHT: 'e',
  JUMP: 'w',
  PUNCH: 's',
  KICK: 'd',
};

export const P2_CONTROLS = {
  LEFT: 'i',
  RIGHT: 'p',
  JUMP: 'o',
  PUNCH: 'j',
  KICK: 'k',
};
