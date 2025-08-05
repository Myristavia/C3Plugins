// Addictive Features System - Achievements, Combos, Leaderboards, Daily Challenges

class AddictiveFeatures {
    constructor(game) {
        this.game = game;
        
        // Achievement system
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        this.achievementQueue = [];
        
        // Combo system
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeLimit = 3000; // 3 seconds
        this.comboMultiplier = 1;
        
        // Score streaks
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.streakTypes = {
            crystal: 0,
            enemy: 0,
            perfect: 0
        };
        
        // Leaderboard
        this.leaderboard = this.loadLeaderboard();
        this.personalBest = this.loadPersonalBest();
        
        // Daily challenges
        this.dailyChallenges = [];
        this.completedChallenges = new Set();
        this.challengeProgress = new Map();
        
        // Progression system
        this.playerLevel = 1;
        this.experience = 0;
        this.experienceToNextLevel = 1000;
        this.skillPoints = 0;
        this.unlockedAbilities = new Set();
        
        // Session statistics
        this.sessionStats = {
            startTime: Date.now(),
            crystalsCollected: 0,
            enemiesDefeated: 0,
            distanceTraveled: 0,
            jumpsPerformed: 0,
            dashesUsed: 0,
            perfectLandings: 0,
            powerUpsCollected: 0
        };
        
        // Time-based bonuses
        this.timeBonus = {
            speedRun: { active: false, startTime: 0, targetTime: 60000 },
            marathon: { active: false, startTime: 0, targetTime: 300000 }
        };
        
        this.initializeAchievements();
        this.generateDailyChallenges();
    }
    
    initializeAchievements() {
        const achievementData = [
            // Movement achievements
            { id: 'first_jump', name: 'Getting Airborne', description: 'Perform your first jump', icon: '🦘', xp: 50 },
            { id: 'double_jump_master', name: 'Sky Walker', description: 'Perform 100 double jumps', icon: '🌤️', xp: 200, target: 100 },
            { id: 'wall_jump_pro', name: 'Wall Crawler', description: 'Perform 50 wall jumps', icon: '🧗', xp: 250, target: 50 },
            { id: 'dash_demon', name: 'Speed Demon', description: 'Use dash 200 times', icon: '⚡', xp: 300, target: 200 },
            
            // Combat achievements
            { id: 'first_kill', name: 'First Blood', description: 'Defeat your first enemy', icon: '⚔️', xp: 100 },
            { id: 'enemy_slayer', name: 'Enemy Slayer', description: 'Defeat 100 enemies', icon: '🗡️', xp: 500, target: 100 },
            { id: 'combo_king', name: 'Combo King', description: 'Achieve a 20x combo', icon: '🔥', xp: 400, target: 20 },
            { id: 'perfect_run', name: 'Untouchable', description: 'Complete a level without taking damage', icon: '🛡️', xp: 600 },
            
            // Collection achievements
            { id: 'crystal_collector', name: 'Crystal Collector', description: 'Collect 500 crystals', icon: '💎', xp: 300, target: 500 },
            { id: 'power_hungry', name: 'Power Hungry', description: 'Collect 50 power-ups', icon: '⭐', xp: 400, target: 50 },
            { id: 'completionist', name: 'Completionist', description: 'Collect all crystals in a level', icon: '🏆', xp: 800 },
            
            // Score achievements
            { id: 'high_scorer', name: 'High Scorer', description: 'Reach 50,000 points', icon: '📊', xp: 500, target: 50000 },
            { id: 'score_master', name: 'Score Master', description: 'Reach 100,000 points', icon: '👑', xp: 1000, target: 100000 },
            
            // Special achievements
            { id: 'speed_runner', name: 'Speed Runner', description: 'Complete a level in under 60 seconds', icon: '🏃', xp: 600 },
            { id: 'marathon_runner', name: 'Marathon Runner', description: 'Play for 30 minutes straight', icon: '🏃‍♀️', xp: 400 },
            { id: 'persistence', name: 'Never Give Up', description: 'Die 50 times', icon: '💪', xp: 200, target: 50 },
            { id: 'explorer', name: 'Explorer', description: 'Travel 10,000 pixels', icon: '🗺️', xp: 300, target: 10000 }
        ];
        
        achievementData.forEach(ach => {
            this.achievements.set(ach.id, {
                ...ach,
                progress: 0,
                unlocked: false,
                unlockedAt: null
            });
        });
    }
    
    generateDailyChallenges() {
        const challenges = [
            { id: 'crystal_rush', name: 'Crystal Rush', description: 'Collect 100 crystals', target: 100, reward: 500, type: 'crystals' },
            { id: 'enemy_hunt', name: 'Enemy Hunt', description: 'Defeat 25 enemies', target: 25, reward: 400, type: 'enemies' },
            { id: 'combo_challenge', name: 'Combo Challenge', description: 'Achieve a 15x combo', target: 15, reward: 600, type: 'combo' },
            { id: 'speed_challenge', name: 'Speed Challenge', description: 'Complete 3 levels under par time', target: 3, reward: 800, type: 'speed' },
            { id: 'perfect_play', name: 'Perfect Play', description: 'Complete a level without dying', target: 1, reward: 700, type: 'perfect' }
        ];
        
        // Select 3 random challenges for today
        const today = new Date().toDateString();
        const savedChallenges = localStorage.getItem(`dailyChallenges_${today}`);
        
        if (savedChallenges) {
            this.dailyChallenges = JSON.parse(savedChallenges);
        } else {
            const shuffled = challenges.sort(() => 0.5 - Math.random());
            this.dailyChallenges = shuffled.slice(0, 3);
            localStorage.setItem(`dailyChallenges_${today}`, JSON.stringify(this.dailyChallenges));
        }
        
        // Initialize progress tracking
        this.dailyChallenges.forEach(challenge => {
            this.challengeProgress.set(challenge.id, 0);
        });
    }
    
    // Combo System
    addToCombo(type = 'general', points = 100) {
        this.combo++;
        this.comboTimer = this.comboTimeLimit;
        
        // Update max combo
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // Calculate multiplier
        this.comboMultiplier = Math.min(1 + (this.combo * 0.1), 5); // Max 5x multiplier
        
        // Award bonus points
        const bonusPoints = Math.floor(points * this.comboMultiplier);
        this.game.addScore(bonusPoints - points); // Add only the bonus part
        
        // Check combo achievements
        this.checkAchievement('combo_king', this.combo);
        
        // Visual feedback
        this.showComboText();
        
        return bonusPoints;
    }
    
    breakCombo() {
        if (this.combo > 0) {
            this.combo = 0;
            this.comboMultiplier = 1;
            this.hideComboText();
        }
    }
    
    updateCombo(deltaTime) {
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.breakCombo();
            }
        }
    }
    
    showComboText() {
        if (this.combo < 2) return;
        
        // Create floating combo text
        const comboElement = document.createElement('div');
        comboElement.style.cssText = `
            position: fixed;
            top: 100px;
            right: 50px;
            color: #ff0080;
            font-family: 'Orbitron', monospace;
            font-size: ${20 + this.combo}px;
            font-weight: 900;
            text-shadow: 0 0 20px #ff0080;
            z-index: 1000;
            pointer-events: none;
            animation: comboFadeIn 0.5s ease-out;
        `;
        comboElement.textContent = `${this.combo}x COMBO!`;
        document.body.appendChild(comboElement);
        
        setTimeout(() => {
            if (comboElement.parentNode) {
                comboElement.parentNode.removeChild(comboElement);
            }
        }, 2000);
        
        // Add combo fade animation
        if (!document.getElementById('comboStyles')) {
            const style = document.createElement('style');
            style.id = 'comboStyles';
            style.textContent = `
                @keyframes comboFadeIn {
                    0% { transform: scale(0.5) translateY(50px); opacity: 0; }
                    50% { transform: scale(1.2) translateY(-10px); opacity: 1; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    hideComboText() {
        // Remove existing combo elements
        const comboElements = document.querySelectorAll('[style*="COMBO"]');
        comboElements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }
    
    // Achievement System
    checkAchievement(achievementId, value = 1) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        if (achievement.target) {
            achievement.progress = Math.min(achievement.progress + value, achievement.target);
            if (achievement.progress >= achievement.target) {
                this.unlockAchievement(achievementId);
            }
        } else {
            this.unlockAchievement(achievementId);
        }
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.unlockedAchievements.add(achievementId);
        
        // Award experience
        this.addExperience(achievement.xp);
        
        // Show achievement notification
        this.showAchievementNotification(achievement);
        
        // Save to localStorage
        this.saveAchievements();
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ffd700, #ffaa00);
            color: #000;
            padding: 20px 30px;
            border-radius: 15px;
            border: 3px solid #ffff00;
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            z-index: 2000;
            text-align: center;
            animation: achievementPop 3s ease-out forwards;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 10px;">${achievement.icon}</div>
            <div style="font-size: 20px; margin-bottom: 5px;">ACHIEVEMENT UNLOCKED!</div>
            <div style="font-size: 16px; color: #444;">${achievement.name}</div>
            <div style="font-size: 14px; color: #666; margin-top: 5px;">${achievement.description}</div>
            <div style="font-size: 14px; color: #888; margin-top: 5px;">+${achievement.xp} XP</div>
        `;
        
        document.body.appendChild(notification);
        
        // Add achievement animation
        if (!document.getElementById('achievementStyles')) {
            const style = document.createElement('style');
            style.id = 'achievementStyles';
            style.textContent = `
                @keyframes achievementPop {
                    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                    20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    25% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    90% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Experience and Leveling System
    addExperience(amount) {
        this.experience += amount;
        
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
        
        this.updateHUD();
    }
    
    levelUp() {
        this.experience -= this.experienceToNextLevel;
        this.playerLevel++;
        this.skillPoints++;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        
        // Show level up notification
        this.showLevelUpNotification();
        
        // Unlock new abilities
        this.unlockAbilitiesForLevel(this.playerLevel);
    }
    
    showLevelUpNotification() {
        this.game.showAchievement(`LEVEL UP! Level ${this.playerLevel}`);
        this.game.addScreenShake(10);
        
        // Create celebration particles
        for (let i = 0; i < 50; i++) {
            this.game.particles.push(new Particle(
                this.game.player.x + this.game.player.width/2,
                this.game.player.y + this.game.player.height/2,
                '#ffd700',
                { speed: 300, life: 2000, gravity: -100 }
            ));
        }
    }
    
    unlockAbilitiesForLevel(level) {
        const abilities = {
            5: 'enhanced_jump',
            10: 'dash_trail',
            15: 'magnetic_crystals',
            20: 'damage_resistance',
            25: 'score_multiplier'
        };
        
        if (abilities[level]) {
            this.unlockedAbilities.add(abilities[level]);
            this.game.showAchievement(`New Ability: ${abilities[level].replace('_', ' ').toUpperCase()}`);
        }
    }
    
    // Daily Challenges
    updateChallengeProgress(type, amount = 1) {
        this.dailyChallenges.forEach(challenge => {
            if (challenge.type === type && !this.completedChallenges.has(challenge.id)) {
                const currentProgress = this.challengeProgress.get(challenge.id) || 0;
                const newProgress = Math.min(currentProgress + amount, challenge.target);
                this.challengeProgress.set(challenge.id, newProgress);
                
                if (newProgress >= challenge.target) {
                    this.completeChallenge(challenge);
                }
            }
        });
    }
    
    completeChallenge(challenge) {
        if (this.completedChallenges.has(challenge.id)) return;
        
        this.completedChallenges.add(challenge.id);
        this.addExperience(challenge.reward);
        this.game.showAchievement(`Challenge Complete: ${challenge.name} (+${challenge.reward} XP)`);
        
        // Save progress
        const today = new Date().toDateString();
        localStorage.setItem(`completedChallenges_${today}`, JSON.stringify([...this.completedChallenges]));
    }
    
    // Leaderboard System
    updateLeaderboard(score) {
        if (score > this.personalBest) {
            this.personalBest = score;
            this.savePersonalBest();
            this.game.showAchievement(`NEW PERSONAL BEST! ${score}`);
        }
        
        // Add to global leaderboard (simulated)
        this.leaderboard.push({
            score: score,
            player: 'Player',
            date: Date.now(),
            level: this.playerLevel
        });
        
        // Keep only top 10
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
        
        this.saveLeaderboard();
    }
    
    // Update various game events
    onCrystalCollected() {
        this.sessionStats.crystalsCollected++;
        this.addToCombo('crystal', 50);
        this.addExperience(10);
        this.checkAchievement('crystal_collector', 1);
        this.updateChallengeProgress('crystals', 1);
    }
    
    onEnemyDefeated() {
        this.sessionStats.enemiesDefeated++;
        this.addToCombo('enemy', 100);
        this.addExperience(25);
        this.checkAchievement('enemy_slayer', 1);
        this.updateChallengeProgress('enemies', 1);
        
        if (this.sessionStats.enemiesDefeated === 1) {
            this.checkAchievement('first_kill');
        }
    }
    
    onPlayerJump() {
        this.sessionStats.jumpsPerformed++;
        this.checkAchievement('first_jump');
        this.checkAchievement('double_jump_master', 1);
    }
    
    onPlayerDash() {
        this.sessionStats.dashesUsed++;
        this.checkAchievement('dash_demon', 1);
    }
    
    onPlayerDamaged() {
        this.breakCombo();
        this.checkAchievement('persistence', 1);
    }
    
    onPowerUpCollected() {
        this.sessionStats.powerUpsCollected++;
        this.addExperience(50);
        this.checkAchievement('power_hungry', 1);
    }
    
    onDistanceTraveled(distance) {
        this.sessionStats.distanceTraveled += distance;
        this.checkAchievement('explorer', distance);
    }
    
    onLevelComplete(timeSeconds) {
        this.addExperience(200);
        
        if (timeSeconds < 60) {
            this.checkAchievement('speed_runner');
            this.updateChallengeProgress('speed', 1);
        }
        
        // Check for perfect run
        if (this.game.lives === 3) {
            this.checkAchievement('perfect_run');
            this.updateChallengeProgress('perfect', 1);
        }
    }
    
    // Save/Load System
    saveAchievements() {
        const data = {
            unlocked: [...this.unlockedAchievements],
            progress: {}
        };
        
        this.achievements.forEach((achievement, id) => {
            data.progress[id] = achievement.progress;
        });
        
        localStorage.setItem('gameAchievements', JSON.stringify(data));
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('gameAchievements');
        if (saved) {
            const data = JSON.parse(saved);
            this.unlockedAchievements = new Set(data.unlocked);
            
            Object.entries(data.progress).forEach(([id, progress]) => {
                const achievement = this.achievements.get(id);
                if (achievement) {
                    achievement.progress = progress;
                    achievement.unlocked = this.unlockedAchievements.has(id);
                }
            });
        }
    }
    
    saveLeaderboard() {
        localStorage.setItem('gameLeaderboard', JSON.stringify(this.leaderboard));
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('gameLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }
    
    savePersonalBest() {
        localStorage.setItem('personalBest', this.personalBest.toString());
    }
    
    loadPersonalBest() {
        const saved = localStorage.getItem('personalBest');
        return saved ? parseInt(saved) : 0;
    }
    
    updateHUD() {
        // Update experience display
        const expElement = document.getElementById('experience');
        if (expElement) {
            expElement.textContent = `Level ${this.playerLevel} (${this.experience}/${this.experienceToNextLevel} XP)`;
        }
        
        // Update combo display
        const comboElement = document.getElementById('combo');
        if (comboElement) {
            comboElement.textContent = this.combo > 1 ? `${this.combo}x` : '';
        }
    }
    
    update(deltaTime) {
        this.updateCombo(deltaTime);
        
        // Check session achievements
        const sessionTime = Date.now() - this.sessionStats.startTime;
        if (sessionTime > 1800000 && !this.unlockedAchievements.has('marathon_runner')) { // 30 minutes
            this.checkAchievement('marathon_runner');
        }
        
        // Update distance traveled
        if (this.game.player) {
            const distance = Math.abs(this.game.player.velocityX * deltaTime / 1000);
            this.onDistanceTraveled(distance);
        }
    }
}