// Quantum Runner - Game Entities
class Powerup extends PhysicsBody {
    constructor(x, y, type = 'energy') {
        super(x, y, 16, 16);
        
        this.type = type;
        this.bobOffset = 0;
        this.bobSpeed = 0.05;
        this.collectRadius = 20;
        this.magnetRadius = 60;
        this.collected = false;
        this.animationTimer = 0;
        this.sparkleTimer = 0;
        
        // Visual properties
        this.glowIntensity = 1;
        this.rotationSpeed = 0.02;
        this.rotation = 0;
        
        this.setupPowerupType();
        this.setupPhysics();
    }
    
    setupPowerupType() {
        switch (this.type) {
            case 'energy':
                this.color = '#00ffff';
                this.value = 30;
                this.description = 'Quantum Energy';
                break;
                
            case 'life':
                this.color = '#ff0040';
                this.value = 1;
                this.description = 'Extra Life';
                break;
                
            case 'speedBoost':
                this.color = '#ffff00';
                this.value = 2;
                this.description = 'Speed Boost';
                break;
                
            case 'shield':
                this.color = '#40ff40';
                this.value = 30;
                this.description = 'Energy Shield';
                break;
                
            case 'timeExtender':
                this.color = '#ff8040';
                this.value = 10;
                this.description = 'Time Extend';
                break;
                
            case 'combo':
                this.color = '#ff40ff';
                this.value = 5;
                this.description = 'Combo Multiplier';
                break;
        }
    }
    
    setupPhysics() {
        this.isStatic = true;
        this.isTrigger = true;
        this.gravity = 0;
        
        this.onTriggerEnter = (other) => {
            if (other.type === 'player' && !this.collected) {
                this.collect(other);
            }
        };
    }
    
    update(deltaTime, player) {
        if (this.collected) return;
        
        // Bob animation
        this.bobOffset += this.bobSpeed * deltaTime;
        this.position.y += Math.sin(this.bobOffset) * 0.5;
        
        // Rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Animation timer
        this.animationTimer += deltaTime;
        this.sparkleTimer += deltaTime;
        
        // Pulsing glow
        this.glowIntensity = 0.5 + Math.sin(this.animationTimer * 0.1) * 0.5;
        
        // Check for player proximity for magnetic effect
        if (player) {
            const distance = this.position.distance(player.position);
            
            if (distance <= this.magnetRadius && distance > this.collectRadius) {
                // Magnetic attraction
                const direction = player.position.subtract(this.position).normalize();
                const attractionStrength = 1 - (distance / this.magnetRadius);
                this.position = this.position.add(direction.multiply(attractionStrength * 2));
            }
            
            if (distance <= this.collectRadius) {
                this.collect(player);
            }
        }
        
        // Add sparkle particles
        if (this.sparkleTimer >= 30) {
            this.sparkleTimer = 0;
            this.addSparkleParticle();
        }
    }
    
    collect(player) {
        if (this.collected) return;
        
        this.collected = true;
        
        // Apply powerup effect
        this.applyEffect(player);
        
        // Visual effects
        this.createCollectionEffect();
        
        // Audio feedback
        if (window.audioManager) {
            window.audioManager.playSpatialSound('collect', this.position.x, this.position.y);
        }
        
        // Screen effect
        Utils.screenShake(2, 100);
        
        // Remove from world
        this.markForDestroy = true;
    }
    
    applyEffect(player) {
        switch (this.type) {
            case 'energy':
                player.quantumEnergy = Math.min(player.maxQuantumEnergy, 
                    player.quantumEnergy + this.value);
                break;
                
            case 'life':
                player.lives = Math.min(player.maxLives, player.lives + this.value);
                break;
                
            case 'speedBoost':
                player.maxSpeed += this.value;
                // Temporary effect - could add timer here
                break;
                
            case 'shield':
                // Add shield power - could implement shield system
                player.quantumEnergy = Math.min(player.maxQuantumEnergy, 
                    player.quantumEnergy + this.value);
                break;
                
            case 'timeExtender':
                if (window.gameState) {
                    window.gameState.timeRemaining += this.value * 1000; // Add seconds
                }
                break;
                
            case 'combo':
                player.addCombo(this.value);
                break;
        }
        
        // Add to score
        if (window.gameState) {
            const scoreValue = this.type === 'life' ? 1000 : 
                             this.type === 'combo' ? 500 : 200;
            window.gameState.score += scoreValue;
        }
    }
    
    createCollectionEffect() {
        if (window.particleSystem) {
            window.particleSystem.createPowerupCollect(
                this.position.x + this.width / 2,
                this.position.y + this.height / 2,
                this.color
            );
        }
    }
    
    addSparkleParticle() {
        if (window.particleSystem) {
            const offsetX = Utils.randomBetween(-10, 10);
            const offsetY = Utils.randomBetween(-10, 10);
            
            window.particleSystem.addParticle(
                this.position.x + this.width / 2 + offsetX,
                this.position.y + this.height / 2 + offsetY,
                {
                    vx: Utils.randomBetween(-1, 1),
                    vy: Utils.randomBetween(-1, 1),
                    life: 20,
                    size: 2,
                    endSize: 0,
                    color: this.color,
                    alpha: 0.8,
                    endAlpha: 0,
                    shape: 'sparkle',
                    gravity: false
                }
            );
        }
    }
    
    render(ctx, camera) {
        if (this.collected) return;
        
        ctx.save();
        
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        // Skip if off-screen
        if (screenX < -50 || screenX > ctx.canvas.width + 50) {
            ctx.restore();
            return;
        }
        
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Glow effect
        Utils.drawGlow(ctx, 0, 0, 30, this.color, this.glowIntensity);
        
        // Main powerup shape
        ctx.fillStyle = this.color;
        
        switch (this.type) {
            case 'energy':
                // Diamond shape
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(8, 0);
                ctx.lineTo(0, 8);
                ctx.lineTo(-8, 0);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'life':
                // Heart shape
                this.drawHeart(ctx, 0, 0, 8);
                break;
                
            case 'speedBoost':
                // Lightning bolt
                this.drawLightning(ctx, 0, 0, 8);
                break;
                
            case 'shield':
                // Shield shape
                this.drawShield(ctx, 0, 0, 8);
                break;
                
            case 'timeExtender':
                // Clock shape
                this.drawClock(ctx, 0, 0, 8);
                break;
                
            case 'combo':
                // Star shape
                this.drawStar(ctx, 0, 0, 5, 8, 4);
                break;
                
            default:
                // Default circle
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size/2);
        ctx.bezierCurveTo(x, y, x - size/2, y - size/2, x - size/2, y);
        ctx.bezierCurveTo(x - size/2, y - size/2, x, y - size/2, x, y);
        ctx.bezierCurveTo(x, y - size/2, x + size/2, y - size/2, x + size/2, y);
        ctx.bezierCurveTo(x + size/2, y - size/2, x, y, x, y + size/2);
        ctx.fill();
    }
    
    drawLightning(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x - size/3, y - size);
        ctx.lineTo(x + size/3, y - size/2);
        ctx.lineTo(x - size/6, y - size/2);
        ctx.lineTo(x + size/3, y + size);
        ctx.lineTo(x - size/3, y + size/2);
        ctx.lineTo(x + size/6, y + size/2);
        ctx.closePath();
        ctx.fill();
    }
    
    drawShield(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.7, y - size * 0.3);
        ctx.lineTo(x + size * 0.7, y + size * 0.3);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.7, y + size * 0.3);
        ctx.lineTo(x - size * 0.7, y - size * 0.3);
        ctx.closePath();
        ctx.fill();
    }
    
    drawClock(ctx, x, y, size) {
        // Clock face
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Clock hands
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - size * 0.6);
        ctx.moveTo(x, y);
        ctx.lineTo(x + size * 0.4, y);
        ctx.stroke();
    }
    
    drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            const xOuter = x + Math.cos(rot) * outerRadius;
            const yOuter = y + Math.sin(rot) * outerRadius;
            ctx.lineTo(xOuter, yOuter);
            rot += step;
            
            const xInner = x + Math.cos(rot) * innerRadius;
            const yInner = y + Math.sin(rot) * innerRadius;
            ctx.lineTo(xInner, yInner);
            rot += step;
        }
        
        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

class Checkpoint extends PhysicsBody {
    constructor(x, y) {
        super(x, y, 32, 64);
        
        this.activated = false;
        this.animationTimer = 0;
        this.pulseTimer = 0;
        this.glowIntensity = 0.5;
        
        this.setupPhysics();
    }
    
    setupPhysics() {
        this.isStatic = true;
        this.isTrigger = true;
        this.gravity = 0;
        
        this.onTriggerEnter = (other) => {
            if (other.type === 'player' && !this.activated) {
                this.activate(other);
            }
        };
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        this.pulseTimer += deltaTime;
        
        if (this.activated) {
            this.glowIntensity = 0.8 + Math.sin(this.animationTimer * 0.1) * 0.3;
            
            // Add particles periodically
            if (this.pulseTimer >= 60) {
                this.pulseTimer = 0;
                this.addActivationParticles();
            }
        } else {
            this.glowIntensity = 0.3 + Math.sin(this.animationTimer * 0.05) * 0.2;
        }
    }
    
    activate(player) {
        if (this.activated) return;
        
        this.activated = true;
        
        // Save checkpoint data
        if (window.gameState) {
            window.gameState.lastCheckpoint = {
                x: this.position.x,
                y: this.position.y,
                level: window.gameState.currentLevel
            };
        }
        
        // Visual effects
        this.createActivationEffect();
        
        // Audio feedback
        if (window.audioManager) {
            window.audioManager.playSpatialSound('checkpoint', this.position.x, this.position.y);
        }
        
        // Screen effect
        Utils.screenShake(3, 150);
        
        // Score bonus
        if (window.gameState) {
            window.gameState.score += 500;
        }
    }
    
    createActivationEffect() {
        if (window.particleSystem) {
            // Upward stream of particles
            for (let i = 0; i < 20; i++) {
                window.particleSystem.addParticle(
                    this.position.x + this.width / 2 + Utils.randomBetween(-5, 5),
                    this.position.y + this.height,
                    {
                        vx: Utils.randomBetween(-1, 1),
                        vy: Utils.randomBetween(-5, -2),
                        life: Utils.randomInt(60, 120),
                        size: Utils.randomBetween(2, 4),
                        endSize: 0,
                        color: '#00ff40',
                        alpha: 1,
                        endAlpha: 0,
                        shape: 'star',
                        rotationSpeed: Utils.randomBetween(-0.1, 0.1),
                        gravity: false
                    }
                );
            }
        }
    }
    
    addActivationParticles() {
        if (window.particleSystem) {
            // Gentle ambient particles
            for (let i = 0; i < 3; i++) {
                window.particleSystem.addParticle(
                    this.position.x + this.width / 2 + Utils.randomBetween(-10, 10),
                    this.position.y + Utils.randomBetween(0, this.height),
                    {
                        vx: Utils.randomBetween(-1, 1),
                        vy: Utils.randomBetween(-2, 0),
                        life: 40,
                        size: 2,
                        endSize: 0,
                        color: '#00ff40',
                        alpha: 0.6,
                        endAlpha: 0,
                        shape: 'circle',
                        gravity: false
                    }
                );
            }
        }
    }
    
    render(ctx, camera) {
        ctx.save();
        
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        // Skip if off-screen
        if (screenX < -50 || screenX > ctx.canvas.width + 50) {
            ctx.restore();
            return;
        }
        
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;
        
        // Glow effect
        const glowColor = this.activated ? '#00ff40' : '#004400';
        Utils.drawGlow(ctx, centerX, centerY, 40, glowColor, this.glowIntensity);
        
        // Main checkpoint pillar
        ctx.fillStyle = this.activated ? '#00ff40' : '#004400';
        ctx.fillRect(screenX + 8, screenY, 16, this.height);
        
        // Top crystal
        ctx.fillStyle = this.activated ? '#40ff80' : '#008800';
        ctx.fillRect(screenX + 4, screenY, 24, 16);
        
        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 8, screenY, 16, this.height);
        ctx.strokeRect(screenX + 4, screenY, 24, 16);
        
        // Activation indicator
        if (this.activated) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX + 12, screenY + 4, 8, 8);
        }
        
        ctx.restore();
    }
}

class LevelExit extends PhysicsBody {
    constructor(x, y) {
        super(x, y, 48, 96);
        
        this.animationTimer = 0;
        this.portalRotation = 0;
        this.energyPulse = 0;
        this.particleTimer = 0;
        
        this.setupPhysics();
    }
    
    setupPhysics() {
        this.isStatic = true;
        this.isTrigger = true;
        this.gravity = 0;
        
        this.onTriggerEnter = (other) => {
            if (other.type === 'player') {
                this.completeLevel(other);
            }
        };
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        this.portalRotation += 0.02 * deltaTime;
        this.energyPulse += 0.08 * deltaTime;
        this.particleTimer += deltaTime;
        
        // Add portal particles
        if (this.particleTimer >= 5) {
            this.particleTimer = 0;
            this.addPortalParticle();
        }
    }
    
    completeLevel(player) {
        // Level completion logic
        if (window.gameState) {
            window.gameState.levelComplete = true;
            window.gameState.nextLevel = true;
            
            // Time bonus
            const timeBonus = Math.max(0, Math.floor(window.gameState.timeRemaining / 1000) * 10);
            window.gameState.score += timeBonus;
            
            // Completion bonus
            window.gameState.score += 1000;
        }
        
        // Visual effects
        this.createCompletionEffect();
        
        // Audio feedback
        if (window.audioManager) {
            window.audioManager.playSpatialSound('levelComplete', this.position.x, this.position.y);
        }
        
        // Major screen effect
        Utils.screenShake(5, 300);
    }
    
    createCompletionEffect() {
        if (window.particleSystem) {
            // Explosion of victory particles
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2;
                const speed = Utils.randomBetween(8, 15);
                
                window.particleSystem.addParticle(
                    this.position.x + this.width / 2,
                    this.position.y + this.height / 2,
                    {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: Utils.randomInt(60, 120),
                        size: Utils.randomBetween(3, 6),
                        endSize: 0,
                        color: i % 3 === 0 ? '#ffff00' : i % 3 === 1 ? '#ff00ff' : '#00ffff',
                        alpha: 1,
                        endAlpha: 0,
                        shape: 'star',
                        rotationSpeed: Utils.randomBetween(-0.2, 0.2),
                        friction: 0.95
                    }
                );
            }
        }
    }
    
    addPortalParticle() {
        if (window.particleSystem) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Utils.randomBetween(20, 40);
            const startX = this.position.x + this.width / 2 + Math.cos(angle) * radius;
            const startY = this.position.y + this.height / 2 + Math.sin(angle) * radius;
            
            const direction = new Vector2(
                this.position.x + this.width / 2 - startX,
                this.position.y + this.height / 2 - startY
            ).normalize();
            
            window.particleSystem.addParticle(startX, startY, {
                vx: direction.x * 3,
                vy: direction.y * 3,
                life: 40,
                size: 3,
                endSize: 0,
                color: '#ff00ff',
                alpha: 0.8,
                endAlpha: 0,
                shape: 'circle',
                gravity: false
            });
        }
    }
    
    render(ctx, camera) {
        ctx.save();
        
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        // Skip if off-screen
        if (screenX < -100 || screenX > ctx.canvas.width + 100) {
            ctx.restore();
            return;
        }
        
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;
        
        // Portal energy field
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.portalRotation);
        
        // Outer energy ring
        const pulseSize = 40 + Math.sin(this.energyPulse) * 10;
        Utils.drawGlow(ctx, 0, 0, pulseSize, '#ff00ff', 0.8);
        
        // Inner portal
        ctx.fillStyle = '#ff00ff';
        ctx.globalAlpha = 0.3 + Math.sin(this.energyPulse * 2) * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal rings
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 15 + i * 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.restore();
        
        // Portal frame
        ctx.strokeStyle = '#4400ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(screenX, screenY, this.width, this.height);
        
        ctx.restore();
    }
}