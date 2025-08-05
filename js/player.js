// Quantum Runner - Player Character
class Player extends PhysicsBody {
    constructor(x, y) {
        super(x, y, 24, 32);
        
        // Movement properties
        this.speed = 8;
        this.jumpPower = 14;
        this.wallJumpPower = 12;
        this.maxSpeed = 12;
        this.acceleration = 0.8;
        this.airAcceleration = 0.4;
        this.jumpBufferTime = 8; // frames
        this.coyoteTime = 6; // frames
        this.wallSlideSpeed = 2;
        
        // State tracking
        this.facing = 1; // 1 = right, -1 = left
        this.jumpBuffer = 0;
        this.coyoteTimer = 0;
        this.wallSlideTimer = 0;
        this.dashCooldown = 0;
        this.timeSinceGrounded = 0;
        this.timeSinceWall = 0;
        
        // Quantum abilities
        this.quantumEnergy = 100;
        this.maxQuantumEnergy = 100;
        this.energyRegenRate = 1;
        this.dashCost = 20;
        this.timeSlowCost = 2; // per frame
        this.phaseShiftCost = 30;
        
        // Dash mechanics
        this.isDashing = false;
        this.dashDirection = new Vector2(0, 0);
        this.dashDuration = 12; // frames
        this.dashTimer = 0;
        this.dashSpeed = 18;
        this.dashInvulnerability = true;
        
        // Time manipulation
        this.isTimeSlowing = false;
        this.timeSlowFactor = 0.3;
        
        // Phase shifting
        this.isPhased = false;
        this.phaseDuration = 30; // frames
        this.phaseTimer = 0;
        
        // Momentum preservation
        this.momentumPreservation = 0.9;
        this.airMomentum = new Vector2(0, 0);
        
        // Wall jumping
        this.wallJumpDirection = 0;
        this.wallJumpTimer = 0;
        this.wallJumpDuration = 8;
        
        // Animation and visual state
        this.animationState = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.flipX = false;
        
        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDecayTime = 180; // frames
        
        // Lives and health
        this.lives = 3;
        this.maxLives = 3;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 120; // frames
        
        // Effects and juice
        this.afterImages = [];
        this.landingParticles = [];
        this.dashTrail = [];
        
        // Audio feedback
        this.stepTimer = 0;
        this.stepInterval = 20;
        
        this.setupPhysics();
    }
    
    setupPhysics() {
        this.friction = 0.85;
        this.mass = 1;
        this.maxVelocity = new Vector2(this.maxSpeed, 25);
        
        // Collision callbacks
        this.onTriggerEnter = (other) => {
            if (other.type === 'enemy' && !this.invulnerable) {
                this.takeDamage(other);
            } else if (other.type === 'powerup') {
                this.collectPowerup(other);
            } else if (other.type === 'checkpoint') {
                this.activateCheckpoint(other);
            }
        };
    }
    
    update(deltaTime, input, physicsWorld) {
        // Update timers
        this.updateTimers(deltaTime);
        
        // Regenerate quantum energy
        this.quantumEnergy = Math.min(this.maxQuantumEnergy, 
            this.quantumEnergy + this.energyRegenRate * deltaTime);
        
        // Handle input and movement
        if (!this.isDashing) {
            this.handleMovementInput(input, deltaTime);
            this.handleJumpInput(input, physicsWorld);
            this.handleQuantumAbilities(input, deltaTime);
        }
        
        // Update dash
        this.updateDash(deltaTime);
        
        // Update phase shift
        this.updatePhaseShift(deltaTime);
        
        // Update wall slide
        this.updateWallSlide(deltaTime);
        
        // Apply movement
        this.applyMovement(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Update combo system
        this.updateCombo(deltaTime);
        
        // Update invulnerability
        this.updateInvulnerability(deltaTime);
        
        // Super method
        super.update(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.jumpBuffer > 0) this.jumpBuffer--;
        if (this.coyoteTimer > 0) this.coyoteTimer--;
        if (this.wallSlideTimer > 0) this.wallSlideTimer--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.wallJumpTimer > 0) this.wallJumpTimer--;
        if (this.comboTimer > 0) this.comboTimer--;
        
        if (this.grounded) {
            this.timeSinceGrounded = 0;
            this.coyoteTimer = this.coyoteTime;
        } else {
            this.timeSinceGrounded++;
        }
        
        if (this.onWall) {
            this.timeSinceWall = 0;
        } else {
            this.timeSinceWall++;
        }
    }
    
    handleMovementInput(input, deltaTime) {
        const horizontalInput = input.getHorizontalInput();
        
        if (horizontalInput !== 0) {
            this.facing = horizontalInput;
            this.flipX = horizontalInput < 0;
        }
        
        // Ground movement
        if (this.grounded) {
            this.velocity.x += horizontalInput * this.acceleration * deltaTime;
            
            // Play step sounds
            if (Math.abs(this.velocity.x) > 2 && Math.abs(horizontalInput) > 0.1) {
                this.stepTimer++;
                if (this.stepTimer >= this.stepInterval) {
                    this.stepTimer = 0;
                    // Add step particle effect
                    this.addLandingParticles(3);
                }
            }
        } else {
            // Air movement with momentum preservation
            this.velocity.x += horizontalInput * this.airAcceleration * deltaTime;
        }
        
        // Apply speed limit
        if (Math.abs(this.velocity.x) > this.maxSpeed && !this.isDashing) {
            this.velocity.x = Math.sign(this.velocity.x) * this.maxSpeed;
        }
    }
    
    handleJumpInput(input, physicsWorld) {
        // Jump buffer
        if (input.isJumpJustPressed()) {
            this.jumpBuffer = this.jumpBufferTime;
        }
        
        // Regular jump
        if (this.jumpBuffer > 0 && (this.grounded || this.coyoteTimer > 0)) {
            this.performJump();
            this.jumpBuffer = 0;
            this.coyoteTimer = 0;
            
            // Add jump particle effect
            this.addLandingParticles(5);
            Utils.screenShake(2, 100);
        }
        
        // Wall jump
        if (this.jumpBuffer > 0 && this.onWall && !this.grounded) {
            this.performWallJump();
            this.jumpBuffer = 0;
        }
        
        // Variable jump height
        if (!input.isJumpPressed() && this.velocity.y < 0) {
            this.velocity.y *= 0.5;
        }
    }
    
    handleQuantumAbilities(input, deltaTime) {
        // Quantum Dash
        if (input.isDashJustPressed() && this.dashCooldown <= 0 && 
            this.quantumEnergy >= this.dashCost) {
            this.performQuantumDash(input);
        }
        
        // Time Slow
        if (input.isTimeSlowPressed() && this.quantumEnergy >= this.timeSlowCost) {
            if (!this.isTimeSlowing) {
                this.activateTimeSlow();
            }
            this.quantumEnergy -= this.timeSlowCost * deltaTime;
        } else if (this.isTimeSlowing) {
            this.deactivateTimeSlow();
        }
        
        // Phase Shift
        if (input.isPhaseShiftJustPressed() && !this.isPhased && 
            this.quantumEnergy >= this.phaseShiftCost) {
            this.activatePhaseShift();
        }
    }
    
    performJump() {
        this.velocity.y = -this.jumpPower;
        this.grounded = false;
        this.animationState = 'jump';
        
        // Preserve horizontal momentum
        if (Math.abs(this.velocity.x) > this.speed) {
            this.airMomentum.x = this.velocity.x * this.momentumPreservation;
        }
    }
    
    performWallJump() {
        const jumpDirection = -this.wallDirection;
        this.velocity.x = jumpDirection * this.wallJumpPower * 0.8;
        this.velocity.y = -this.wallJumpPower;
        
        this.wallJumpDirection = jumpDirection;
        this.wallJumpTimer = this.wallJumpDuration;
        this.facing = jumpDirection;
        this.flipX = jumpDirection < 0;
        
        this.onWall = false;
        this.grounded = false;
        this.animationState = 'walljump';
        
        // Add wall jump particle effect
        this.addWallJumpParticles();
        Utils.screenShake(3, 150);
    }
    
    performQuantumDash(input) {
        const horizontalInput = input.getHorizontalInput();
        const verticalInput = input.getVerticalInput();
        
        // Determine dash direction
        if (horizontalInput !== 0 || verticalInput !== 0) {
            this.dashDirection = new Vector2(horizontalInput, verticalInput).normalize();
        } else {
            // Default to facing direction
            this.dashDirection = new Vector2(this.facing, 0);
        }
        
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = 30; // frames
        this.quantumEnergy -= this.dashCost;
        
        // Set dash velocity
        this.velocity = this.dashDirection.multiply(this.dashSpeed);
        
        this.animationState = 'dash';
        
        // Add dash effects
        this.addDashTrail();
        Utils.screenShake(4, 200);
        Utils.hitStop(50);
    }
    
    activateTimeSlow() {
        this.isTimeSlowing = true;
        // Global time scale would be handled by the game manager
        if (window.gameState) {
            window.gameState.timeScale = this.timeSlowFactor;
        }
    }
    
    deactivateTimeSlow() {
        this.isTimeSlowing = false;
        if (window.gameState) {
            window.gameState.timeScale = 1.0;
        }
    }
    
    activatePhaseShift() {
        this.isPhased = true;
        this.phaseTimer = this.phaseDuration;
        this.quantumEnergy -= this.phaseShiftCost;
        this.isTrigger = true; // Pass through solid objects
        
        this.animationState = 'phase';
        
        // Add phase effect
        Utils.screenShake(2, 100);
    }
    
    updateDash(deltaTime) {
        if (this.isDashing) {
            this.dashTimer--;
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.dashInvulnerability = false;
                
                // Preserve some dash momentum
                this.velocity = this.velocity.multiply(0.6);
                
                this.animationState = this.grounded ? 'run' : 'fall';
            }
        }
    }
    
    updatePhaseShift(deltaTime) {
        if (this.isPhased) {
            this.phaseTimer--;
            
            if (this.phaseTimer <= 0) {
                this.isPhased = false;
                this.isTrigger = false;
                this.animationState = this.grounded ? 'idle' : 'fall';
            }
        }
    }
    
    updateWallSlide(deltaTime) {
        if (this.onWall && !this.grounded && this.velocity.y > 0) {
            // Wall slide mechanics
            this.velocity.y = Math.min(this.velocity.y, this.wallSlideSpeed);
            this.wallSlideTimer = 10;
            this.animationState = 'wallslide';
            
            // Add wall slide particles
            if (Math.random() < 0.3) {
                this.addWallSlideParticles();
            }
        }
    }
    
    applyMovement(deltaTime) {
        // Apply air resistance when not grounded
        if (!this.grounded && !this.isDashing) {
            this.velocity.x *= 0.98;
        }
        
        // Wall jump momentum override
        if (this.wallJumpTimer > 0) {
            // Reduce control during wall jump
            this.velocity.x = Utils.lerp(this.velocity.x, this.wallJumpDirection * this.wallJumpPower * 0.8, 0.1);
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer++;
        
        // Determine animation state
        if (this.isDashing) {
            this.animationState = 'dash';
        } else if (this.isPhased) {
            this.animationState = 'phase';
        } else if (!this.grounded) {
            if (this.onWall && this.wallSlideTimer > 0) {
                this.animationState = 'wallslide';
            } else if (this.velocity.y < 0) {
                this.animationState = 'jump';
            } else {
                this.animationState = 'fall';
            }
        } else {
            if (Math.abs(this.velocity.x) > 1) {
                this.animationState = 'run';
            } else {
                this.animationState = 'idle';
            }
        }
        
        // Update animation frame
        const animationSpeeds = {
            idle: 60,
            run: 8,
            jump: 30,
            fall: 30,
            dash: 4,
            phase: 6,
            wallslide: 30,
            walljump: 15
        };
        
        if (this.animationTimer >= animationSpeeds[this.animationState]) {
            this.animationFrame++;
            this.animationTimer = 0;
        }
    }
    
    updateEffects(deltaTime) {
        // Update after images
        this.afterImages = this.afterImages.filter(image => {
            image.alpha -= 0.1;
            return image.alpha > 0;
        });
        
        // Add after images during dash
        if (this.isDashing && this.dashTimer % 2 === 0) {
            this.afterImages.push({
                x: this.position.x,
                y: this.position.y,
                alpha: 0.7,
                frame: this.animationFrame
            });
        }
        
        // Update dash trail
        this.dashTrail = this.dashTrail.filter(point => {
            point.life--;
            return point.life > 0;
        });
        
        // Update landing particles
        this.landingParticles = this.landingParticles.filter(particle => {
            particle.life--;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3; // gravity
            return particle.life > 0;
        });
    }
    
    updateCombo(deltaTime) {
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 0) {
            this.combo = Math.max(0, this.combo - 1);
            this.comboTimer = this.comboDecayTime;
        }
    }
    
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerabilityTimer--;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    addCombo(amount = 1) {
        this.combo += amount;
        this.comboTimer = this.comboDecayTime;
        
        // Add score based on combo
        if (window.gameState) {
            const scoreMultiplier = Math.floor(this.combo / 5) + 1;
            window.gameState.score += 100 * scoreMultiplier;
        }
    }
    
    takeDamage(source) {
        if (this.invulnerable || this.isDashing) return;
        
        this.lives--;
        this.invulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
        
        // Knockback
        const knockbackDirection = this.position.subtract(source.position).normalize();
        this.velocity = knockbackDirection.multiply(8);
        
        // Effects
        Utils.screenShake(8, 300);
        Utils.hitStop(150);
        
        // Reset combo
        this.combo = 0;
        
        if (this.lives <= 0) {
            this.die();
        }
    }
    
    die() {
        // Death animation and respawn logic
        if (window.gameState) {
            window.gameState.gameOver = true;
        }
        
        // Add death particles
        this.addDeathParticles();
        Utils.screenShake(15, 500);
    }
    
    collectPowerup(powerup) {
        switch (powerup.type) {
            case 'energy':
                this.quantumEnergy = Math.min(this.maxQuantumEnergy, this.quantumEnergy + 30);
                break;
            case 'life':
                this.lives = Math.min(this.maxLives, this.lives + 1);
                break;
            case 'speedBoost':
                this.maxSpeed += 2;
                break;
        }
        
        this.addCombo();
        Utils.screenShake(3, 100);
    }
    
    // Particle effects
    addLandingParticles(count) {
        for (let i = 0; i < count; i++) {
            this.landingParticles.push({
                x: this.position.x + this.width / 2 + Utils.randomBetween(-10, 10),
                y: this.position.y + this.height,
                vx: Utils.randomBetween(-3, 3),
                vy: Utils.randomBetween(-2, -5),
                life: Utils.randomInt(10, 20),
                color: '#00ffff'
            });
        }
    }
    
    addWallJumpParticles() {
        for (let i = 0; i < 8; i++) {
            this.landingParticles.push({
                x: this.position.x + (this.wallDirection > 0 ? this.width : 0),
                y: this.position.y + this.height / 2 + Utils.randomBetween(-10, 10),
                vx: -this.wallDirection * Utils.randomBetween(2, 5),
                vy: Utils.randomBetween(-3, 3),
                life: Utils.randomInt(15, 25),
                color: '#ffff00'
            });
        }
    }
    
    addWallSlideParticles() {
        this.landingParticles.push({
            x: this.position.x + (this.wallDirection > 0 ? this.width : 0),
            y: this.position.y + this.height / 2,
            vx: -this.wallDirection * Utils.randomBetween(1, 3),
            vy: Utils.randomBetween(0, 2),
            life: Utils.randomInt(8, 15),
            color: '#ff8800'
        });
    }
    
    addDashTrail() {
        for (let i = 0; i < 20; i++) {
            this.dashTrail.push({
                x: this.position.x + this.width / 2,
                y: this.position.y + this.height / 2,
                life: 15,
                delay: i
            });
        }
    }
    
    addDeathParticles() {
        for (let i = 0; i < 20; i++) {
            this.landingParticles.push({
                x: this.position.x + this.width / 2,
                y: this.position.y + this.height / 2,
                vx: Utils.randomBetween(-8, 8),
                vy: Utils.randomBetween(-8, 8),
                life: Utils.randomInt(30, 60),
                color: '#ff0040'
            });
        }
    }
    
    render(ctx, camera) {
        ctx.save();
        
        // Apply camera transform
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        // Invulnerability flashing
        if (this.invulnerable && Math.floor(this.invulnerabilityTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Phase shift transparency
        if (this.isPhased) {
            ctx.globalAlpha = 0.6;
            Utils.drawGlow(ctx, screenX + this.width/2, screenY + this.height/2, 40, '#ff00ff', 0.8);
        }
        
        // Render after images
        for (const image of this.afterImages) {
            ctx.save();
            ctx.globalAlpha = image.alpha * 0.3;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(image.x - camera.x, image.y - camera.y, this.width, this.height);
            ctx.restore();
        }
        
        // Render dash trail
        for (const point of this.dashTrail) {
            if (point.delay <= 0) {
                ctx.save();
                ctx.globalAlpha = point.life / 15 * 0.5;
                Utils.drawGlow(ctx, point.x - camera.x, point.y - camera.y, 8, '#ffff00', 0.6);
                ctx.restore();
            } else {
                point.delay--;
            }
        }
        
        // Render player rectangle (simplified)
        if (this.isDashing) {
            ctx.fillStyle = '#ffff00';
            Utils.drawGlow(ctx, screenX + this.width/2, screenY + this.height/2, 30, '#ffff00', 1);
        } else {
            ctx.fillStyle = '#00ffff';
        }
        
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Add glow effect
        Utils.drawGlow(ctx, screenX + this.width/2, screenY + this.height/2, 20, '#00ffff', 0.3);
        
        // Render particles
        for (const particle of this.landingParticles) {
            ctx.save();
            ctx.globalAlpha = particle.life / 20;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - camera.x - 2, particle.y - camera.y - 2, 4, 4);
            ctx.restore();
        }
        
        ctx.restore();
    }
}