
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { PlayerConfig } from '../types';

export class PunchingBag {
  x: number;
  y: number;
  pivotX: number;
  pivotY: number = 0;
  width: number = 80;
  height: number = 180; // Match player height
  angle: number = 0;
  angleVelocity: number = 0;
  friction: number = 0.92; // Increased friction to stop swing faster (was 0.985)
  gravity: number = 0.08; // Increased gravity to pull back to center much harder (was 0.005)
  config: PlayerConfig;
  faceImage: HTMLImageElement | null = null;
  
  // Visual feedback state
  hitTimer: number = 0;
  jitterX: number = 0;

  constructor(config: PlayerConfig) {
    this.pivotX = CANVAS_WIDTH / 2 + 150;
    this.x = this.pivotX;
    this.y = 100;
    this.config = config;
    if (config.faceUrl) {
      this.faceImage = new Image();
      this.faceImage.src = config.faceUrl;
    }
  }

  update() {
    // Pendulum physics with much higher tension/gravity
    const force = -this.gravity * Math.sin(this.angle);
    this.angleVelocity += force;
    this.angleVelocity *= this.friction;
    this.angle += this.angleVelocity;

    // Update bottom position for hitbox
    const tetherLength = 530; 
    this.x = this.pivotX + Math.sin(this.angle) * tetherLength - this.width / 2;
    this.y = this.pivotY + Math.cos(this.angle) * tetherLength - this.height;

    // Handle hit feedback (jitter)
    if (this.hitTimer > 0) {
      this.hitTimer--;
      this.jitterX = (Math.random() - 0.5) * 6;
    } else {
      this.jitterX = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw Chain
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.pivotX, this.pivotY);
    ctx.lineTo(this.x + this.width / 2 + this.jitterX, this.y + 20);
    ctx.stroke();

    // Setup Bag Rotation and Jitter
    ctx.translate(this.x + this.width / 2 + this.jitterX, this.y + this.height / 2);
    ctx.rotate(-this.angle);
    
    // Slight squash deformation on hit
    if (this.hitTimer > 0) {
        ctx.scale(1.03, 0.97);
    }
    
    ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

    const drawX = this.x;
    const drawY = this.y;

    // Bag Body (Cylinder)
    const gradient = ctx.createLinearGradient(drawX, 0, drawX + this.width, 0);
    gradient.addColorStop(0, '#7c2d12');
    gradient.addColorStop(0.5, '#ea580c');
    gradient.addColorStop(1, '#7c2d12');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, this.width, this.height, 20);
    ctx.fill();

    // Straps
    ctx.fillStyle = '#222';
    ctx.fillRect(drawX, drawY + 20, this.width, 10);
    ctx.fillRect(drawX, drawY + this.height - 30, this.width, 10);

    // Face/Target
    const faceSize = 60;
    const faceX = drawX + (this.width - faceSize) / 2;
    const faceY = drawY + 40;

    if (this.faceImage && this.faceImage.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(faceX + faceSize / 2, faceY + faceSize / 2, faceSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.faceImage, faceX, faceY, faceSize, faceSize);
      ctx.restore();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(faceX + faceSize / 2, faceY + faceSize / 2, faceSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(faceX + faceSize / 2, faceY + faceSize / 2, faceSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hit Flash Overlay
    if (this.hitTimer > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.hitTimer / 15})`;
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, this.width, this.height, 20);
      ctx.fill();
    }

    // Name Label
    ctx.fillStyle = '#fff';
    ctx.font = '14px Bungee';
    ctx.textAlign = 'center';
    ctx.fillText(this.config.name.toUpperCase(), drawX + this.width / 2, drawY + this.height + 30);

    ctx.restore();
  }

  applyHit(force: number) {
    // Reduced velocity multiplier to make it "wiggle" rather than "swing"
    this.angleVelocity += force * 0.006; 
    // Trigger visual feedback
    this.hitTimer = 10;
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
