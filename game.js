// Crystal Velocity - The Ultimate 2D Platformer
// Main Game Engine

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.crystals = 0;
        this.level = 1;
        this.achievements = [];
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameSpeed = 1;
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            shake: { x: 0, y: 0, intensity: 0 }
        };
        
        // Input system
        this.keys = {};
        this.setupInput();
        
        // Game objects
        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.particles = [];
        this.backgrounds = [];
        
        // Level data
        this.currentLevel = null;
        this.levelProgress = 0;
        
        // Initialize addictive features
        this.addictiveFeatures = new AddictiveFeatures(this);
        
        // Initialize systems
        this.initializeGame();
        this.showMenu();
    }
    
    setupInput() {
        const keyMap = {
            'KeyW': 'up', 'ArrowUp': 'up',
            'KeyS': 'down', 'ArrowDown': 'down',
            'KeyA': 'left', 'ArrowLeft': 'left',
            'KeyD': 'right', 'ArrowRight': 'right',
            'Space': 'jump',
            'ShiftLeft': 'dash', 'ShiftRight': 'dash',
            'KeyZ': 'special',
            'KeyP': 'pause'
        };
        
        document.addEventListener('keydown', (e) => {
            const action = keyMap[e.code];
            if (action) {
                this.keys[action] = true;
                e.preventDefault();
                
                // Handle pause
                if (action === 'pause' && this.gameState === 'playing') {
                    this.pauseGame();
                } else if (action === 'pause' && this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const action = keyMap[e.code];
            if (action) {
                this.keys[action] = false;
                e.preventDefault();
            }
        });
    }
    
    initializeGame() {
        // Initialize player
        this.player = new Player(100, this.height - 200, this);
        
        // Create first level
        this.generateLevel(1);
        
        // Start background music simulation
        this.startBackgroundMusic();
    }
    
    generateLevel(levelNum) {
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.backgrounds = [];
        
        // Generate platforms
        this.generatePlatforms(levelNum);
        
        // Generate enemies
        this.generateEnemies(levelNum);
        
        // Generate collectibles
        this.generateCollectibles(levelNum);
        
        // Generate background elements
        this.generateBackground(levelNum);
        
        this.currentLevel = levelNum;
    }
    
    generatePlatforms(levelNum) {
        // Ground platforms
        for (let x = 0; x < 5000; x += 64) {
            this.platforms.push(new Platform(x, this.height - 64, 64, 64, 'ground'));
        }
        
        // Floating platforms with increasing complexity
        const platformCount = 20 + levelNum * 5;
        for (let i = 0; i < platformCount; i++) {
            const x = 200 + i * 150 + Math.random() * 100;
            const y = this.height - 200 - Math.random() * 400;
            const width = 80 + Math.random() * 120;
            const type = Math.random() < 0.3 ? 'moving' : 'static';
            
            this.platforms.push(new Platform(x, y, width, 20, type));
        }
        
        // Special platforms
        this.addSpecialPlatforms(levelNum);
    }
    
    addSpecialPlatforms(levelNum) {
        // Jump pads
        for (let i = 0; i < 5; i++) {
            const x = 300 + i * 600;
            const y = this.height - 64 - 20;
            this.platforms.push(new Platform(x, y, 60, 20, 'jumpPad'));
        }
        
        // Breakable blocks
        for (let i = 0; i < 10; i++) {
            const x = 400 + i * 300;
            const y = this.height - 200 - Math.random() * 200;
            this.platforms.push(new Platform(x, y, 40, 40, 'breakable'));
        }
    }
    
    generateEnemies(levelNum) {
        const enemyCount = 15 + levelNum * 3;
        const enemyTypes = ['walker', 'jumper', 'flyer', 'spiker'];
        
        for (let i = 0; i < enemyCount; i++) {
            const x = 300 + i * 200 + Math.random() * 100;
            const y = this.height - 200;
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            this.enemies.push(new Enemy(x, y, type, this));
        }
    }
    
    generateCollectibles(levelNum) {
        // Crystals
        for (let i = 0; i < 100; i++) {
            const x = 150 + i * 45 + Math.random() * 30;
            const y = this.height - 150 - Math.random() * 400;
            this.collectibles.push(new Crystal(x, y));
        }
        
        // Power-ups
        const powerUpTypes = ['speed', 'jump', 'dash', 'shield', 'doubleScore'];
        for (let i = 0; i < 8; i++) {
            const x = 500 + i * 400;
            const y = this.height - 200 - Math.random() * 200;
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            this.collectibles.push(new PowerUp(x, y, type));
        }
    }
    
    generateBackground(levelNum) {
        // Parallax layers
        for (let layer = 0; layer < 5; layer++) {
            for (let x = 0; x < 6000; x += 200) {
                this.backgrounds.push(new BackgroundElement(x, layer * 100, layer));
            }
        }
    }
    
    startGame() {
        this.hideMenu();
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.crystals = 0;
        this.level = 1;
        this.player.reset();
        this.generateLevel(1);
        this.updateHUD();
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update();
            this.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // Update player
        this.player.update(this.deltaTime);
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(this.deltaTime));
        
        // Update platforms
        this.platforms.forEach(platform => platform.update(this.deltaTime));
        
        // Update collectibles
        this.collectibles.forEach(collectible => collectible.update(this.deltaTime));
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update(this.deltaTime);
            return particle.life > 0;
        });
        
        // Update addictive features
        this.addictiveFeatures.update(this.deltaTime);
        
        // Update camera
        this.updateCamera();
        
        // Check collisions
        this.checkCollisions();
        
        // Update level progress
        this.updateLevelProgress();
        
        // Check win/lose conditions
        this.checkGameConditions();
    }
    
    updateCamera() {
        // Smooth camera follow
        this.camera.targetX = this.player.x - this.width / 2;
        this.camera.targetY = this.player.y - this.height / 2;
        
        this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
        this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;
        
        // Camera shake
        if (this.camera.shake.intensity > 0) {
            this.camera.shake.x = (Math.random() - 0.5) * this.camera.shake.intensity;
            this.camera.shake.y = (Math.random() - 0.5) * this.camera.shake.intensity;
            this.camera.shake.intensity *= 0.9;
        }
        
        // Keep camera in bounds
        this.camera.x = Math.max(0, this.camera.x);
        this.camera.y = Math.max(-200, Math.min(0, this.camera.y));
    }
    
    checkCollisions() {
        // Player vs Platforms
        this.platforms.forEach(platform => {
            if (this.player.checkCollision(platform)) {
                this.player.handlePlatformCollision(platform);
            }
        });
        
        // Player vs Enemies
        this.enemies.forEach((enemy, index) => {
            if (this.player.checkCollision(enemy) && !this.player.invulnerable) {
                if (this.player.velocityY > 0 && this.player.y < enemy.y) {
                    // Player jumped on enemy
                    this.destroyEnemy(index);
                    this.player.velocityY = -400;
                    this.addScore(100);
                    this.addScreenShake(5);
                } else {
                    // Player hit by enemy
                    this.player.takeDamage();
                    this.lives--;
                    this.updateHUD();
                    this.addScreenShake(10);
                }
            }
        });
        
        // Player vs Collectibles
        this.collectibles.forEach((collectible, index) => {
            if (this.player.checkCollision(collectible)) {
                this.collectItem(collectible, index);
            }
        });
    }
    
    collectItem(collectible, index) {
        if (collectible.type === 'crystal') {
            this.crystals++;
            this.addScore(50);
            this.createParticleExplosion(collectible.x, collectible.y, '#00ffff');
            this.addictiveFeatures.onCrystalCollected();
        } else if (collectible.type === 'powerUp') {
            this.player.applyPowerUp(collectible.powerType);
            this.addScore(200);
            this.createParticleExplosion(collectible.x, collectible.y, '#ffff00');
            this.addictiveFeatures.onPowerUpCollected();
        }
        
        this.collectibles.splice(index, 1);
        this.updateHUD();
        this.checkAchievements();
    }
    
    destroyEnemy(index) {
        const enemy = this.enemies[index];
        this.createParticleExplosion(enemy.x, enemy.y, '#ff0000');
        this.enemies.splice(index, 1);
        this.addictiveFeatures.onEnemyDefeated();
    }
    
    addScreenShake(intensity) {
        this.camera.shake.intensity = intensity;
    }
    
    createParticleExplosion(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    updateLevelProgress() {
        this.levelProgress = Math.min(100, (this.player.x / 4000) * 100);
        document.getElementById('progressFill').style.width = this.levelProgress + '%';
        
        if (this.levelProgress >= 100) {
            this.nextLevel();
        }
    }
    
    nextLevel() {
        this.level++;
        this.generateLevel(this.level);
        this.player.x = 100;
        this.player.y = this.height - 200;
        this.addScore(1000);
        this.showAchievement(`Level ${this.level} Complete!`);
    }
    
    checkGameConditions() {
        if (this.lives <= 0) {
            this.gameOver();
        }
        
        if (this.player.y > this.height + 100) {
            this.player.takeDamage();
            this.lives--;
            this.updateHUD();
            this.player.respawn();
        }
    }
    
    checkAchievements() {
        // Speed demon achievement
        if (Math.abs(this.player.velocityX) > 500 && !this.achievements.includes('speedDemon')) {
            this.achievements.push('speedDemon');
            this.showAchievement('Speed Demon!');
        }
        
        // Crystal collector
        if (this.crystals >= 50 && !this.achievements.includes('crystalCollector')) {
            this.achievements.push('crystalCollector');
            this.showAchievement('Crystal Collector!');
        }
        
        // Score milestones
        if (this.score >= 10000 && !this.achievements.includes('scoreHunter')) {
            this.achievements.push('scoreHunter');
            this.showAchievement('Score Hunter!');
        }
    }
    
    showAchievement(text) {
        const achievement = document.getElementById('achievement');
        const achievementText = document.getElementById('achievementText');
        achievementText.textContent = text;
        achievement.classList.add('show');
        
        setTimeout(() => {
            achievement.classList.remove('show');
        }, 3000);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x + this.camera.shake.x, -this.camera.y + this.camera.shake.y);
        
        // Render background layers (parallax)
        this.backgrounds.forEach(bg => bg.render(this.ctx, this.camera));
        
        // Render platforms
        this.platforms.forEach(platform => platform.render(this.ctx));
        
        // Render collectibles
        this.collectibles.forEach(collectible => collectible.render(this.ctx));
        
        // Render enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Render player
        this.player.render(this.ctx);
        
        // Render particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Restore context
        this.ctx.restore();
    }
    
    addScore(points) {
        this.score += points;
        this.updateHUD();
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('crystals').textContent = this.crystals;
    }
    
    showMenu() {
        document.getElementById('mainMenu').style.display = 'block';
    }
    
    hideMenu() {
        document.getElementById('mainMenu').style.display = 'none';
    }
    
    pauseGame() {
        this.gameState = 'paused';
        // Show pause menu
    }
    
    resumeGame() {
        this.gameState = 'playing';
        // Hide pause menu
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.addictiveFeatures.updateLeaderboard(this.score);
        // Show game over screen and restart option
        setTimeout(() => {
            this.showMenu();
        }, 2000);
    }
    
    startBackgroundMusic() {
        // Simulate dynamic background music
        // In a real implementation, you'd use Web Audio API
        console.log('🎵 Epic background music playing...');
    }
    
    showSettings() {
        console.log('Settings menu - coming soon!');
    }
    
    showLeaderboard() {
        console.log('Leaderboard - coming soon!');
    }
}

// Initialize game when page loads
const game = new Game();