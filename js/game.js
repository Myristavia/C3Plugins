// Quantum Runner - Main Game Engine
class QuantumRunnerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = {
            score: 0,
            currentLevel: 1,
            lives: 3,
            timeRemaining: 300000, // 5 minutes in milliseconds
            gameOver: false,
            paused: false,
            levelComplete: false,
            nextLevel: false,
            timeScale: 1.0,
            mode: 'normal', // normal, challenge, speedrun
            debug: false,
            fps: 60,
            lastCheckpoint: null,
            screenShake: null,
            hitStop: null
        };
        
        // Game systems
        this.inputManager = new InputManager();
        this.physicsWorld = new PhysicsWorld();
        this.levelGenerator = new LevelGenerator();
        this.uiManager = new UIManager();
        
        // Game objects
        this.player = null;
        this.camera = { x: 0, y: 0 };
        this.currentLevel = null;
        this.enemies = [];
        this.powerups = [];
        this.checkpoints = [];
        this.levelExit = null;
        this.enemyProjectiles = [];
        
        // Timing
        this.lastFrameTime = performance.now();
        this.gameTime = 0;
        this.fpsCounter = 0;
        this.fpsTimer = 0;
        
        // Background elements
        this.backgroundParallax = [];
        
        this.initializeGlobalSystems();
        this.setupGameLoop();
    }
    
    initializeGlobalSystems() {
        // Create global systems
        window.particleSystem = new ParticleSystem();
        window.audioManager = new AudioManager();
        window.gameState = this.gameState;
        window.game = this;
        
        // Set up seeded random for consistent generation
        if (!Math.seedrandom) {
            Math.seedrandom = function(seed) {
                const m = 0x80000000;
                const a = 1103515245;
                const c = 12345;
                
                let state = seed ? seed : Math.floor(Math.random() * (m - 1));
                
                Math.random = function() {
                    state = (a * state + c) % m;
                    return state / (m - 1);
                };
            };
        }
    }
    
    setupGameLoop() {
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop(currentTime) {
        // Calculate delta time
        const deltaTime = (currentTime - this.lastFrameTime) / 16.67; // Normalize to 60fps
        this.lastFrameTime = currentTime;
        
        // Apply time scale for slow motion effects
        const scaledDeltaTime = deltaTime * this.gameState.timeScale;
        
        // Update FPS counter
        this.updateFPS(deltaTime);
        
        // Update game
        this.update(scaledDeltaTime);
        
        // Render game
        this.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    updateFPS(deltaTime) {
        this.fpsTimer += deltaTime;
        this.fpsCounter++;
        
        if (this.fpsTimer >= 60) {
            this.gameState.fps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
        }
    }
    
    update(deltaTime) {
        // Update input
        this.inputManager.update();
        
        // Handle UI input
        this.uiManager.handleInput(this.inputManager);
        
        // Don't update game logic if not in game
        if (!this.uiManager.isGameActive() || this.gameState.paused) {
            this.inputManager.clearFrameInputs();
            this.uiManager.update(deltaTime, this.gameState);
            return;
        }
        
        // Update game time
        this.gameTime += deltaTime;
        
        // Update screen effects
        this.updateScreenEffects(deltaTime);
        
        // Update game time remaining (for timed modes)
        if (this.gameState.mode === 'challenge' || this.gameState.mode === 'speedrun') {
            this.gameState.timeRemaining -= deltaTime * 16.67;
            if (this.gameState.timeRemaining <= 0) {
                this.gameOver();
            }
        }
        
        // Update game objects
        if (this.player) {
            this.player.update(deltaTime, this.inputManager, this.physicsWorld);
            
            // Update quantum power manager
            if (this.player.quantumPowerManager) {
                this.player.quantumPowerManager.update(deltaTime);
            }
        }
        
        // Update physics world
        this.physicsWorld.update(deltaTime);
        
        // Update enemies
        this.updateEnemies(deltaTime);
        
        // Update powerups
        this.updatePowerups(deltaTime);
        
        // Update checkpoints
        this.updateCheckpoints(deltaTime);
        
        // Update level exit
        if (this.levelExit) {
            this.levelExit.update(deltaTime);
        }
        
        // Update enemy projectiles
        this.updateEnemyProjectiles(deltaTime);
        
        // Update particle system
        if (window.particleSystem) {
            window.particleSystem.update(deltaTime);
        }
        
        // Update camera
        this.updateCamera(deltaTime);
        
        // Update audio listener position
        if (window.audioManager && this.player) {
            window.audioManager.setListenerPosition(this.player.position.x, this.player.position.y);
        }
        
        // Check level completion
        if (this.gameState.levelComplete) {
            this.completeLevel();
        }
        
        // Check game over
        if (this.player && this.player.lives <= 0) {
            this.gameOver();
        }
        
        // Update UI
        this.uiManager.update(deltaTime, this.gameState);
        
        // Clear frame-specific inputs
        this.inputManager.clearFrameInputs();
    }
    
    updateScreenEffects(deltaTime) {
        // Screen shake
        if (this.gameState.screenShake) {
            this.gameState.screenShake.timer += deltaTime;
            if (this.gameState.screenShake.timer >= this.gameState.screenShake.duration) {
                this.gameState.screenShake = null;
            }
        }
        
        // Hit stop
        if (this.gameState.hitStop) {
            this.gameState.hitStop.timer += deltaTime;
            if (this.gameState.hitStop.timer >= this.gameState.hitStop.duration) {
                this.gameState.hitStop = null;
            }
        }
    }
    
    updateEnemies(deltaTime) {
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(deltaTime, this.player, this.physicsWorld);
            
            // Remove marked enemies
            if (enemy.markForDestroy) {
                return false;
            }
            
            return true;
        });
    }
    
    updatePowerups(deltaTime) {
        this.powerups = this.powerups.filter(powerup => {
            powerup.update(deltaTime, this.player);
            
            // Remove collected powerups
            if (powerup.markForDestroy) {
                // Show notification
                this.uiManager.showPowerupCollected(powerup.type, powerup.value);
                return false;
            }
            
            return true;
        });
    }
    
    updateCheckpoints(deltaTime) {
        for (const checkpoint of this.checkpoints) {
            checkpoint.update(deltaTime);
        }
    }
    
    updateEnemyProjectiles(deltaTime) {
        this.enemyProjectiles = this.enemyProjectiles.filter(projectile => {
            projectile.update(deltaTime, this.physicsWorld);
            return !projectile.dead;
        });
    }
    
    updateCamera(deltaTime) {
        if (!this.player) return;
        
        // Smooth camera following
        const targetX = this.player.position.x - this.canvas.width / 2;
        const targetY = this.player.position.y - this.canvas.height / 2;
        
        // Smooth interpolation
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.05;
        
        // Apply screen shake
        if (this.gameState.screenShake) {
            const shake = this.gameState.screenShake;
            const progress = shake.timer / shake.duration;
            const intensity = shake.intensity * (1 - progress);
            
            this.camera.x += (Math.random() - 0.5) * intensity;
            this.camera.y += (Math.random() - 0.5) * intensity;
        }
        
        // Keep camera in bounds
        if (this.currentLevel) {
            const maxX = this.currentLevel.tiles[0].length * this.levelGenerator.tileSize - this.canvas.width;
            const maxY = this.currentLevel.tiles.length * this.levelGenerator.tileSize - this.canvas.height;
            
            this.camera.x = Utils.clamp(this.camera.x, 0, Math.max(0, maxX));
            this.camera.y = Utils.clamp(this.camera.y, 0, Math.max(0, maxY));
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Don't render game if not in game mode
        if (!this.uiManager.isGameActive()) {
            this.uiManager.renderTransition(this.ctx);
            return;
        }
        
        // Apply hit stop effect
        if (this.gameState.hitStop) {
            this.ctx.save();
            this.ctx.filter = 'contrast(200%) brightness(150%)';
        }
        
        // Render level
        if (this.currentLevel) {
            this.levelGenerator.renderLevel(this.ctx, this.currentLevel, this.camera, this.gameTime);
        }
        
        // Render checkpoints
        for (const checkpoint of this.checkpoints) {
            checkpoint.render(this.ctx, this.camera);
        }
        
        // Render level exit
        if (this.levelExit) {
            this.levelExit.render(this.ctx, this.camera);
        }
        
        // Render powerups
        for (const powerup of this.powerups) {
            powerup.render(this.ctx, this.camera);
        }
        
        // Render enemies
        for (const enemy of this.enemies) {
            enemy.render(this.ctx, this.camera);
        }
        
        // Render enemy projectiles
        for (const projectile of this.enemyProjectiles) {
            projectile.render(this.ctx, this.camera);
        }
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx, this.camera);
            
            // Render quantum effects
            if (this.player.quantumPowerManager) {
                this.player.quantumPowerManager.renderShieldEffect(this.ctx, this.camera);
            }
        }
        
        // Render particles
        if (window.particleSystem) {
            window.particleSystem.render(this.ctx, this.camera);
        }
        
        // Remove hit stop effect
        if (this.gameState.hitStop) {
            this.ctx.restore();
        }
        
        // Render UI elements
        this.uiManager.renderNotifications(this.ctx);
        this.uiManager.renderDebugInfo(this.ctx, this.gameState);
        this.uiManager.renderTransition(this.ctx);
    }
    
    // Game control methods
    start(mode = 'normal') {
        this.gameState.mode = mode;
        this.gameState.paused = false;
        this.gameState.gameOver = false;
        this.gameState.currentLevel = 1;
        this.gameState.score = 0;
        this.gameState.lives = 3;
        
        // Set time limit based on mode
        if (mode === 'challenge') {
            this.gameState.timeRemaining = 180000; // 3 minutes
        } else if (mode === 'speedrun') {
            this.gameState.timeRemaining = 600000; // 10 minutes
        } else {
            this.gameState.timeRemaining = 300000; // 5 minutes
        }
        
        this.loadLevel(1);
        
        // Play game music
        if (window.audioManager) {
            window.audioManager.playMusic('action');
        }
    }
    
    pause() {
        this.gameState.paused = true;
    }
    
    resume() {
        this.gameState.paused = false;
    }
    
    restart() {
        // Reset to last checkpoint or level start
        if (this.gameState.lastCheckpoint) {
            this.player.position.x = this.gameState.lastCheckpoint.x;
            this.player.position.y = this.gameState.lastCheckpoint.y;
            this.player.velocity = new Vector2(0, 0);
            this.player.lives = Math.max(1, this.player.lives);
        } else {
            this.loadLevel(this.gameState.currentLevel);
        }
        
        this.gameState.paused = false;
        this.gameState.gameOver = false;
    }
    
    loadLevel(levelNumber) {
        this.gameState.currentLevel = levelNumber;
        
        // Generate level
        this.currentLevel = this.levelGenerator.generateLevel(levelNumber);
        
        // Convert to physics world
        this.levelGenerator.convertToPhysicsWorld(this.currentLevel, this.physicsWorld);
        
        // Create player
        this.player = new Player(
            this.currentLevel.spawnPoint.x,
            this.currentLevel.spawnPoint.y
        );
        this.player.type = 'player';
        this.player.baseMaxSpeed = this.player.maxSpeed;
        this.player.baseJumpPower = this.player.jumpPower;
        
        // Add quantum power manager
        this.player.quantumPowerManager = new QuantumPowerManager(this.player);
        
        // Add player to physics world
        this.physicsWorld.addBody(this.player);
        
        // Create enemies
        this.enemies = [];
        for (const enemyData of this.currentLevel.enemies) {
            const enemy = new Enemy(enemyData.x, enemyData.y, 24, 24, enemyData.type);
            this.enemies.push(enemy);
            this.physicsWorld.addBody(enemy);
        }
        
        // Create powerups
        this.powerups = [];
        for (const powerupData of this.currentLevel.powerups) {
            const powerup = new Powerup(powerupData.x, powerupData.y, powerupData.type);
            this.powerups.push(powerup);
            this.physicsWorld.addBody(powerup);
        }
        
        // Create checkpoints
        this.checkpoints = [];
        for (const checkpointData of this.currentLevel.checkpoints) {
            const checkpoint = new Checkpoint(checkpointData.x, checkpointData.y);
            this.checkpoints.push(checkpoint);
            this.physicsWorld.addBody(checkpoint);
        }
        
        // Create level exit
        this.levelExit = new LevelExit(
            this.currentLevel.endPoint.x,
            this.currentLevel.endPoint.y
        );
        this.physicsWorld.addBody(this.levelExit);
        
        // Reset projectiles
        this.enemyProjectiles = [];
        
        // Clear particles
        if (window.particleSystem) {
            window.particleSystem.clear();
        }
        
        // Reset camera
        this.camera.x = this.player.position.x - this.canvas.width / 2;
        this.camera.y = this.player.position.y - this.canvas.height / 2;
        
        // Reset game state flags
        this.gameState.levelComplete = false;
        this.gameState.nextLevel = false;
        
        // Show level start notification
        this.uiManager.addNotification(`Level ${levelNumber}`, '#00ffff', 120);
        this.uiManager.addNotification(this.currentLevel.theme.toUpperCase() + ' SECTOR', '#ffff00', 100);
    }
    
    completeLevel() {
        this.gameState.levelComplete = false;
        
        // Calculate bonuses
        const timeBonus = Math.max(0, Math.floor(this.gameState.timeRemaining / 1000) * 10);
        const comboBonus = this.player.combo * 50;
        
        this.gameState.score += timeBonus + comboBonus;
        
        // Show completion UI
        this.uiManager.showLevelComplete(this.gameState.currentLevel, this.gameState.score, timeBonus);
        
        // Load next level after delay
        setTimeout(() => {
            this.gameState.currentLevel++;
            this.loadLevel(this.gameState.currentLevel);
        }, 3000);
    }
    
    gameOver() {
        this.gameState.gameOver = true;
        this.gameState.paused = true;
        
        // Show game over screen
        this.uiManager.showGameOverScreen(this.gameState.score, this.player ? this.player.combo : 0);
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.playSound('death');
        }
        
        // Save stats
        this.saveGameStats();
    }
    
    saveGameStats() {
        const stats = Utils.loadData('gameStats', {
            totalScore: 0,
            gamesPlayed: 0,
            levelsCompleted: 0,
            bestCombo: 0,
            totalPlayTime: 0
        });
        
        stats.totalScore += this.gameState.score;
        stats.gamesPlayed++;
        stats.levelsCompleted += this.gameState.currentLevel - 1;
        
        if (this.player) {
            stats.bestCombo = Math.max(stats.bestCombo, this.player.combo);
        }
        
        stats.totalPlayTime += this.gameTime / 60; // Convert to seconds
        
        Utils.saveData('gameStats', stats);
    }
    
    // Public API for external access
    getGameState() {
        return this.gameState;
    }
    
    getPlayer() {
        return this.player;
    }
    
    getEnemies() {
        return this.enemies;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quantumRunner = new QuantumRunnerGame();
    
    // Add some helpful global functions
    window.debugGame = () => {
        if (window.quantumRunner) {
            window.quantumRunner.gameState.debug = !window.quantumRunner.gameState.debug;
        }
    };
    
    window.skipLevel = () => {
        if (window.quantumRunner && window.quantumRunner.gameState) {
            window.quantumRunner.gameState.levelComplete = true;
        }
    };
    
    window.addLife = () => {
        if (window.quantumRunner && window.quantumRunner.player) {
            window.quantumRunner.player.lives++;
        }
    };
    
    window.addEnergy = () => {
        if (window.quantumRunner && window.quantumRunner.player) {
            window.quantumRunner.player.quantumEnergy = window.quantumRunner.player.maxQuantumEnergy;
        }
    };
    
    console.log('🎮 Quantum Runner initialized!');
    console.log('Available debug commands:');
    console.log('- debugGame() - Toggle debug mode');
    console.log('- skipLevel() - Skip current level');
    console.log('- addLife() - Add extra life');
    console.log('- addEnergy() - Restore quantum energy');
});