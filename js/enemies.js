// Quantum Runner - Enemy AI System
class Enemy extends PhysicsBody {
    constructor(x, y, width, height, type = 'basic') {
        super(x, y, width, height);
        
        this.type = type;
        this.health = 1;
        this.maxHealth = 1;
        this.speed = 2;
        this.detectionRange = 150;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.attackDuration = 60; // frames
        
        // AI State
        this.state = 'patrol'; // patrol, chase, attack, stunned, dead
        this.target = null;
        this.lastKnownPlayerPos = null;
        this.stateTimer = 0;
        this.alertLevel = 0; // 0-100, affects behavior intensity
        
        // Movement AI
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.patrolDirection = 1;
        this.jumpTimer = 0;
        this.pathfinding = [];
        
        // Combat
        this.damage = 1;
        this.knockback = 5;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        
        // Visual
        this.facing = 1;
        this.animationState = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.flashTimer = 0;
        
        // Particles and effects
        this.deathParticles = [];
        this.attackParticles = [];
        
        this.setupEnemyType();
        this.setupPhysics();
    }
    
    setupEnemyType() {
        switch (this.type) {
            case 'basic':
                this.health = 1;
                this.speed = 2;
                this.detectionRange = 120;
                break;
                
            case 'fast':
                this.health = 1;
                this.speed = 4;
                this.detectionRange = 100;
                break;
                
            case 'heavy':
                this.health = 3;
                this.speed = 1;
                this.detectionRange = 80;
                this.attackRange = 60;
                this.damage = 2;
                break;
                
            case 'jumper':
                this.health = 2;
                this.speed = 3;
                this.detectionRange = 140;
                this.jumpPower = 12;
                break;
                
            case 'ranged':
                this.health = 2;
                this.speed = 1.5;
                this.detectionRange = 200;
                this.attackRange = 150;
                this.projectiles = [];
                break;
                
            case 'phase':
                this.health = 2;
                this.speed = 2.5;
                this.detectionRange = 100;
                this.canPhase = true;
                this.phaseTimer = 0;
                this.phaseCooldown = 0;
                break;
        }
        
        this.maxHealth = this.health;
    }
    
    setupPhysics() {
        this.friction = 0.8;
        this.mass = 1;
        this.maxVelocity = new Vector2(this.speed * 2, 20);
        this.isTrigger = false;
        
        // Collision callbacks
        this.onTriggerEnter = (other) => {
            if (other.type === 'player' && this.state === 'attack') {
                other.takeDamage(this);
            }
        };
    }
    
    update(deltaTime, player, physicsWorld) {
        // Update timers
        this.updateTimers(deltaTime);
        
        // Update AI state machine
        this.updateAI(player, physicsWorld, deltaTime);
        
        // Update type-specific behavior
        this.updateTypeSpecific(deltaTime, player, physicsWorld);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Super update
        super.update(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer--;
        if (this.jumpTimer > 0) this.jumpTimer--;
        if (this.flashTimer > 0) this.flashTimer--;
        this.stateTimer++;
        
        if (this.invulnerabilityTimer <= 0) {
            this.invulnerable = false;
        }
    }
    
    updateAI(player, physicsWorld, deltaTime) {
        if (this.health <= 0) {
            this.state = 'dead';
            return;
        }
        
        const distanceToPlayer = this.getDistanceToPlayer(player);
        const canSeePlayer = this.canSeePlayer(player, physicsWorld);
        
        // Update alert level
        if (canSeePlayer && distanceToPlayer <= this.detectionRange) {
            this.alertLevel = Math.min(100, this.alertLevel + 2);
            this.lastKnownPlayerPos = player.position.clone();
        } else {
            this.alertLevel = Math.max(0, this.alertLevel - 1);
        }
        
        // State machine
        switch (this.state) {
            case 'patrol':
                this.handlePatrolState(player, distanceToPlayer, canSeePlayer);
                break;
                
            case 'chase':
                this.handleChaseState(player, distanceToPlayer, canSeePlayer, physicsWorld);
                break;
                
            case 'attack':
                this.handleAttackState(player, distanceToPlayer);
                break;
                
            case 'stunned':
                this.handleStunnedState();
                break;
                
            case 'dead':
                this.handleDeathState();
                break;
        }
    }
    
    handlePatrolState(player, distanceToPlayer, canSeePlayer) {
        // Patrol behavior
        if (this.patrolPoints.length > 0) {
            this.patrolBetweenPoints();
        } else {
            this.patrolRandomly();
        }
        
        // Check for player detection
        if (canSeePlayer && distanceToPlayer <= this.detectionRange) {
            this.setState('chase');
            this.target = player;
        }
    }
    
    handleChaseState(player, distanceToPlayer, canSeePlayer, physicsWorld) {
        // Chase the player
        if (canSeePlayer) {
            this.chasePlayer(player, physicsWorld);
            this.lastKnownPlayerPos = player.position.clone();
        } else if (this.lastKnownPlayerPos) {
            // Move towards last known position
            this.moveTowards(this.lastKnownPlayerPos);
            
            // Lost player after some time
            if (this.stateTimer > 300) { // 5 seconds
                this.setState('patrol');
                this.lastKnownPlayerPos = null;
            }
        }
        
        // Switch to attack if close enough
        if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
            this.setState('attack');
        }
        
        // Return to patrol if player too far
        if (distanceToPlayer > this.detectionRange * 1.5 && this.alertLevel < 20) {
            this.setState('patrol');
        }
    }
    
    handleAttackState(player, distanceToPlayer) {
        // Stop movement during attack
        this.velocity.x *= 0.5;
        
        // Perform attack
        if (this.stateTimer === 1) {
            this.performAttack(player);
        }
        
        // Return to chase after attack
        if (this.stateTimer > 30) {
            this.attackCooldown = this.attackDuration;
            this.setState('chase');
        }
    }
    
    handleStunnedState() {
        // Reduce velocity while stunned
        this.velocity.x *= 0.9;
        
        // Return to patrol after stun
        if (this.stateTimer > 120) { // 2 seconds
            this.setState('patrol');
        }
    }
    
    handleDeathState() {
        // Death particles and cleanup
        if (this.stateTimer === 1) {
            this.createDeathEffect();
        }
        
        // Mark for removal
        if (this.stateTimer > 60) {
            this.markForDestroy = true;
        }
    }
    
    chasePlayer(player, physicsWorld) {
        const direction = this.getDirectionToPlayer(player);
        
        // Basic movement towards player
        const moveSpeed = this.speed * (1 + this.alertLevel / 100);
        this.velocity.x += direction.x * moveSpeed * 0.1;
        
        // Jump if needed
        if (this.shouldJump(player, physicsWorld)) {
            this.jump();
        }
        
        this.facing = Math.sign(direction.x);
    }
    
    shouldJump(player, physicsWorld) {
        if (!this.grounded || this.jumpTimer > 0) return false;
        
        // Jump if player is above
        const playerDirection = this.getDirectionToPlayer(player);
        if (playerDirection.y < -0.5 && Math.abs(playerDirection.x) < 0.8) {
            return true;
        }
        
        // Jump over obstacles
        const frontCheck = this.raycastFront(physicsWorld);
        if (frontCheck.hit && frontCheck.distance < 40) {
            return true;
        }
        
        return false;
    }
    
    jump() {
        if (this.grounded) {
            this.velocity.y = -(this.jumpPower || 10);
            this.jumpTimer = 30;
            this.grounded = false;
        }
    }
    
    patrolBetweenPoints() {
        if (this.patrolPoints.length === 0) return;
        
        const target = this.patrolPoints[this.currentPatrolIndex];
        const direction = target.subtract(this.position).normalize();
        
        this.velocity.x += direction.x * this.speed * 0.1;
        this.facing = Math.sign(direction.x);
        
        // Reached patrol point
        if (this.position.distance(target) < 20) {
            this.currentPatrolIndex += this.patrolDirection;
            
            // Reverse direction at ends
            if (this.currentPatrolIndex >= this.patrolPoints.length || this.currentPatrolIndex < 0) {
                this.patrolDirection *= -1;
                this.currentPatrolIndex = Utils.clamp(this.currentPatrolIndex, 0, this.patrolPoints.length - 1);
            }
        }
    }
    
    patrolRandomly() {
        // Simple random movement
        if (this.stateTimer % 120 === 0) { // Change direction every 2 seconds
            this.patrolDirection = Utils.randomInt(0, 1) * 2 - 1;
        }
        
        this.velocity.x += this.patrolDirection * this.speed * 0.05;
        this.facing = this.patrolDirection;
    }
    
    performAttack(player) {
        this.animationState = 'attack';
        
        switch (this.type) {
            case 'ranged':
                this.fireProjectile(player);
                break;
                
            default:
                this.meleeAttack(player);
                break;
        }
        
        // Screen effects
        Utils.screenShake(3, 100);
    }
    
    meleeAttack(player) {
        const attackDirection = this.getDirectionToPlayer(player);
        const attackRange = this.attackRange;
        
        // Create attack hitbox
        if (window.particleSystem) {
            window.particleSystem.createSpark(
                this.position.x + attackDirection.x * attackRange,
                this.position.y + this.height / 2,
                5
            );
        }
        
        // Audio feedback
        if (window.audioManager) {
            window.audioManager.playSpatialSound('enemyAttack', this.position.x, this.position.y);
        }
    }
    
    fireProjectile(player) {
        const direction = this.getDirectionToPlayer(player);
        
        if (window.game && window.game.enemyProjectiles) {
            window.game.enemyProjectiles.push(new EnemyProjectile(
                this.position.x + this.width / 2,
                this.position.y + this.height / 2,
                direction,
                this.damage
            ));
        }
    }
    
    updateTypeSpecific(deltaTime, player, physicsWorld) {
        switch (this.type) {
            case 'jumper':
                this.updateJumperBehavior(player);
                break;
                
            case 'phase':
                this.updatePhaseBehavior(deltaTime);
                break;
                
            case 'ranged':
                this.updateRangedBehavior(player);
                break;
        }
    }
    
    updateJumperBehavior(player) {
        // More aggressive jumping
        if (this.state === 'chase' && this.grounded && this.jumpTimer <= 0) {
            const distanceToPlayer = this.getDistanceToPlayer(player);
            if (distanceToPlayer < 100 && Math.random() < 0.02) {
                this.jump();
            }
        }
    }
    
    updatePhaseBehavior(deltaTime) {
        if (this.phaseTimer > 0) {
            this.phaseTimer--;
            this.isTrigger = true;
            
            if (this.phaseTimer <= 0) {
                this.isTrigger = false;
                this.phaseCooldown = 180; // 3 seconds
            }
        } else if (this.phaseCooldown > 0) {
            this.phaseCooldown--;
        }
        
        // Phase when taking damage
        if (this.state === 'chase' && this.phaseCooldown <= 0 && Math.random() < 0.005) {
            this.startPhase();
        }
    }
    
    updateRangedBehavior(player) {
        // Keep distance from player
        if (this.state === 'chase') {
            const distanceToPlayer = this.getDistanceToPlayer(player);
            if (distanceToPlayer < this.attackRange * 0.7) {
                // Move away from player
                const direction = this.getDirectionToPlayer(player);
                this.velocity.x -= direction.x * this.speed * 0.05;
            }
        }
    }
    
    startPhase() {
        this.phaseTimer = 60; // 1 second
        this.isTrigger = true;
        
        if (window.particleSystem) {
            window.particleSystem.createQuantumEffect(
                this.position.x + this.width / 2,
                this.position.y + this.height / 2
            );
        }
    }
    
    // Utility methods
    getDistanceToPlayer(player) {
        return this.position.distance(player.position);
    }
    
    getDirectionToPlayer(player) {
        return player.position.subtract(this.position).normalize();
    }
    
    canSeePlayer(player, physicsWorld) {
        const raycast = physicsWorld.raycast(
            this.getCenter(),
            player.getCenter(),
            ['solid']
        );
        
        return !raycast.hit;
    }
    
    raycastFront(physicsWorld) {
        const start = new Vector2(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
        const end = new Vector2(
            start.x + this.facing * 50,
            start.y
        );
        
        return physicsWorld.raycast(start, end, ['solid']);
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    takeDamage(amount = 1, source = null) {
        if (this.invulnerable || this.health <= 0) return;
        
        this.health -= amount;
        this.invulnerable = true;
        this.invulnerabilityTimer = 30;
        this.flashTimer = 30;
        
        // Knockback
        if (source) {
            const knockbackDir = this.position.subtract(source.position).normalize();
            this.velocity = knockbackDir.multiply(this.knockback);
        }
        
        // Effects
        if (window.particleSystem) {
            window.particleSystem.createSpark(
                this.position.x + this.width / 2,
                this.position.y + this.height / 2,
                8
            );
        }
        
        // Audio
        if (window.audioManager) {
            window.audioManager.playSpatialSound('enemyHit', this.position.x, this.position.y);
        }
        
        if (this.health <= 0) {
            this.die();
        } else {
            this.setState('stunned');
        }
    }
    
    die() {
        this.setState('dead');
        
        // Award points to player
        if (window.gameState) {
            const baseScore = this.type === 'heavy' ? 200 : 
                            this.type === 'ranged' ? 150 : 100;
            window.gameState.score += baseScore;
        }
        
        // Combo for player
        if (window.game && window.game.player) {
            window.game.player.addCombo();
        }
    }
    
    createDeathEffect() {
        if (window.particleSystem) {
            window.particleSystem.createEnemyDeath(
                this.position.x + this.width / 2,
                this.position.y + this.height / 2
            );
        }
        
        if (window.audioManager) {
            window.audioManager.playSpatialSound('enemyDefeat', this.position.x, this.position.y);
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer++;
        
        // Determine animation state
        if (this.health <= 0) {
            this.animationState = 'death';
        } else if (this.state === 'attack') {
            this.animationState = 'attack';
        } else if (Math.abs(this.velocity.x) > 1) {
            this.animationState = 'run';
        } else {
            this.animationState = 'idle';
        }
        
        // Update animation frame
        const animationSpeeds = {
            idle: 60,
            run: 12,
            attack: 8,
            death: 15
        };
        
        if (this.animationTimer >= animationSpeeds[this.animationState]) {
            this.animationFrame++;
            this.animationTimer = 0;
        }
    }
    
    updateEffects(deltaTime) {
        // Update death particles
        this.deathParticles = this.deathParticles.filter(particle => {
            particle.life--;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            return particle.life > 0;
        });
    }
    
    render(ctx, camera) {
        if (this.health <= 0 && this.stateTimer > 60) return;
        
        ctx.save();
        
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        // Flash when hit
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Phase transparency
        if (this.phaseTimer > 0) {
            ctx.globalAlpha = 0.4;
        }
        
        // Enemy colors based on type
        const colors = {
            basic: '#ff4444',
            fast: '#ff8844',
            heavy: '#884444',
            jumper: '#44ff44',
            ranged: '#4444ff',
            phase: '#ff44ff'
        };
        
        ctx.fillStyle = colors[this.type] || '#ff4444';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Health bar for stronger enemies
        if (this.maxHealth > 1) {
            const barWidth = this.width;
            const barHeight = 4;
            const healthRatio = this.health / this.maxHealth;
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(screenX, screenY - 8, barWidth, barHeight);
            
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(screenX, screenY - 8, barWidth * healthRatio, barHeight);
        }
        
        // Glow effect based on alert level
        if (this.alertLevel > 50) {
            Utils.drawGlow(ctx, screenX + this.width/2, screenY + this.height/2, 
                          20, '#ff0000', this.alertLevel / 100);
        }
        
        ctx.restore();
    }
}

class EnemyProjectile {
    constructor(x, y, direction, damage = 1) {
        this.position = new Vector2(x, y);
        this.velocity = direction.multiply(8);
        this.damage = damage;
        this.life = 180; // 3 seconds
        this.size = 4;
        this.dead = false;
    }
    
    update(deltaTime, physicsWorld) {
        // Update position
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        
        // Update life
        this.life--;
        if (this.life <= 0) {
            this.dead = true;
            return;
        }
        
        // Check collision with walls
        const bounds = {
            x: this.position.x - this.size/2,
            y: this.position.y - this.size/2,
            width: this.size,
            height: this.size
        };
        
        for (const tile of physicsWorld.staticTiles) {
            if (Utils.rectCollision(bounds, tile.getBounds())) {
                this.dead = true;
                this.createImpactEffect();
                return;
            }
        }
        
        // Check collision with player
        if (window.game && window.game.player) {
            const player = window.game.player;
            const playerBounds = player.getBounds();
            
            if (Utils.rectCollision(bounds, playerBounds)) {
                player.takeDamage(this);
                this.dead = true;
                this.createImpactEffect();
            }
        }
    }
    
    createImpactEffect() {
        if (window.particleSystem) {
            window.particleSystem.createSpark(this.position.x, this.position.y, 5);
        }
    }
    
    render(ctx, camera) {
        if (this.dead) return;
        
        ctx.save();
        
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        Utils.drawGlow(ctx, screenX, screenY, this.size * 2, '#ffff00', 0.8);
        
        ctx.restore();
    }
}