// Quantum Runner - Particle System
class Particle {
    constructor(x, y, config = {}) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(
            config.vx || Utils.randomBetween(-2, 2),
            config.vy || Utils.randomBetween(-2, 2)
        );
        this.acceleration = new Vector2(config.ax || 0, config.ay || 0.1);
        
        this.life = config.life || 60;
        this.maxLife = this.life;
        this.size = config.size || 2;
        this.startSize = this.size;
        this.endSize = config.endSize !== undefined ? config.endSize : this.size;
        
        this.color = config.color || '#ffffff';
        this.startColor = this.color;
        this.endColor = config.endColor || this.color;
        
        this.alpha = config.alpha !== undefined ? config.alpha : 1;
        this.startAlpha = this.alpha;
        this.endAlpha = config.endAlpha !== undefined ? config.endAlpha : 0;
        
        this.rotation = config.rotation || 0;
        this.rotationSpeed = config.rotationSpeed || 0;
        
        this.bounce = config.bounce !== undefined ? config.bounce : 0;
        this.friction = config.friction !== undefined ? config.friction : 1;
        this.gravity = config.gravity !== undefined ? config.gravity : true;
        
        this.shape = config.shape || 'circle'; // circle, square, star, sparkle
        this.trail = config.trail || false;
        this.trailPoints = [];
        
        this.dead = false;
    }
    
    update(deltaTime) {
        if (this.dead) return;
        
        // Apply gravity
        if (this.gravity) {
            this.acceleration.y += 0.3;
        }
        
        // Update velocity
        this.velocity = this.velocity.add(this.acceleration.multiply(deltaTime));
        
        // Apply friction
        this.velocity = this.velocity.multiply(this.friction);
        
        // Update position
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Update life
        this.life--;
        
        // Interpolate properties based on life
        const t = 1 - (this.life / this.maxLife);
        this.size = Utils.lerp(this.startSize, this.endSize, t);
        this.alpha = Utils.lerp(this.startAlpha, this.endAlpha, t);
        
        // Update trail
        if (this.trail) {
            this.trailPoints.push({
                x: this.position.x,
                y: this.position.y,
                life: 10
            });
            
            this.trailPoints = this.trailPoints.filter(point => {
                point.life--;
                return point.life > 0;
            });
        }
        
        // Check if dead
        if (this.life <= 0) {
            this.dead = true;
        }
    }
    
    render(ctx, camera) {
        if (this.dead || this.alpha <= 0) return;
        
        ctx.save();
        
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        // Render trail first
        if (this.trail) {
            for (let i = 0; i < this.trailPoints.length; i++) {
                const point = this.trailPoints[i];
                const trailAlpha = (point.life / 10) * this.alpha * 0.5;
                
                ctx.save();
                ctx.globalAlpha = trailAlpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(point.x - camera.x, point.y - camera.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // Set alpha and color
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        
        // Apply rotation
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        // Render based on shape
        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'square':
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                break;
                
            case 'star':
                this.drawStar(ctx, 0, 0, 5, this.size, this.size * 0.5);
                ctx.fill();
                break;
                
            case 'sparkle':
                this.drawSparkle(ctx, 0, 0, this.size);
                break;
                
            case 'line':
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-this.size, 0);
                ctx.lineTo(this.size, 0);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
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
    }
    
    drawSparkle(ctx, x, y, size) {
        const lines = [
            [-size, 0, size, 0],
            [0, -size, 0, size],
            [-size*0.7, -size*0.7, size*0.7, size*0.7],
            [-size*0.7, size*0.7, size*0.7, -size*0.7]
        ];
        
        ctx.lineWidth = 2;
        for (const line of lines) {
            ctx.beginPath();
            ctx.moveTo(line[0], line[1]);
            ctx.lineTo(line[2], line[3]);
            ctx.stroke();
        }
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.emitters = [];
        this.maxParticles = 1000;
    }
    
    update(deltaTime) {
        // Update particles
        for (const particle of this.particles) {
            particle.update(deltaTime);
        }
        
        // Remove dead particles
        this.particles = this.particles.filter(p => !p.dead);
        
        // Update emitters
        for (const emitter of this.emitters) {
            emitter.update(deltaTime);
        }
        
        // Remove finished emitters
        this.emitters = this.emitters.filter(e => !e.finished);
        
        // Limit particle count
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, this.particles.length - this.maxParticles);
        }
    }
    
    render(ctx, camera) {
        for (const particle of this.particles) {
            particle.render(ctx, camera);
        }
    }
    
    addParticle(x, y, config) {
        const particle = new Particle(x, y, config);
        this.particles.push(particle);
        return particle;
    }
    
    addEmitter(emitter) {
        this.emitters.push(emitter);
        return emitter;
    }
    
    // Preset effects
    createExplosion(x, y, count = 20, color = '#ff6600') {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Utils.randomBetween(5, 15);
            
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Utils.randomInt(30, 60),
                size: Utils.randomBetween(2, 6),
                endSize: 0,
                color: color,
                endColor: '#ff0000',
                shape: 'circle',
                friction: 0.95
            });
        }
    }
    
    createSpark(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            this.addParticle(x, y, {
                vx: Utils.randomBetween(-8, 8),
                vy: Utils.randomBetween(-8, 8),
                life: Utils.randomInt(20, 40),
                size: Utils.randomBetween(1, 3),
                color: '#ffff00',
                endColor: '#ff8800',
                shape: 'sparkle',
                rotationSpeed: Utils.randomBetween(-0.2, 0.2),
                friction: 0.98
            });
        }
    }
    
    createTrail(x, y, color = '#00ffff') {
        this.addParticle(x, y, {
            vx: Utils.randomBetween(-1, 1),
            vy: Utils.randomBetween(-1, 1),
            life: 20,
            size: 4,
            endSize: 0,
            color: color,
            alpha: 0.8,
            endAlpha: 0,
            shape: 'circle',
            gravity: false
        });
    }
    
    createDashTrail(x, y) {
        for (let i = 0; i < 5; i++) {
            this.addParticle(x, y, {
                vx: Utils.randomBetween(-2, 2),
                vy: Utils.randomBetween(-2, 2),
                life: 15,
                size: Utils.randomBetween(2, 4),
                endSize: 0,
                color: '#ffff00',
                endColor: '#ff8800',
                alpha: 0.9,
                endAlpha: 0,
                shape: 'star',
                rotationSpeed: Utils.randomBetween(-0.3, 0.3),
                gravity: false
            });
        }
    }
    
    createLandingDust(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            this.addParticle(x + Utils.randomBetween(-10, 10), y, {
                vx: Utils.randomBetween(-3, 3),
                vy: Utils.randomBetween(-2, -6),
                life: Utils.randomInt(20, 40),
                size: Utils.randomBetween(1, 3),
                endSize: 0,
                color: '#888888',
                endColor: '#444444',
                shape: 'circle',
                friction: 0.9
            });
        }
    }
    
    createWallSlide(x, y) {
        this.addParticle(x, y, {
            vx: Utils.randomBetween(-3, 3),
            vy: Utils.randomBetween(0, 3),
            life: Utils.randomInt(15, 25),
            size: Utils.randomBetween(1, 2),
            color: '#ff8800',
            endColor: '#ff4400',
            shape: 'circle',
            friction: 0.95
        });
    }
    
    createPowerupCollect(x, y, color = '#00ff00') {
        // Ring of particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 20;
            
            this.addParticle(x, y, {
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 40,
                size: 3,
                endSize: 0,
                color: color,
                alpha: 1,
                endAlpha: 0,
                shape: 'star',
                rotationSpeed: 0.2,
                gravity: false
            });
        }
        
        // Center burst
        for (let i = 0; i < 8; i++) {
            this.addParticle(x, y, {
                vx: Utils.randomBetween(-5, 5),
                vy: Utils.randomBetween(-5, 5),
                life: 30,
                size: 4,
                endSize: 0,
                color: '#ffffff',
                shape: 'sparkle',
                gravity: false
            });
        }
    }
    
    createEnemyDeath(x, y) {
        // Main explosion
        this.createExplosion(x, y, 15, '#ff0040');
        
        // Sparks
        this.createSpark(x, y, 8);
        
        // Screen effect
        Utils.screenShake(6, 200);
    }
    
    createQuantumEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Utils.randomBetween(0, Math.PI * 2);
            const distance = Utils.randomBetween(0, 30);
            
            this.addParticle(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                {
                    vx: Utils.randomBetween(-2, 2),
                    vy: Utils.randomBetween(-2, 2),
                    life: 60,
                    size: Utils.randomBetween(2, 4),
                    color: '#ff00ff',
                    endColor: '#8800ff',
                    alpha: 0.8,
                    endAlpha: 0,
                    shape: 'circle',
                    rotationSpeed: Utils.randomBetween(-0.1, 0.1),
                    gravity: false
                }
            );
        }
    }
    
    clear() {
        this.particles = [];
        this.emitters = [];
    }
}

class ParticleEmitter {
    constructor(x, y, config = {}) {
        this.position = new Vector2(x, y);
        this.rate = config.rate || 5; // particles per second
        this.duration = config.duration || -1; // -1 for infinite
        this.particleConfig = config.particleConfig || {};
        
        this.timer = 0;
        this.emissionTimer = 0;
        this.finished = false;
        
        this.active = true;
    }
    
    update(deltaTime) {
        if (!this.active || this.finished) return;
        
        this.timer += deltaTime;
        this.emissionTimer += deltaTime;
        
        // Check if duration is over
        if (this.duration > 0 && this.timer >= this.duration * 60) {
            this.finished = true;
            return;
        }
        
        // Emit particles
        const emissionInterval = 60 / this.rate; // frames between emissions
        if (this.emissionTimer >= emissionInterval) {
            this.emit();
            this.emissionTimer = 0;
        }
    }
    
    emit() {
        if (window.particleSystem) {
            window.particleSystem.addParticle(
                this.position.x,
                this.position.y,
                this.particleConfig
            );
        }
    }
    
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
    
    stop() {
        this.finished = true;
    }
}