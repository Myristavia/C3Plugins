// Quantum Runner - UI System
class UIManager {
    constructor() {
        this.activeScreen = 'menu';
        this.previousScreen = null;
        this.transitionTimer = 0;
        this.transitionDuration = 30;
        this.isTransitioning = false;
        
        this.hudElements = {};
        this.menuElements = {};
        this.notifications = [];
        
        this.setupEventListeners();
        this.initializeElements();
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('challengeBtn').addEventListener('click', () => {
            this.showChallengeMode();
        });
        
        document.getElementById('speedrunBtn').addEventListener('click', () => {
            this.showSpeedrunMode();
        });
        
        document.getElementById('upgradesBtn').addEventListener('click', () => {
            this.showUpgradesScreen();
        });
        
        document.getElementById('controlsBtn').addEventListener('click', () => {
            this.showControls();
        });
        
        document.getElementById('controlsBackBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Game over buttons
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('upgradeBtn').addEventListener('click', () => {
            this.showUpgradesScreen();
        });
        
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Pause buttons
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('pauseMenuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
    }
    
    initializeElements() {
        // HUD elements
        this.hudElements = {
            score: document.getElementById('scoreValue'),
            lives: document.getElementById('livesValue'),
            energyBar: document.getElementById('energyBar'),
            combo: document.getElementById('comboValue'),
            powerLevel: document.getElementById('powerLevel')
        };
    }
    
    update(deltaTime, gameState) {
        // Update HUD
        this.updateHUD(gameState);
        
        // Update notifications
        this.updateNotifications(deltaTime);
        
        // Update transitions
        this.updateTransitions(deltaTime);
    }
    
    updateHUD(gameState) {
        if (!gameState || this.activeScreen !== 'game') return;
        
        // Update score with formatting
        if (this.hudElements.score) {
            this.hudElements.score.textContent = Utils.formatScore(gameState.score);
        }
        
        // Update lives
        if (this.hudElements.lives && gameState.player) {
            this.hudElements.lives.textContent = gameState.player.lives;
        }
        
        // Update energy bar
        if (this.hudElements.energyBar && gameState.player) {
            const energyPercent = (gameState.player.quantumEnergy / gameState.player.maxQuantumEnergy) * 100;
            this.hudElements.energyBar.style.width = energyPercent + '%';
            
            // Color based on energy level
            if (energyPercent > 70) {
                this.hudElements.energyBar.style.background = 'linear-gradient(90deg, #00ff40, #80ff80)';
            } else if (energyPercent > 30) {
                this.hudElements.energyBar.style.background = 'linear-gradient(90deg, #ffff00, #ffff80)';
            } else {
                this.hudElements.energyBar.style.background = 'linear-gradient(90deg, #ff0040, #ff4080)';
            }
        }
        
        // Update combo
        if (this.hudElements.combo && gameState.player) {
            this.hudElements.combo.textContent = gameState.player.combo;
            
            // Pulse effect for high combos
            if (gameState.player.combo > 10) {
                this.hudElements.combo.style.transform = 'scale(' + (1 + Math.sin(Date.now() * 0.01) * 0.1) + ')';
                this.hudElements.combo.style.color = '#ffff00';
            } else {
                this.hudElements.combo.style.transform = 'scale(1)';
                this.hudElements.combo.style.color = '#ffffff';
            }
        }
        
        // Update power level
        if (this.hudElements.powerLevel && gameState.player && gameState.player.quantumPowerManager) {
            const totalPowerLevel = this.calculateTotalPowerLevel(gameState.player.quantumPowerManager);
            this.hudElements.powerLevel.textContent = totalPowerLevel;
        }
    }
    
    calculateTotalPowerLevel(powerManager) {
        let total = 0;
        
        // Add ability levels
        for (const ability of Object.values(powerManager.abilities)) {
            total += ability.level;
        }
        
        // Add upgrade levels
        for (const upgrade of Object.values(powerManager.upgrades)) {
            total += upgrade.level;
        }
        
        return total;
    }
    
    updateNotifications(deltaTime) {
        this.notifications = this.notifications.filter(notification => {
            notification.timer -= deltaTime;
            notification.y -= 1; // Float upward
            notification.alpha = Math.max(0, notification.timer / notification.duration);
            
            return notification.timer > 0;
        });
    }
    
    updateTransitions(deltaTime) {
        if (this.isTransitioning) {
            this.transitionTimer += deltaTime;
            
            if (this.transitionTimer >= this.transitionDuration) {
                this.isTransitioning = false;
                this.transitionTimer = 0;
            }
        }
    }
    
    // Screen management
    showScreen(screenName) {
        if (this.isTransitioning) return;
        
        this.previousScreen = this.activeScreen;
        this.activeScreen = screenName;
        this.isTransitioning = true;
        
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Special handling for game screen
        if (screenName === 'game') {
            this.showGameHUD();
        } else {
            this.hideGameHUD();
        }
    }
    
    showMainMenu() {
        this.showScreen('menu');
        
        // Stop game if running
        if (window.game) {
            window.game.pause();
        }
        
        // Play menu music
        if (window.audioManager) {
            window.audioManager.playMusic('theme');
        }
    }
    
    showControls() {
        this.showScreen('controlsScreen');
    }
    
    showGameOverScreen(finalScore, bestCombo) {
        this.showScreen('gameOverScreen');
        
        // Update final score display
        document.getElementById('finalScore').textContent = `Final Score: ${Utils.formatScore(finalScore)}`;
        document.getElementById('bestCombo').textContent = `Best Combo: ${bestCombo}`;
        
        // Save high score
        this.saveHighScore(finalScore);
    }
    
    showPauseScreen() {
        this.showScreen('pauseScreen');
    }
    
    showUpgradesScreen() {
        // This would show a detailed upgrade screen
        // For now, just show a placeholder
        this.addNotification('Upgrades system coming soon!', '#ffff00');
    }
    
    showChallengeMode() {
        this.addNotification('Daily Challenge: Speed Run Mode!', '#ff00ff');
        this.startGame('challenge');
    }
    
    showSpeedrunMode() {
        this.addNotification('Speedrun Mode: Beat your best time!', '#00ffff');
        this.startGame('speedrun');
    }
    
    showGameHUD() {
        const hud = document.getElementById('hud');
        const powerIndicator = document.getElementById('powerIndicator');
        
        if (hud) hud.style.display = 'flex';
        if (powerIndicator) powerIndicator.style.display = 'block';
    }
    
    hideGameHUD() {
        const hud = document.getElementById('hud');
        const powerIndicator = document.getElementById('powerIndicator');
        
        if (hud) hud.style.display = 'none';
        if (powerIndicator) powerIndicator.style.display = 'none';
    }
    
    // Game control methods
    startGame(mode = 'normal') {
        this.showScreen('game');
        
        // Initialize game
        if (window.game) {
            window.game.start(mode);
        }
        
        // Play game music
        if (window.audioManager) {
            window.audioManager.playMusic('action');
        }
        
        // Resume audio context if needed
        if (window.audioManager) {
            window.audioManager.resumeContext();
        }
    }
    
    restartLevel() {
        if (window.game) {
            window.game.restart();
        }
        this.showScreen('game');
    }
    
    resumeGame() {
        if (window.game) {
            window.game.resume();
        }
        this.showScreen('game');
    }
    
    pauseGame() {
        if (window.game) {
            window.game.pause();
        }
        this.showPauseScreen();
    }
    
    // Notification system
    addNotification(text, color = '#ffffff', duration = 180) {
        this.notifications.push({
            text: text,
            color: color,
            duration: duration,
            timer: duration,
            x: window.innerWidth / 2,
            y: 100,
            alpha: 1
        });
    }
    
    showLevelComplete(levelNumber, score, timeBonus) {
        this.addNotification(`Level ${levelNumber} Complete!`, '#00ff00', 240);
        this.addNotification(`Score: ${Utils.formatScore(score)}`, '#ffff00', 200);
        
        if (timeBonus > 0) {
            this.addNotification(`Time Bonus: ${Utils.formatScore(timeBonus)}`, '#00ffff', 180);
        }
    }
    
    showPowerupCollected(powerupType, value) {
        const messages = {
            energy: `+${value} Quantum Energy`,
            life: 'Extra Life!',
            speedBoost: 'Speed Boost!',
            shield: 'Energy Shield!',
            timeExtender: `+${value}s Time`,
            combo: `+${value} Combo`
        };
        
        const colors = {
            energy: '#00ffff',
            life: '#ff0040',
            speedBoost: '#ffff00',
            shield: '#40ff40',
            timeExtender: '#ff8040',
            combo: '#ff40ff'
        };
        
        this.addNotification(
            messages[powerupType] || 'Power Up!',
            colors[powerupType] || '#ffffff',
            120
        );
    }
    
    showComboMessage(combo) {
        if (combo >= 50) {
            this.addNotification('LEGENDARY COMBO!', '#ff00ff', 180);
        } else if (combo >= 25) {
            this.addNotification('AMAZING COMBO!', '#ffff00', 150);
        } else if (combo >= 10) {
            this.addNotification('GREAT COMBO!', '#ff8800', 120);
        } else if (combo >= 5) {
            this.addNotification('Nice Combo!', '#00ff00', 100);
        }
    }
    
    // High score management
    saveHighScore(score) {
        const currentHigh = Utils.loadData('highScore', 0);
        if (score > currentHigh) {
            Utils.saveData('highScore', score);
            this.addNotification('NEW HIGH SCORE!', '#ff00ff', 300);
            return true;
        }
        return false;
    }
    
    getHighScore() {
        return Utils.loadData('highScore', 0);
    }
    
    // Render methods
    renderNotifications(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px Orbitron';
        
        for (const notification of this.notifications) {
            ctx.save();
            ctx.globalAlpha = notification.alpha;
            ctx.fillStyle = notification.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            // Outline
            ctx.strokeText(notification.text, notification.x, notification.y);
            // Fill
            ctx.fillText(notification.text, notification.x, notification.y);
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    renderTransition(ctx) {
        if (!this.isTransitioning) return;
        
        ctx.save();
        
        const progress = this.transitionTimer / this.transitionDuration;
        const alpha = Math.sin(progress * Math.PI);
        
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.restore();
    }
    
    renderDebugInfo(ctx, gameState) {
        if (!gameState || !gameState.debug) return;
        
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        const debugLines = [
            `FPS: ${Math.round(gameState.fps)}`,
            `Player: (${Math.round(gameState.player.position.x)}, ${Math.round(gameState.player.position.y)})`,
            `Velocity: (${Math.round(gameState.player.velocity.x)}, ${Math.round(gameState.player.velocity.y)})`,
            `Grounded: ${gameState.player.grounded}`,
            `On Wall: ${gameState.player.onWall}`,
            `Energy: ${Math.round(gameState.player.quantumEnergy)}/${gameState.player.maxQuantumEnergy}`,
            `Particles: ${window.particleSystem ? window.particleSystem.particles.length : 0}`,
            `Enemies: ${gameState.enemies ? gameState.enemies.length : 0}`
        ];
        
        for (let i = 0; i < debugLines.length; i++) {
            ctx.fillText(debugLines[i], 10, ctx.canvas.height - 120 + i * 15);
        }
        
        ctx.restore();
    }
    
    // Input handling for UI
    handleInput(input) {
        // ESC key handling
        if (input.isPausePressed()) {
            if (this.activeScreen === 'game') {
                this.pauseGame();
            } else if (this.activeScreen === 'pauseScreen') {
                this.resumeGame();
            }
        }
        
        // Debug toggle
        if (input.isKeyJustPressed('KeyF1')) {
            if (window.gameState) {
                window.gameState.debug = !window.gameState.debug;
            }
        }
    }
    
    // Utility methods
    isGameActive() {
        return this.activeScreen === 'game';
    }
    
    isMenuActive() {
        return this.activeScreen === 'menu';
    }
    
    getCurrentScreen() {
        return this.activeScreen;
    }
}