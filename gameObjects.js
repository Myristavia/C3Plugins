// Game Objects - Platforms, Collectibles, Particles, and Background Elements

// Platform Class with various types and behaviors
class Platform {
    constructor(x, y, width, height, type = 'static') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.originalX = x;
        this.originalY = y;
        
        // Movement properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.moveRange = 100;
        this.moveSpeed = 50;
        this.moveDirection = 1;
        
        // Special properties
        this.health = type === 'breakable' ? 3 : Infinity;
        this.maxHealth = this.health;
        this.broken = false;
        this.bounceForce = type === 'jumpPad' ? 800 : 0;
        
        // Visual effects
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.flashTimer = 0;
        
        // Initialize type-specific properties
        this.initializeType();
    }
    
    initializeType() {
        switch (this.type) {
            case 'moving':
                this.velocityX = this.moveSpeed * (Math.random() > 0.5 ? 1 : -1);
                break;
            case 'verticalMoving':
                this.velocityY = this.moveSpeed * (Math.random() > 0.5 ? 1 : -1);
                break;
            case 'rotating':
                this.angle = 0;
                this.rotationSpeed = 0.02;
                break;
            case 'disappearing':
                this.disappearTimer = 0;
                this.maxDisappearTime = 2000;
                this.isVisible = true;
                break;
        }
    }
    
    update(deltaTime) {
        if (this.broken) return;
        
        this.updateMovement(deltaTime);
        this.updateSpecialBehavior(deltaTime);
        this.updateVisualEffects(deltaTime);
    }
    
    updateMovement(deltaTime) {
        const dt = deltaTime / 1000;
        
        switch (this.type) {
            case 'moving':
                this.x += this.velocityX * dt;
                if (Math.abs(this.x - this.originalX) > this.moveRange) {
                    this.velocityX *= -1;
                }
                break;
                
            case 'verticalMoving':
                this.y += this.velocityY * dt;
                if (Math.abs(this.y - this.originalY) > this.moveRange) {
                    this.velocityY *= -1;
                }
                break;
                
            case 'rotating':
                this.angle += this.rotationSpeed * deltaTime;
                break;
        }
    }
    
    updateSpecialBehavior(deltaTime) {
        switch (this.type) {
            case 'disappearing':
                if (this.disappearTimer > 0) {
                    this.disappearTimer -= deltaTime;
                    this.isVisible = Math.floor(this.disappearTimer / 100) % 2 === 0;
                    
                    if (this.disappearTimer <= 0) {
                        this.broken = true;
                    }
                }
                break;
        }
    }
    
    updateVisualEffects(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= 150) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }
    }
    
    onPlayerLand() {
        if (this.type === 'disappearing') {
            this.disappearTimer = this.maxDisappearTime;
        }
    }
    
    break() {
        if (this.type === 'breakable' && this.health > 0) {
            this.health--;
            this.flashTimer = 200;
            
            if (this.health <= 0) {
                this.broken = true;
            }
        }
    }
    
    render(ctx) {
        if (this.broken || (this.type === 'disappearing' && !this.isVisible)) {
            return;
        }
        
        ctx.save();
        
        // Apply rotation for rotating platforms
        if (this.type === 'rotating') {
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.angle);
            ctx.translate(-this.width/2, -this.height/2);
        } else {
            ctx.translate(this.x, this.y);
        }
        
        // Flash effect when damaged
        if (this.flashTimer > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // Render platform based on type
        this.renderByType(ctx);
        
        ctx.restore();
    }
    
    renderByType(ctx) {
        const colors = {
            static: '#666666',
            ground: '#444444',
            moving: '#4444ff',
            verticalMoving: '#44ff44',
            jumpPad: '#ffff44',
            breakable: '#ff8844',
            rotating: '#ff44ff',
            disappearing: '#8844ff'
        };
        
        const color = colors[this.type] || '#666666';
        
        // Main platform
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Type-specific visual details
        switch (this.type) {
            case 'jumpPad':
                // Spring visual
                ctx.fillStyle = '#ffff88';
                const springHeight = 5 + Math.sin(Date.now() * 0.01) * 2;
                ctx.fillRect(this.width/4, -springHeight, this.width/2, springHeight);
                break;
                
            case 'breakable':
                // Cracks based on damage
                ctx.strokeStyle = '#222222';
                ctx.lineWidth = 2;
                const damagePercent = 1 - (this.health / this.maxHealth);
                
                if (damagePercent > 0.3) {
                    ctx.beginPath();
                    ctx.moveTo(this.width * 0.2, 0);
                    ctx.lineTo(this.width * 0.8, this.height);
                    ctx.stroke();
                }
                
                if (damagePercent > 0.6) {
                    ctx.beginPath();
                    ctx.moveTo(this.width * 0.8, 0);
                    ctx.lineTo(this.width * 0.2, this.height);
                    ctx.stroke();
                }
                break;
                
            case 'moving':
                // Direction arrows
                ctx.fillStyle = '#8888ff';
                const arrowY = this.height/2 - 3;
                ctx.fillRect(this.width - 15, arrowY, 10, 6);
                ctx.fillRect(this.width - 8, arrowY + 2, 5, 2);
                break;
                
            case 'disappearing':
                // Transparency effect
                ctx.globalAlpha = this.disappearTimer > 0 ? 0.7 : 1;
                break;
        }
        
        // Platform highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, this.width, 3);
    }
}

// Crystal Collectible
class Crystal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 20;
        this.type = 'crystal';
        this.collected = false;
        
        // Animation
        this.rotation = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.sparkleTimer = 0;
        this.sparkles = [];
        
        // Value
        this.value = 50;
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        this.rotation += deltaTime * 0.003;
        this.y += Math.sin(Date.now() * 0.005 + this.bobOffset) * 0.2;
        
        // Create sparkles
        this.sparkleTimer += deltaTime;
        if (this.sparkleTimer >= 300) {
            this.createSparkle();
            this.sparkleTimer = 0;
        }
        
        // Update sparkles
        this.sparkles = this.sparkles.filter(sparkle => {
            sparkle.life -= deltaTime;
            sparkle.y -= sparkle.speed * deltaTime / 1000;
            sparkle.x += Math.sin(sparkle.life * 0.01) * 0.5;
            return sparkle.life > 0;
        });
    }
    
    createSparkle() {
        this.sparkles.push({
            x: this.x + Math.random() * this.width,
            y: this.y + Math.random() * this.height,
            life: 1000,
            speed: 20 + Math.random() * 30
        });
    }
    
    render(ctx) {
        if (this.collected) return;
        
        // Render sparkles
        ctx.fillStyle = '#ffffff';
        this.sparkles.forEach(sparkle => {
            const alpha = sparkle.life / 1000;
            ctx.globalAlpha = alpha;
            ctx.fillRect(sparkle.x, sparkle.y, 2, 2);
        });
        ctx.globalAlpha = 1;
        
        // Render crystal
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Crystal body
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Crystal facets
        ctx.fillStyle = '#88ffff';
        ctx.fillRect(-this.width/4, -this.height/2, this.width/2, this.height/3);
        ctx.fillRect(-this.width/2, -this.height/4, this.width, this.height/2);
        
        // Crystal glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -2, 4, 4);
        
        ctx.restore();
    }
}

// Power-up Collectible
class PowerUp {
    constructor(x, y, powerType) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.type = 'powerUp';
        this.powerType = powerType;
        this.collected = false;
        
        // Animation
        this.rotation = 0;
        this.pulseScale = 1;
        this.pulseDirection = 1;
        this.originalY = y;
        
        // Visual effects
        this.aura = [];
        this.auraTimer = 0;
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        this.rotation += deltaTime * 0.002;
        
        // Pulsing effect
        this.pulseScale += this.pulseDirection * deltaTime * 0.001;
        if (this.pulseScale > 1.2 || this.pulseScale < 0.8) {
            this.pulseDirection *= -1;
        }
        
        // Floating effect
        this.y = this.originalY + Math.sin(Date.now() * 0.003) * 10;
        
        // Create aura particles
        this.auraTimer += deltaTime;
        if (this.auraTimer >= 100) {
            this.createAuraParticle();
            this.auraTimer = 0;
        }
        
        // Update aura
        this.aura = this.aura.filter(particle => {
            particle.life -= deltaTime;
            particle.y -= particle.speed * deltaTime / 1000;
            particle.x += Math.sin(particle.life * 0.01) * 0.3;
            return particle.life > 0;
        });
    }
    
    createAuraParticle() {
        const color = this.getPowerColor();
        this.aura.push({
            x: this.x + this.width/2 + (Math.random() - 0.5) * this.width,
            y: this.y + this.height,
            life: 2000,
            speed: 30 + Math.random() * 20,
            color: color
        });
    }
    
    getPowerColor() {
        const colors = {
            speed: '#00ffff',
            jump: '#00ff00',
            dash: '#ff00ff',
            shield: '#ffff00',
            doubleScore: '#ff8800'
        };
        return colors[this.powerType] || '#ffffff';
    }
    
    render(ctx) {
        if (this.collected) return;
        
        // Render aura
        this.aura.forEach(particle => {
            const alpha = particle.life / 2000;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - 1, particle.y - 1, 3, 3);
        });
        ctx.globalAlpha = 1;
        
        // Render power-up
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        ctx.scale(this.pulseScale, this.pulseScale);
        
        const color = this.getPowerColor();
        
        // Outer glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        // Main shape based on power type
        ctx.fillStyle = color;
        switch (this.powerType) {
            case 'speed':
                // Lightning bolt
                ctx.fillRect(-8, -12, 4, 8);
                ctx.fillRect(-4, -4, 8, 4);
                ctx.fillRect(4, 4, 4, 8);
                break;
                
            case 'jump':
                // Up arrow
                ctx.fillRect(-2, -12, 4, 16);
                ctx.fillRect(-6, -8, 12, 4);
                break;
                
            case 'dash':
                // Double arrows
                ctx.fillRect(-8, -2, 6, 4);
                ctx.fillRect(2, -2, 6, 4);
                ctx.fillRect(-4, -6, 4, 4);
                ctx.fillRect(-4, 2, 4, 4);
                break;
                
            case 'shield':
                // Shield shape
                ctx.fillRect(-8, -8, 16, 12);
                ctx.fillRect(-6, 4, 12, 4);
                break;
                
            case 'doubleScore':
                // X2 text
                ctx.font = '12px Orbitron';
                ctx.textAlign = 'center';
                ctx.fillText('X2', 0, 4);
                break;
        }
        
        ctx.restore();
    }
}

// Particle System
class Particle {
    constructor(x, y, color, options = {}) {
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * (options.speed || 200);
        this.velocityY = (Math.random() - 0.5) * (options.speed || 200) - 100;
        this.life = options.life || 1000;
        this.maxLife = this.life;
        this.color = color;
        this.size = options.size || 2 + Math.random() * 4;
        this.gravity = options.gravity || 200;
        this.fade = options.fade !== false;
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000;
        
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        this.velocityY += this.gravity * dt;
        this.life -= deltaTime;
        
        // Shrink over time
        this.size *= 0.998;
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        const alpha = this.fade ? this.life / this.maxLife : 1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Background Elements for Parallax
class BackgroundElement {
    constructor(x, y, layer) {
        this.x = x;
        this.y = y;
        this.layer = layer; // 0 = farthest, 4 = closest
        this.width = 100 + Math.random() * 100;
        this.height = 50 + Math.random() * 100;
        this.type = this.getRandomType();
        this.color = this.getLayerColor();
        this.alpha = 0.3 - (layer * 0.05); // Farther layers are more transparent
    }
    
    getRandomType() {
        const types = ['mountain', 'cloud', 'building', 'tree', 'crystal'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getLayerColor() {
        const layerColors = [
            '#1a1a3e', // Farthest - dark purple
            '#2d1b69', // Far - purple
            '#44337a', // Mid - lighter purple
            '#5a4a8a', // Near - even lighter
            '#6b5b9d'  // Closest - lightest purple
        ];
        return layerColors[this.layer] || '#1a1a3e';
    }
    
    render(ctx, camera) {
        const parallaxFactor = 1 - (this.layer * 0.2);
        const renderX = this.x - camera.x * parallaxFactor;
        const renderY = this.y - camera.y * parallaxFactor;
        
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        switch (this.type) {
            case 'mountain':
                this.renderMountain(ctx, renderX, renderY);
                break;
            case 'cloud':
                this.renderCloud(ctx, renderX, renderY);
                break;
            case 'building':
                this.renderBuilding(ctx, renderX, renderY);
                break;
            case 'tree':
                this.renderTree(ctx, renderX, renderY);
                break;
            case 'crystal':
                this.renderCrystal(ctx, renderX, renderY);
                break;
        }
        
        ctx.globalAlpha = 1;
    }
    
    renderMountain(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x, y + this.height);
        ctx.lineTo(x + this.width/2, y);
        ctx.lineTo(x + this.width, y + this.height);
        ctx.closePath();
        ctx.fill();
    }
    
    renderCloud(ctx, x, y) {
        const segments = 5;
        for (let i = 0; i < segments; i++) {
            const segmentX = x + (i * this.width / segments);
            const segmentY = y + Math.sin(i) * 10;
            ctx.fillRect(segmentX, segmentY, this.width / segments + 5, this.height/2);
        }
    }
    
    renderBuilding(ctx, x, y) {
        ctx.fillRect(x, y, this.width, this.height);
        
        // Windows
        const windowSize = 8;
        const windowSpacing = 15;
        for (let wx = x + 10; wx < x + this.width - windowSize; wx += windowSpacing) {
            for (let wy = y + 10; wy < y + this.height - windowSize; wy += windowSpacing) {
                ctx.fillStyle = '#ffff88';
                ctx.fillRect(wx, wy, windowSize, windowSize);
            }
        }
    }
    
    renderTree(ctx, x, y) {
        // Trunk
        ctx.fillRect(x + this.width/2 - 5, y + this.height/2, 10, this.height/2);
        
        // Leaves
        ctx.fillRect(x + this.width/4, y, this.width/2, this.height/2);
    }
    
    renderCrystal(ctx, x, y) {
        ctx.save();
        ctx.translate(x + this.width/2, y + this.height/2);
        ctx.rotate(Date.now() * 0.001);
        
        // Crystal facets
        ctx.fillRect(-this.width/4, -this.height/4, this.width/2, this.height/2);
        ctx.fillStyle = this.color + '88'; // Semi-transparent
        ctx.fillRect(-this.width/3, -this.height/3, this.width/1.5, this.height/1.5);
        
        ctx.restore();
    }
}