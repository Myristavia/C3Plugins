// Enemy System - Diverse AI Behaviors

class Enemy {
    constructor(x, y, type, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        
        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 1200;
        this.maxSpeed = 150;
        
        // AI state
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.aiTimer = 0;
        this.aiInterval = 1000 + Math.random() * 2000;
        this.detectionRange = 200;
        this.attackRange = 50;
        this.isAggressive = false;
        
        // Health and damage
        this.health = this.getMaxHealth();
        this.maxHealth = this.health;
        this.damage = this.getDamage();
        
        // Visual effects
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 200;
        this.flashTimer = 0;
        
        // Type-specific properties
        this.initializeTypeSpecific();
        
        // Patrol points
        this.patrolStartX = x;
        this.patrolRange = 200;
        this.patrolDirection = this.direction;
    }
    
    getMaxHealth() {
        const healthMap = {
            walker: 1,
            jumper: 2,
            flyer: 1,
            spiker: 3,
            shooter: 2,
            heavy: 5
        };
        return healthMap[this.type] || 1;
    }
    
    getDamage() {
        const damageMap = {
            walker: 1,
            jumper: 1,
            flyer: 1,
            spiker: 2,
            shooter: 1,
            heavy: 3
        };
        return damageMap[this.type] || 1;
    }
    
    initializeTypeSpecific() {
        switch (this.type) {
            case 'walker':
                this.maxSpeed = 100;
                this.width = 25;
                this.height = 25;
                break;
                
            case 'jumper':
                this.maxSpeed = 120;
                this.jumpPower = -400;
                this.jumpCooldown = 0;
                this.jumpCooldownMax = 2000;
                this.width = 30;
                this.height = 30;
                break;
                
            case 'flyer':
                this.maxSpeed = 80;
                this.flyHeight = this.y - 100;
                this.hoverOffset = 0;
                this.width = 35;
                this.height = 20;
                break;
                
            case 'spiker':
                this.maxSpeed = 200;
                this.chargeRange = 300;
                this.chargeCooldown = 0;
                this.chargeCooldownMax = 3000;
                this.isCharging = false;
                this.width = 40;
                this.height = 25;
                break;
                
            case 'shooter':
                this.maxSpeed = 60;
                this.shootRange = 250;
                this.shootCooldown = 0;
                this.shootCooldownMax = 1500;
                this.projectiles = [];
                this.width = 35;
                this.height = 35;
                break;
                
            case 'heavy':
                this.maxSpeed = 50;
                this.stunDuration = 0;
                this.groundPoundCooldown = 0;
                this.groundPoundCooldownMax = 4000;
                this.width = 50;
                this.height = 50;
                break;
        }
    }
    
    update(deltaTime) {
        this.updateAI(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateTypeSpecific(deltaTime);
        this.updateVisualEffects(deltaTime);
        this.updateTimers(deltaTime);
    }
    
    updateAI(deltaTime) {
        const player = this.game.player;
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
        );
        
        // Check if player is in detection range
        this.isAggressive = distanceToPlayer < this.detectionRange;
        
        if (this.isAggressive) {
            this.aggressiveBehavior(player, distanceToPlayer);
        } else {
            this.patrolBehavior();
        }
        
        this.aiTimer += deltaTime;
        if (this.aiTimer >= this.aiInterval) {
            this.aiTimer = 0;
            this.makeDecision();
        }
    }
    
    aggressiveBehavior(player, distance) {
        // Move towards player
        if (player.x < this.x) {
            this.direction = -1;
        } else {
            this.direction = 1;
        }
        
        // Type-specific aggressive behavior
        switch (this.type) {
            case 'walker':
                this.velocityX = this.direction * this.maxSpeed;
                break;
                
            case 'jumper':
                this.velocityX = this.direction * this.maxSpeed;
                if (distance < 100 && this.jumpCooldown <= 0) {
                    this.jump();
                }
                break;
                
            case 'flyer':
                this.velocityX = this.direction * this.maxSpeed;
                // Dive attack
                if (distance < 80) {
                    this.velocityY = 200;
                }
                break;
                
            case 'spiker':
                if (distance < this.chargeRange && this.chargeCooldown <= 0) {
                    this.startCharge();
                }
                break;
                
            case 'shooter':
                if (distance < this.shootRange && this.shootCooldown <= 0) {
                    this.shoot(player);
                }
                this.velocityX = this.direction * this.maxSpeed * 0.5; // Move slower while aiming
                break;
                
            case 'heavy':
                this.velocityX = this.direction * this.maxSpeed;
                if (distance < 80 && this.groundPoundCooldown <= 0) {
                    this.groundPound();
                }
                break;
        }
    }
    
    patrolBehavior() {
        // Simple patrol movement
        const distanceFromStart = Math.abs(this.x - this.patrolStartX);
        
        if (distanceFromStart > this.patrolRange) {
            this.patrolDirection *= -1;
        }
        
        this.direction = this.patrolDirection;
        this.velocityX = this.direction * this.maxSpeed * 0.5;
    }
    
    makeDecision() {
        // Random behavior changes
        if (Math.random() < 0.3) {
            this.direction *= -1;
        }
        
        // Reset AI interval with some randomness
        this.aiInterval = 1000 + Math.random() * 2000;
    }
    
    updatePhysics(deltaTime) {
        const dt = deltaTime / 1000;
        
        // Apply gravity (except for flyers)
        if (this.type !== 'flyer') {
            this.velocityY += this.gravity * dt;
        }
        
        // Update position
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        
        // Basic collision with ground
        if (this.y > this.game.height - 64 - this.height) {
            this.y = this.game.height - 64 - this.height;
            this.velocityY = 0;
        }
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(this.x, 5000 - this.width));
    }
    
    updateTypeSpecific(deltaTime) {
        switch (this.type) {
            case 'flyer':
                this.updateFlyer(deltaTime);
                break;
            case 'spiker':
                this.updateSpiker(deltaTime);
                break;
            case 'shooter':
                this.updateShooter(deltaTime);
                break;
            case 'heavy':
                this.updateHeavy(deltaTime);
                break;
        }
    }
    
    updateFlyer(deltaTime) {
        // Hover behavior
        this.hoverOffset += deltaTime * 0.003;
        const targetY = this.flyHeight + Math.sin(this.hoverOffset) * 20;
        this.y += (targetY - this.y) * 0.05;
        
        // Reset gravity effect
        this.velocityY = 0;
    }
    
    updateSpiker(deltaTime) {
        if (this.isCharging) {
            this.velocityX = this.direction * this.maxSpeed * 2;
            
            // Stop charging after distance or collision
            if (Math.abs(this.velocityX * deltaTime / 1000) > 200) {
                this.isCharging = false;
                this.chargeCooldown = this.chargeCooldownMax;
            }
        }
    }
    
    updateShooter(deltaTime) {
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.x += projectile.velocityX * deltaTime / 1000;
            projectile.y += projectile.velocityY * deltaTime / 1000;
            projectile.life -= deltaTime;
            
            // Check collision with player
            if (this.game.player.checkCollision(projectile) && !this.game.player.invulnerable) {
                this.game.player.takeDamage();
                this.game.lives--;
                this.game.updateHUD();
                return false;
            }
            
            return projectile.life > 0 && 
                   projectile.x > -50 && projectile.x < 5050 &&
                   projectile.y > -50 && projectile.y < this.game.height + 50;
        });
    }
    
    updateHeavy(deltaTime) {
        if (this.stunDuration > 0) {
            this.stunDuration -= deltaTime;
            this.velocityX = 0;
        }
    }
    
    updateTimers(deltaTime) {
        if (this.jumpCooldown > 0) this.jumpCooldown -= deltaTime;
        if (this.chargeCooldown > 0) this.chargeCooldown -= deltaTime;
        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
        if (this.groundPoundCooldown > 0) this.groundPoundCooldown -= deltaTime;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }
    
    updateVisualEffects(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    // Special abilities
    jump() {
        this.velocityY = this.jumpPower;
        this.jumpCooldown = this.jumpCooldownMax;
        this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height, '#ff4444');
    }
    
    startCharge() {
        this.isCharging = true;
        this.game.addScreenShake(3);
        this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height/2, '#ff0000');
    }
    
    shoot(player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 300;
        
        this.projectiles.push({
            x: this.x + this.width/2,
            y: this.y + this.height/2,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            width: 8,
            height: 8,
            life: 3000
        });
        
        this.shootCooldown = this.shootCooldownMax;
        this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height/2, '#ffff00');
    }
    
    groundPound() {
        this.velocityY = 800;
        this.groundPoundCooldown = this.groundPoundCooldownMax;
        this.game.addScreenShake(8);
        
        // Create shockwave when hitting ground
        setTimeout(() => {
            if (this.y >= this.game.height - 64 - this.height - 5) {
                this.createShockwave();
            }
        }, 500);
    }
    
    createShockwave() {
        for (let i = 0; i < 20; i++) {
            this.game.particles.push(new ShockwaveParticle(
                this.x + this.width/2 + (i - 10) * 20,
                this.y + this.height
            ));
        }
        
        // Damage player if close
        const distance = Math.abs(this.game.player.x - this.x);
        if (distance < 150 && !this.game.player.invulnerable) {
            this.game.player.takeDamage();
            this.game.lives--;
            this.game.updateHUD();
        }
    }
    
    takeDamage(amount = 1) {
        this.health -= amount;
        this.flashTimer = 200;
        this.game.createParticleExplosion(this.x + this.width/2, this.y + this.height/2, '#ff0000');
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        // Remove from enemies array
        const index = this.game.enemies.indexOf(this);
        if (index > -1) {
            this.game.enemies.splice(index, 1);
        }
        
        // Create destruction effect
        for (let i = 0; i < 15; i++) {
            this.game.particles.push(new Particle(
                this.x + Math.random() * this.width,
                this.y + Math.random() * this.height,
                '#ff4444'
            ));
        }
        
        // Award points
        const points = this.getScoreValue();
        this.game.addScore(points);
    }
    
    getScoreValue() {
        const scoreMap = {
            walker: 100,
            jumper: 150,
            flyer: 200,
            spiker: 250,
            shooter: 300,
            heavy: 500
        };
        return scoreMap[this.type] || 100;
    }
    
    render(ctx) {
        // Flash effect when damaged
        if (this.flashTimer > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // Render based on type
        this.renderByType(ctx);
        
        // Render projectiles for shooter type
        if (this.type === 'shooter') {
            this.renderProjectiles(ctx);
        }
        
        // Render health bar
        this.renderHealthBar(ctx);
        
        ctx.globalAlpha = 1;
    }
    
    renderByType(ctx) {
        const colors = {
            walker: '#ff4444',
            jumper: '#44ff44',
            flyer: '#4444ff',
            spiker: '#ff8844',
            shooter: '#ff44ff',
            heavy: '#888888'
        };
        
        ctx.fillStyle = colors[this.type] || '#ff4444';
        
        // Animation offset
        const offsetX = Math.sin(this.animationFrame * 0.5) * 2;
        const offsetY = this.type === 'flyer' ? Math.sin(Date.now() * 0.005) * 3 : 0;
        
        // Main body
        ctx.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);
        
        // Type-specific visual features
        switch (this.type) {
            case 'walker':
                // Simple legs
                ctx.fillRect(this.x + 5, this.y + this.height, 5, 8);
                ctx.fillRect(this.x + this.width - 10, this.y + this.height, 5, 8);
                break;
                
            case 'jumper':
                // Spring-like legs
                ctx.fillStyle = '#88ff88';
                ctx.fillRect(this.x + this.width/2 - 3, this.y + this.height, 6, 12);
                break;
                
            case 'flyer':
                // Wings
                ctx.fillStyle = '#8888ff';
                const wingFlap = Math.sin(Date.now() * 0.02) * 5;
                ctx.fillRect(this.x - 5, this.y + 5 + wingFlap, 8, 10);
                ctx.fillRect(this.x + this.width - 3, this.y + 5 - wingFlap, 8, 10);
                break;
                
            case 'spiker':
                // Spikes
                ctx.fillStyle = '#ffaa44';
                for (let i = 0; i < 3; i++) {
                    const spikeX = this.x + (i + 1) * this.width / 4;
                    ctx.fillRect(spikeX - 2, this.y - 5, 4, 8);
                }
                break;
                
            case 'shooter':
                // Cannon
                ctx.fillStyle = '#aa44ff';
                const direction = this.direction > 0 ? this.width : 0;
                ctx.fillRect(this.x + direction, this.y + this.height/2 - 3, this.direction * 15, 6);
                break;
                
            case 'heavy':
                // Armor plating
                ctx.fillStyle = '#aaaaaa';
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
                break;
        }
        
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + this.width - 8, this.y + 5, 3, 3);
        ctx.fillRect(this.x + this.width - 8, this.y + 10, 3, 3);
    }
    
    renderProjectiles(ctx) {
        ctx.fillStyle = '#ffff44';
        this.projectiles.forEach(projectile => {
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
            
            // Trail effect
            ctx.globalAlpha = 0.3;
            ctx.fillRect(projectile.x - 5, projectile.y, 5, projectile.height);
            ctx.globalAlpha = 1;
        });
    }
    
    renderHealthBar(ctx) {
        if (this.health >= this.maxHealth) return;
        
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        // Background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
        
        // Health
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
    }
}

// Special particle for shockwave effect
class ShockwaveParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocityY = -50 - Math.random() * 100;
        this.life = 1000;
        this.maxLife = this.life;
        this.width = 4;
        this.height = 8;
    }
    
    update(deltaTime) {
        this.y += this.velocityY * deltaTime / 1000;
        this.life -= deltaTime;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1;
    }
}