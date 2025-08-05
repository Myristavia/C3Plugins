// Quantum Runner - Extended Power Systems
class QuantumPowerManager {
    constructor(player) {
        this.player = player;
        
        // Quantum abilities
        this.abilities = {
            timeSlow: {
                level: 1,
                maxLevel: 5,
                energyCost: 2,
                cooldown: 0,
                maxCooldown: 60,
                duration: 300,
                active: false,
                timer: 0
            },
            
            phaseShift: {
                level: 1,
                maxLevel: 3,
                energyCost: 30,
                cooldown: 0,
                maxCooldown: 180,
                duration: 60,
                active: false,
                timer: 0
            },
            
            quantumDash: {
                level: 1,
                maxLevel: 4,
                energyCost: 20,
                cooldown: 0,
                maxCooldown: 120,
                charges: 1,
                maxCharges: 1
            },
            
            energyShield: {
                level: 0,
                maxLevel: 3,
                energyCost: 40,
                cooldown: 0,
                maxCooldown: 300,
                duration: 180,
                active: false,
                timer: 0
            },
            
            timeRewind: {
                level: 0,
                maxLevel: 2,
                energyCost: 50,
                cooldown: 0,
                maxCooldown: 600,
                rewindBuffer: [],
                bufferSize: 180
            }
        };
        
        // Passive upgrades
        this.upgrades = {
            speedBoost: { level: 0, maxLevel: 5 },
            jumpBoost: { level: 0, maxLevel: 5 },
            energyRegenBoost: { level: 0, maxLevel: 3 },
            maxEnergyBoost: { level: 0, maxLevel: 4 },
            dashDistance: { level: 0, maxLevel: 3 },
            wallJumpBoost: { level: 0, maxLevel: 3 }
        };
        
        // Persistent effects
        this.activeEffects = [];
    }
    
    update(deltaTime) {
        this.updateCooldowns(deltaTime);
        this.updateActiveAbilities(deltaTime);
        this.updateActiveEffects(deltaTime);
        this.updateRewindBuffer();
        this.applyPassiveUpgrades();
    }
    
    updateCooldowns(deltaTime) {
        for (const [name, ability] of Object.entries(this.abilities)) {
            if (ability.cooldown > 0) {
                ability.cooldown = Math.max(0, ability.cooldown - deltaTime);
            }
        }
    }
    
    updateActiveAbilities(deltaTime) {
        // Time Slow
        const timeSlow = this.abilities.timeSlow;
        if (timeSlow.active) {
            timeSlow.timer -= deltaTime;
            if (timeSlow.timer <= 0) {
                this.deactivateTimeSlow();
            }
        }
        
        // Phase Shift
        const phaseShift = this.abilities.phaseShift;
        if (phaseShift.active) {
            phaseShift.timer -= deltaTime;
            if (phaseShift.timer <= 0) {
                this.deactivatePhaseShift();
            }
        }
        
        // Energy Shield
        const shield = this.abilities.energyShield;
        if (shield.active) {
            shield.timer -= deltaTime;
            if (shield.timer <= 0) {
                this.deactivateEnergyShield();
            }
        }
    }
    
    updateActiveEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.timer -= deltaTime;
            if (effect.timer <= 0) {
                this.removeEffect(effect);
                return false;
            }
            return true;
        });
    }
    
    updateRewindBuffer() {
        const rewind = this.abilities.timeRewind;
        if (rewind.level > 0) {
            // Store player state for rewind
            rewind.rewindBuffer.push({
                position: this.player.position.clone(),
                velocity: this.player.velocity.clone(),
                health: this.player.lives,
                energy: this.player.quantumEnergy
            });
            
            // Keep buffer at max size
            if (rewind.rewindBuffer.length > rewind.bufferSize) {
                rewind.rewindBuffer.shift();
            }
        }
    }
    
    applyPassiveUpgrades() {
        const upgrades = this.upgrades;
        
        // Speed boost
        if (upgrades.speedBoost.level > 0) {
            this.player.maxSpeed = this.player.baseMaxSpeed + upgrades.speedBoost.level;
        }
        
        // Jump boost
        if (upgrades.jumpBoost.level > 0) {
            this.player.jumpPower = this.player.baseJumpPower + upgrades.jumpBoost.level;
        }
        
        // Energy regen boost
        if (upgrades.energyRegenBoost.level > 0) {
            this.player.energyRegenRate = 1 + upgrades.energyRegenBoost.level * 0.5;
        }
        
        // Max energy boost
        if (upgrades.maxEnergyBoost.level > 0) {
            this.player.maxQuantumEnergy = 100 + upgrades.maxEnergyBoost.level * 25;
        }
    }
    
    // Ability activation methods
    activateTimeSlow() {
        const ability = this.abilities.timeSlow;
        
        if (ability.cooldown > 0 || this.player.quantumEnergy < ability.energyCost) {
            return false;
        }
        
        ability.active = true;
        ability.timer = ability.duration + (ability.level - 1) * 60;
        ability.cooldown = ability.maxCooldown;
        
        // Apply time scale
        if (window.gameState) {
            const slowFactor = 0.5 - (ability.level - 1) * 0.1;
            window.gameState.timeScale = slowFactor;
        }
        
        // Effects
        this.createTimeSlowEffect();
        
        return true;
    }
    
    deactivateTimeSlow() {
        this.abilities.timeSlow.active = false;
        
        // Restore time scale
        if (window.gameState) {
            window.gameState.timeScale = 1.0;
        }
    }
    
    activatePhaseShift() {
        const ability = this.abilities.phaseShift;
        
        if (ability.cooldown > 0 || this.player.quantumEnergy < ability.energyCost) {
            return false;
        }
        
        ability.active = true;
        ability.timer = ability.duration + (ability.level - 1) * 30;
        ability.cooldown = ability.maxCooldown;
        
        this.player.quantumEnergy -= ability.energyCost;
        this.player.isPhased = true;
        this.player.isTrigger = true;
        
        // Effects
        this.createPhaseShiftEffect();
        
        return true;
    }
    
    deactivatePhaseShift() {
        this.abilities.phaseShift.active = false;
        this.player.isPhased = false;
        this.player.isTrigger = false;
    }
    
    activateQuantumDash(direction) {
        const ability = this.abilities.quantumDash;
        
        if (ability.cooldown > 0 || this.player.quantumEnergy < ability.energyCost) {
            return false;
        }
        
        ability.cooldown = ability.maxCooldown;
        this.player.quantumEnergy -= ability.energyCost;
        
        // Enhanced dash based on level
        const dashSpeed = 18 + ability.level * 2;
        const dashDistance = 1 + ability.level * 0.2;
        
        this.player.velocity = direction.multiply(dashSpeed * dashDistance);
        this.player.isDashing = true;
        this.player.dashTimer = 12 + ability.level * 2;
        
        // Effects
        this.createQuantumDashEffect();
        
        return true;
    }
    
    activateEnergyShield() {
        const ability = this.abilities.energyShield;
        
        if (ability.level === 0 || ability.cooldown > 0 || 
            this.player.quantumEnergy < ability.energyCost) {
            return false;
        }
        
        ability.active = true;
        ability.timer = ability.duration + (ability.level - 1) * 60;
        ability.cooldown = ability.maxCooldown;
        
        this.player.quantumEnergy -= ability.energyCost;
        
        // Add shield effect
        this.addEffect('energyShield', ability.timer, {
            damageReduction: 0.5 + ability.level * 0.2,
            color: '#40ff40'
        });
        
        // Effects
        this.createEnergyShieldEffect();
        
        return true;
    }
    
    deactivateEnergyShield() {
        this.abilities.energyShield.active = false;
        this.removeEffectByType('energyShield');
    }
    
    activateTimeRewind() {
        const ability = this.abilities.timeRewind;
        
        if (ability.level === 0 || ability.cooldown > 0 || 
            this.player.quantumEnergy < ability.energyCost ||
            ability.rewindBuffer.length < 60) {
            return false;
        }
        
        ability.cooldown = ability.maxCooldown;
        this.player.quantumEnergy -= ability.energyCost;
        
        // Rewind to previous state
        const rewindFrames = 60 + ability.level * 30;
        const targetIndex = Math.max(0, ability.rewindBuffer.length - rewindFrames);
        const rewindState = ability.rewindBuffer[targetIndex];
        
        if (rewindState) {
            this.player.position = rewindState.position.clone();
            this.player.velocity = rewindState.velocity.clone();
            this.player.lives = Math.max(this.player.lives, rewindState.health);
            this.player.quantumEnergy = Math.max(this.player.quantumEnergy, rewindState.energy);
        }
        
        // Effects
        this.createTimeRewindEffect();
        
        return true;
    }
    
    // Effect management
    addEffect(type, duration, properties) {
        this.activeEffects.push({
            type: type,
            timer: duration,
            properties: properties
        });
    }
    
    removeEffect(effect) {
        // Remove effect logic based on type
        switch (effect.type) {
            case 'speedBoost':
                this.player.maxSpeed = this.player.baseMaxSpeed;
                break;
            case 'jumpBoost':
                this.player.jumpPower = this.player.baseJumpPower;
                break;
        }
    }
    
    removeEffectByType(type) {
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.type === type) {
                this.removeEffect(effect);
                return false;
            }
            return true;
        });
    }
    
    hasEffect(type) {
        return this.activeEffects.some(effect => effect.type === type);
    }
    
    // Upgrade methods
    upgradeAbility(abilityName) {
        const ability = this.abilities[abilityName];
        if (ability && ability.level < ability.maxLevel) {
            ability.level++;
            return true;
        }
        return false;
    }
    
    upgradePassive(upgradeName) {
        const upgrade = this.upgrades[upgradeName];
        if (upgrade && upgrade.level < upgrade.maxLevel) {
            upgrade.level++;
            return true;
        }
        return false;
    }
    
    // Visual effects
    createTimeSlowEffect() {
        if (window.particleSystem) {
            window.particleSystem.createQuantumEffect(
                this.player.position.x + this.player.width / 2,
                this.player.position.y + this.player.height / 2
            );
        }
    }
    
    createPhaseShiftEffect() {
        if (window.particleSystem) {
            for (let i = 0; i < 15; i++) {
                window.particleSystem.addParticle(
                    this.player.position.x + this.player.width / 2,
                    this.player.position.y + this.player.height / 2,
                    {
                        vx: Utils.randomBetween(-4, 4),
                        vy: Utils.randomBetween(-4, 4),
                        life: 60,
                        size: Utils.randomBetween(2, 4),
                        color: '#ff00ff',
                        endColor: '#8800ff',
                        alpha: 0.8,
                        endAlpha: 0,
                        shape: 'circle',
                        gravity: false
                    }
                );
            }
        }
    }
    
    createQuantumDashEffect() {
        if (window.particleSystem) {
            window.particleSystem.createDashTrail(
                this.player.position.x + this.player.width / 2,
                this.player.position.y + this.player.height / 2
            );
        }
    }
    
    createEnergyShieldEffect() {
        if (window.particleSystem) {
            // Shield activation burst
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                
                window.particleSystem.addParticle(
                    this.player.position.x + this.player.width / 2,
                    this.player.position.y + this.player.height / 2,
                    {
                        vx: Math.cos(angle) * 5,
                        vy: Math.sin(angle) * 5,
                        life: 40,
                        size: 3,
                        endSize: 0,
                        color: '#40ff40',
                        alpha: 0.8,
                        endAlpha: 0,
                        shape: 'star',
                        gravity: false
                    }
                );
            }
        }
    }
    
    createTimeRewindEffect() {
        if (window.particleSystem) {
            // Spiral of time particles
            for (let i = 0; i < 30; i++) {
                const angle = (i / 30) * Math.PI * 4;
                const radius = i * 2;
                
                window.particleSystem.addParticle(
                    this.player.position.x + this.player.width / 2 + Math.cos(angle) * radius,
                    this.player.position.y + this.player.height / 2 + Math.sin(angle) * radius,
                    {
                        vx: -Math.cos(angle) * 3,
                        vy: -Math.sin(angle) * 3,
                        life: 80,
                        size: 2,
                        endSize: 0,
                        color: '#8080ff',
                        alpha: 1,
                        endAlpha: 0,
                        shape: 'circle',
                        gravity: false
                    }
                );
            }
        }
        
        Utils.screenShake(8, 400);
    }
    
    // Render shield effect
    renderShieldEffect(ctx, camera) {
        if (!this.hasEffect('energyShield')) return;
        
        const screenX = this.player.position.x - camera.x;
        const screenY = this.player.position.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#40ff40';
        ctx.lineWidth = 3;
        
        const time = Date.now() * 0.01;
        const radius = 30 + Math.sin(time) * 5;
        
        ctx.beginPath();
        ctx.arc(
            screenX + this.player.width / 2,
            screenY + this.player.height / 2,
            radius, 0, Math.PI * 2
        );
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Get upgrade costs
    getUpgradeCost(type, name) {
        const baseCosts = {
            ability: [100, 300, 600, 1000, 1500],
            passive: [50, 150, 300, 500, 800]
        };
        
        const item = this.abilities[name] || this.upgrades[name];
        if (!item) return Infinity;
        
        const costs = baseCosts[type] || baseCosts.ability;
        return costs[item.level] || Infinity;
    }
}