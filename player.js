// Player Class - Advanced Movement Mechanics

class Player {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        
        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.acceleration = 1200;
        this.maxSpeed = 350;
        this.friction = 0.85;
        this.gravity = 1800;
        this.jumpPower = -550;
        
        // Advanced movement
        this.isGrounded = false;
        this.isOnWall = false;
        this.wallDirection = 0; // -1 left, 1 right
        this.jumpCount = 0;
        this.maxJumps = 2; // Double jump
        this.canWallJump = true;
        
        // Dash ability
        this.dashPower = 600;
        this.dashDuration = 150;
        this.dashCooldown = 0;
        this.dashCooldownMax = 500;
        this.isDashing = false;
        this.dashTime = 0;
        
        // Power-ups and special abilities
        this.powerUps = {
            speed: 0,
            jump: 0,
            dash: 0,
            shield: 0,
            doubleScore: 0
        };
        
        // Visual effects
        this.trail = [];
        this.maxTrailLength = 10;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.maxInvulnerabilityTime = 1000;
        
        // Animation
        this.direction = 1; // 1 right, -1 left
        this.animationFrame = 0;
        this.animationSpeed = 150;
        this.animationTimer = 0;
        this.currentAnimation = 'idle';
        
        // Respawn point
        this.respawnX = x;
        this.respawnY = y;
    }
    
    update(deltaTime) {
        this.handleInput();
        this.updatePhysics(deltaTime);
        this.updatePowerUps(deltaTime);
        this.updateVisualEffects(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateTrail();
    }
    
    handleInput() {
        const keys = this.game.keys;
        
        // Horizontal movement
        if (keys.left) {
            this.velocityX -= this.acceleration * (this.game.deltaTime / 1000);
            this.direction = -1;
        }
        if (keys.right) {
            this.velocityX += this.acceleration * (this.game.deltaTime / 1000);
            this.direction = 1;
        }
        
        // Jumping
        if (keys.jump && this.canJump()) {
            this.jump();
        }
        
        // Dashing
        if (keys.dash && this.canDash()) {
            this.startDash();
        }
        
        // Special ability
        if (keys.special) {
            this.useSpecialAbility();
        }
    }
    
    canJump() {
        return (this.isGrounded && this.jumpCount < this.maxJumps) || 
               (this.jumpCount < this.maxJumps && this.jumpCount > 0) ||
               (this.isOnWall && this.canWallJump);
    }
    
    jump() {
        if (this.isOnWall && this.canWallJump) {
            // Wall jump
            this.velocityY = this.jumpPower * 0.9;
            this.velocityX = -this.wallDirection * 400;
            this.isOnWall = false;
            this.game.createParticleExplosion(this.x, this.y + this.height, '#ffffff');
        } else {
            // Regular or double jump
            this.velocityY = this.jumpPower;
            this.jumpCount++;
            
            if (this.jumpCount > 1) {
                // Double jump effect
                this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height, '#00ffff');
            }
        }
        
        this.isGrounded = false;
        this.game.keys.jump = false; // Prevent continuous jumping
        this.game.addictiveFeatures.onPlayerJump();
    }
    
    canDash() {
        return this.dashCooldown <= 0 && !this.isDashing;
    }
    
    startDash() {
        this.isDashing = true;
        this.dashTime = this.dashDuration;
        this.dashCooldown = this.dashCooldownMax;
        
        // Set dash velocity
        const dashDirection = this.direction;
        this.velocityX = dashDirection * this.dashPower;
        this.velocityY = 0; // Cancel gravity during dash
        
        // Visual effects
        this.game.addScreenShake(3);
        this.game.createParticleExplosion(this.x, this.y + this.height/2, '#ff00ff');
        
        this.game.keys.dash = false;
        this.game.addictiveFeatures.onPlayerDash();
    }
    
    useSpecialAbility() {
        // Time slow effect
        if (this.powerUps.speed > 0) {
            this.game.gameSpeed = 0.5;
            setTimeout(() => this.game.gameSpeed = 1, 1000);
        }
        
        // Super jump
        if (this.powerUps.jump > 0) {
            this.velocityY = this.jumpPower * 1.5;
            this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height, '#ffff00');
        }
        
        this.game.keys.special = false;
    }
    
    updatePhysics(deltaTime) {
        const dt = deltaTime / 1000;
        
        // Update dash
        if (this.isDashing) {
            this.dashTime -= deltaTime;
            if (this.dashTime <= 0) {
                this.isDashing = false;
            }
        }
        
        // Update dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        
        // Apply gravity (except during dash)
        if (!this.isDashing) {
            this.velocityY += this.gravity * dt;
        }
        
        // Apply speed power-up
        const speedMultiplier = this.powerUps.speed > 0 ? 1.5 : 1;
        
        // Limit horizontal speed
        const maxSpeedCurrent = this.maxSpeed * speedMultiplier;
        this.velocityX = Math.max(-maxSpeedCurrent, Math.min(maxSpeedCurrent, this.velocityX));
        
        // Apply friction when not accelerating
        if (!this.game.keys.left && !this.game.keys.right && this.isGrounded) {
            this.velocityX *= this.friction;
        }
        
        // Update position
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        
        // Reset collision flags
        this.isGrounded = false;
        this.isOnWall = false;
    }
    
    updatePowerUps(deltaTime) {
        // Decrease power-up timers
        Object.keys(this.powerUps).forEach(powerUp => {
            if (this.powerUps[powerUp] > 0) {
                this.powerUps[powerUp] -= deltaTime;
                if (this.powerUps[powerUp] <= 0) {
                    this.powerUps[powerUp] = 0;
                }
            }
        });
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    updateVisualEffects(deltaTime) {
        // Update animation timer
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    updateAnimation(deltaTime) {
        // Determine current animation
        if (!this.isGrounded) {
            this.currentAnimation = this.velocityY < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.velocityX) > 50) {
            this.currentAnimation = 'run';
        } else {
            this.currentAnimation = 'idle';
        }
        
        if (this.isDashing) {
            this.currentAnimation = 'dash';
        }
    }
    
    updateTrail() {
        // Add current position to trail
        this.trail.push({ x: this.x + this.width/2, y: this.y + this.height/2 });
        
        // Limit trail length
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    checkCollision(object) {
        return this.x < object.x + object.width &&
               this.x + this.width > object.x &&
               this.y < object.y + object.height &&
               this.y + this.height > object.y;
    }
    
    handlePlatformCollision(platform) {
        // Calculate overlap
        const overlapX = Math.min(this.x + this.width - platform.x, platform.x + platform.width - this.x);
        const overlapY = Math.min(this.y + this.height - platform.y, platform.y + platform.height - this.y);
        
        // Determine collision side
        if (overlapX < overlapY) {
            // Horizontal collision (wall)
            if (this.x < platform.x) {
                this.x = platform.x - this.width;
                this.wallDirection = 1;
            } else {
                this.x = platform.x + platform.width;
                this.wallDirection = -1;
            }
            
            this.isOnWall = true;
            this.velocityX = 0;
            
            // Wall slide
            if (this.velocityY > 0) {
                this.velocityY = Math.min(this.velocityY, 150); // Slow fall speed
            }
        } else {
            // Vertical collision
            if (this.y < platform.y) {
                // Landing on top
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isGrounded = true;
                this.jumpCount = 0;
                
                // Platform-specific effects
                if (platform.type === 'jumpPad') {
                    this.velocityY = this.jumpPower * 1.5;
                    this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height, '#ffff00');
                    this.game.addScreenShake(5);
                }
            } else {
                // Hitting from below
                this.y = platform.y + platform.height;
                this.velocityY = 0;
                
                // Break breakable blocks
                if (platform.type === 'breakable') {
                    platform.break();
                    this.game.createParticleExplosion(platform.x + platform.width/2, platform.y + platform.height/2, '#8B4513');
                }
            }
        }
    }
    
    applyPowerUp(type) {
        const duration = 10000; // 10 seconds
        
        switch (type) {
            case 'speed':
                this.powerUps.speed = duration;
                break;
            case 'jump':
                this.powerUps.jump = duration;
                this.maxJumps = 3; // Triple jump
                setTimeout(() => this.maxJumps = 2, duration);
                break;
            case 'dash':
                this.powerUps.dash = duration;
                this.dashCooldownMax = 200; // Faster dash
                setTimeout(() => this.dashCooldownMax = 500, duration);
                break;
            case 'shield':
                this.powerUps.shield = duration;
                break;
            case 'doubleScore':
                this.powerUps.doubleScore = duration;
                break;
        }
        
        this.game.showAchievement(`${type.toUpperCase()} Power-Up!`);
    }
    
    takeDamage() {
        if (this.invulnerable || this.powerUps.shield > 0) {
            return;
        }
        
        this.invulnerable = true;
        this.invulnerabilityTime = this.maxInvulnerabilityTime;
        
        // Knockback
        this.velocityX = -this.direction * 200;
        this.velocityY = -300;
        
        this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height/2, '#ff0000');
        this.game.addictiveFeatures.onPlayerDamaged();
    }
    
    respawn() {
        this.x = this.respawnX;
        this.y = this.respawnY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.invulnerable = true;
        this.invulnerabilityTime = this.maxInvulnerabilityTime;
    }
    
    reset() {
        this.x = this.respawnX;
        this.y = this.respawnY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.jumpCount = 0;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.invulnerable = false;
        this.powerUps = {
            speed: 0,
            jump: 0,
            dash: 0,
            shield: 0,
            doubleScore: 0
        };
        this.trail = [];
    }
    
    render(ctx) {
        // Draw trail effect
        this.renderTrail(ctx);
        
        // Invulnerability flashing
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // Power-up glow effects
        if (this.powerUps.speed > 0) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
        } else if (this.powerUps.shield > 0) {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 15;
        }
        
        // Draw player
        this.renderPlayer(ctx);
        
        // Reset effects
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // Draw dash cooldown indicator
        if (this.dashCooldown > 0) {
            this.renderDashCooldown(ctx);
        }
    }
    
    renderTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.3;
            ctx.globalAlpha = alpha;
            
            const point = this.trail[i];
            ctx.fillStyle = this.isDashing ? '#ff00ff' : '#00ffff';
            ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
    }
    
    renderPlayer(ctx) {
        // Player body (animated based on current state)
        const colors = {
            idle: '#00ffff',
            run: '#00ffff',
            jump: '#ffffff',
            fall: '#aaaaaa',
            dash: '#ff00ff'
        };
        
        ctx.fillStyle = colors[this.currentAnimation] || '#00ffff';
        
        // Simple animated player rectangle with direction
        const offsetX = Math.sin(this.animationFrame * 0.5) * 2;
        const offsetY = this.currentAnimation === 'run' ? Math.sin(this.animationFrame) * 2 : 0;
        
        // Body
        ctx.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);
        
        // Eyes (direction indicators)
        ctx.fillStyle = '#ffffff';
        const eyeY = this.y + 8 + offsetY;
        if (this.direction === 1) {
            ctx.fillRect(this.x + this.width - 12 + offsetX, eyeY, 4, 4);
            ctx.fillRect(this.x + this.width - 6 + offsetX, eyeY, 4, 4);
        } else {
            ctx.fillRect(this.x + 4 + offsetX, eyeY, 4, 4);
            ctx.fillRect(this.x + 10 + offsetX, eyeY, 4, 4);
        }
        
        // Dash effect
        if (this.isDashing) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(this.x - 5 + offsetX, this.y + offsetY, this.width + 10, this.height);
        }
    }
    
    renderDashCooldown(ctx) {
        const progress = 1 - (this.dashCooldown / this.dashCooldownMax);
        const barWidth = this.width;
        const barHeight = 3;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x, this.y - 10, barWidth, barHeight);
        
        // Progress
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y - 10, barWidth * progress, barHeight);
    }
}