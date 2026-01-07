
import { SETTINGS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { MoveType, PlayerConfig } from '../types';

export class Player {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number = 60;
  height: number = 180;
  health: number = SETTINGS.maxHealth;
  isJumping: boolean = false;
  state: MoveType = 'IDLE';
  stateTimer: number = 0;
  bobTimer: number = Math.random() * 100;
  facing: 1 | -1 = 1;
  config: PlayerConfig;
  faceImage: HTMLImageElement | null = null;

  // Charging mechanics
  chargePower: number = 0; // 0 to 100
  chargeType: 'PUNCH' | 'KICK' | null = null;
  lastAttackWasCharged: boolean = false;

  constructor(x: number, config: PlayerConfig) {
    this.x = x;
    this.y = CANVAS_HEIGHT - this.height - 50;
    this.config = config;
    if (config.faceUrl) {
      this.faceImage = new Image();
      this.faceImage.src = config.faceUrl;
    }
  }

  update() {
    // Gravity (except when KO and on ground)
    if (this.state !== 'KO' || this.y < CANVAS_HEIGHT - this.height - 50) {
      this.vy += SETTINGS.gravity;
      this.y += this.vy;
    }
    this.x += this.vx;

    this.bobTimer += 0.1;

    // Floor collision
    const floorY = CANVAS_HEIGHT - this.height - 50;
    if (this.y > floorY) {
      this.y = floorY;
      this.vy = 0;
      this.isJumping = false;
    }

    // Wall collision
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

    // Handle Charging
    if (this.state === 'CHARGING') {
      this.chargePower = Math.min(100, this.chargePower + 2);
    }

    // Reset state after animation
    if (this.stateTimer > 0) {
      this.stateTimer--;
      // If KO ends, we don't return to IDLE automatically - the game usually ends
    } else if (this.state !== 'IDLE' && this.state !== 'CHARGING' && this.state !== 'KO') {
        this.state = 'IDLE';
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const isIdle = this.state === 'IDLE' && this.vx === 0 && !this.isJumping;
    const bobOffset = isIdle ? Math.sin(this.bobTimer) * 4 : 0;
    
    let recoilX = 0;
    let tilt = 0;
    let jitterX = 0;

    if (this.state === 'HIT') {
      recoilX = -this.facing * (this.stateTimer * 2.5);
      jitterX = (Math.random() - 0.5) * 6;
      tilt = -this.facing * (this.stateTimer * 0.06);
    } else if (this.state === 'KO') {
      // Rotate 90 degrees to fall flat
      tilt = this.facing * Math.PI / 2 * Math.min(1, (60 - this.stateTimer) / 30);
    }
    
    ctx.translate(this.x + this.width / 2 + recoilX + jitterX, this.y + this.height);
    ctx.rotate(tilt);
    ctx.translate(-(this.x + this.width / 2), -(this.y + this.height));

    const drawX = this.x;
    const drawY = this.y + bobOffset;

    // Charging Glow
    if (this.state === 'CHARGING' && this.chargePower > 20) {
      ctx.shadowBlur = this.chargePower / 4;
      ctx.shadowColor = this.chargePower === 100 ? '#fff' : this.config.color;
    }

    // Body
    ctx.fillStyle = this.config.color;
    const torsoScaleY = isIdle ? 1 + Math.sin(this.bobTimer) * 0.02 : 1;
    ctx.fillRect(drawX + 10, drawY + 60, 40, 60 * torsoScaleY);
    
    // Legs
    const legY = this.y;
    ctx.fillRect(drawX + 10, legY + 120, 15, 60);
    ctx.fillRect(drawX + 35, legY + 120, 15, 60);

    // Arms
    ctx.fillStyle = this.config.color;
    if (this.state === 'PUNCH') {
      const pScale = this.lastAttackWasCharged ? 1.5 : 1;
      const punchX = this.facing === 1 ? drawX + 50 : drawX - 30 * pScale;
      ctx.fillRect(punchX, drawY + 70, 40 * pScale, 15);
    } else if (this.state === 'KICK') {
      const kScale = this.lastAttackWasCharged ? 1.5 : 1;
      const kickX = this.facing === 1 ? drawX + 50 : drawX - 30 * kScale;
      ctx.fillRect(kickX, drawY + 130, 45 * kScale, 20);
    } else if (this.state === 'CHARGING') {
      // Wind up pose
      const windUp = (this.chargePower / 100) * 20;
      if (this.chargeType === 'PUNCH') {
        ctx.fillRect(drawX - windUp * this.facing, drawY + 70, 20, 15);
      } else {
        ctx.fillRect(drawX - windUp * this.facing, drawY + 130, 20, 20);
      }
    } else if (this.state === 'HIT' || this.state === 'KO') {
      ctx.fillRect(drawX - 15 * this.facing, drawY + 80, 20, 30);
      ctx.fillRect(drawX + 45 * this.facing, drawY + 85, 20, 30);
    } else {
      const armBob = Math.sin(this.bobTimer + 0.5) * 2;
      ctx.fillRect(drawX - 5, drawY + 70 + armBob, 15, 40);
      ctx.fillRect(drawX + 50, drawY + 70 + armBob, 15, 40);
    }

    // Head
    const headX = drawX + 5;
    const headY = drawY + (this.state === 'HIT' ? 10 : -2);
    const headSize = 50;

    if (this.faceImage && this.faceImage.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(headX + 25, headY + 25, 25, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.faceImage, headX, headY, headSize, headSize);
      ctx.restore();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(headX, headY, headSize, headSize);
    } else {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(headX, headY, headSize, headSize);
    }

    if (this.state === 'HIT') {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.stateTimer / 12})`;
      ctx.fillRect(drawX, drawY, this.width, this.height);
    }

    ctx.restore();
  }

  startCharging(type: 'PUNCH' | 'KICK') {
    if (this.state === 'IDLE' || (this.state === 'CHARGING' && this.chargeType === type)) {
      this.state = 'CHARGING';
      this.chargeType = type;
    }
  }

  releaseAttack() {
    if (this.state !== 'CHARGING') return null;
    
    const type = this.chargeType;
    const isCharged = this.chargePower >= 80;
    this.lastAttackWasCharged = isCharged;
    this.state = type as MoveType;
    this.stateTimer = type === 'PUNCH' ? 12 : 18;
    
    const power = this.chargePower;
    this.chargePower = 0;
    this.chargeType = null;
    
    return { type, isCharged, power };
  }

  jump() {
    if (!this.isJumping && this.state !== 'KO') {
      this.vy = SETTINGS.jumpForce;
      this.isJumping = true;
      return true;
    }
    return false;
  }

  takeDamage(amount: number) {
    if (this.state === 'KO') return;
    this.health = Math.max(0, this.health - amount);
    this.chargePower = 0;
    this.chargeType = null;
    
    if (this.health <= 0) {
      this.state = 'KO';
      this.stateTimer = 60; // 1 second of falling animation
    } else {
      this.state = 'HIT';
      this.stateTimer = 12;
    }
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  getAttackHitbox() {
    if (this.state === 'PUNCH') {
      const scale = this.lastAttackWasCharged ? 1.5 : 1;
      return {
        x: this.facing === 1 ? this.x + 50 : this.x - 30 * scale,
        y: this.y + 70,
        width: 40 * scale,
        height: 15 * scale
      };
    }
    if (this.state === 'KICK') {
      const scale = this.lastAttackWasCharged ? 1.5 : 1;
      return {
        x: this.facing === 1 ? this.x + 50 : this.x - 30 * scale,
        y: this.y + 130,
        width: 45 * scale,
        height: 20 * scale
      };
    }
    return null;
  }
}
