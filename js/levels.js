// Quantum Runner - Level Generation System
class LevelGenerator {
    constructor() {
        this.tileSize = 32;
        this.levelWidth = 100; // tiles
        this.levelHeight = 30; // tiles
        
        // Predefined level segments
        this.segments = this.createSegments();
        this.decorativeElements = [];
        this.backgroundElements = [];
        
        // Current level data
        this.currentLevel = 1;
        this.seed = 12345;
        this.difficulty = 1;
    }
    
    generateLevel(levelNumber, seed = null) {
        this.currentLevel = levelNumber;
        this.seed = seed || Date.now();
        this.difficulty = Math.min(10, Math.floor(levelNumber / 3) + 1);
        
        // Set random seed for consistent generation
        Math.seedrandom(this.seed);
        
        const level = {
            tiles: [],
            enemies: [],
            powerups: [],
            checkpoints: [],
            spawnPoint: new Vector2(100, 500),
            endPoint: new Vector2((this.levelWidth - 5) * this.tileSize, 500),
            backgroundElements: [],
            decorativeElements: [],
            theme: this.selectTheme(levelNumber)
        };
        
        // Generate base terrain
        this.generateTerrain(level);
        
        // Add platforms and structures
        this.addPlatforms(level);
        
        // Place enemies
        this.placeEnemies(level);
        
        // Add powerups
        this.addPowerups(level);
        
        // Add checkpoints
        this.addCheckpoints(level);
        
        // Add decorative elements
        this.addDecorations(level);
        
        // Add background elements
        this.addBackground(level);
        
        return level;
    }
    
    selectTheme(levelNumber) {
        const themes = ['cyber', 'crystal', 'void', 'neon', 'quantum'];
        return themes[Math.floor((levelNumber - 1) / 5) % themes.length];
    }
    
    generateTerrain(level) {
        // Initialize empty grid
        for (let y = 0; y < this.levelHeight; y++) {
            level.tiles[y] = [];
            for (let x = 0; x < this.levelWidth; x++) {
                level.tiles[y][x] = 0; // 0 = empty, 1 = solid, 2 = platform
            }
        }
        
        // Ground level with variation
        const baseGroundLevel = this.levelHeight - 4;
        let currentHeight = baseGroundLevel;
        
        for (let x = 0; x < this.levelWidth; x++) {
            // Height variation
            if (Math.random() < 0.1) {
                currentHeight += Utils.randomInt(-2, 2);
                currentHeight = Utils.clamp(currentHeight, baseGroundLevel - 3, baseGroundLevel + 2);
            }
            
            // Fill from ground level down
            for (let y = currentHeight; y < this.levelHeight; y++) {
                level.tiles[y][x] = 1;
            }
            
            // Add surface details
            if (Math.random() < 0.3) {
                if (currentHeight > 0) {
                    level.tiles[currentHeight - 1][x] = 1;
                }
            }
        }
        
        // Add caves and tunnels
        this.addCaves(level);
        
        // Add vertical structures
        this.addVerticalStructures(level);
    }
    
    addCaves(level) {
        const numCaves = Utils.randomInt(2, 4);
        
        for (let i = 0; i < numCaves; i++) {
            const caveX = Utils.randomInt(10, this.levelWidth - 20);
            const caveY = Utils.randomInt(this.levelHeight - 8, this.levelHeight - 3);
            const caveWidth = Utils.randomInt(8, 15);
            const caveHeight = Utils.randomInt(3, 5);
            
            // Carve out cave
            for (let x = caveX; x < caveX + caveWidth; x++) {
                for (let y = caveY; y < caveY + caveHeight; y++) {
                    if (x < this.levelWidth && y < this.levelHeight) {
                        level.tiles[y][x] = 0;
                    }
                }
            }
        }
    }
    
    addVerticalStructures(level) {
        const numStructures = Utils.randomInt(3, 6);
        
        for (let i = 0; i < numStructures; i++) {
            const structX = Utils.randomInt(15, this.levelWidth - 15);
            const structHeight = Utils.randomInt(5, 12);
            const structWidth = Utils.randomInt(2, 4);
            
            // Find ground level at this position
            let groundLevel = this.levelHeight - 1;
            for (let y = 0; y < this.levelHeight; y++) {
                if (level.tiles[y][structX] === 1) {
                    groundLevel = y;
                    break;
                }
            }
            
            // Build structure upward
            for (let x = structX; x < structX + structWidth; x++) {
                for (let y = groundLevel - structHeight; y < groundLevel; y++) {
                    if (x < this.levelWidth && y >= 0) {
                        level.tiles[y][x] = 1;
                    }
                }
            }
        }
    }
    
    addPlatforms(level) {
        const numPlatforms = Utils.randomInt(8, 15) + this.difficulty;
        
        for (let i = 0; i < numPlatforms; i++) {
            const platformX = Utils.randomInt(5, this.levelWidth - 10);
            const platformY = Utils.randomInt(5, this.levelHeight - 8);
            const platformWidth = Utils.randomInt(3, 8);
            
            // Make sure platform has empty space above
            let canPlace = true;
            for (let x = platformX; x < platformX + platformWidth; x++) {
                if (x >= this.levelWidth || level.tiles[platformY][x] === 1 || 
                    (platformY > 0 && level.tiles[platformY - 1][x] === 1)) {
                    canPlace = false;
                    break;
                }
            }
            
            if (canPlace) {
                for (let x = platformX; x < platformX + platformWidth; x++) {
                    if (x < this.levelWidth) {
                        level.tiles[platformY][x] = 2; // Platform tile
                    }
                }
            }
        }
    }
    
    placeEnemies(level) {
        const enemyTypes = ['basic', 'fast', 'heavy', 'jumper', 'ranged', 'phase'];
        const numEnemies = Utils.randomInt(8, 15) + this.difficulty * 2;
        
        for (let i = 0; i < numEnemies; i++) {
            const enemyX = Utils.randomInt(10, this.levelWidth - 10) * this.tileSize;
            
            // Find ground level
            const tileX = Math.floor(enemyX / this.tileSize);
            let groundY = this.levelHeight - 1;
            
            for (let y = 0; y < this.levelHeight; y++) {
                if (level.tiles[y][tileX] === 1 || level.tiles[y][tileX] === 2) {
                    groundY = y - 1;
                    break;
                }
            }
            
            const enemyY = groundY * this.tileSize;
            
            // Select enemy type based on difficulty
            let enemyType = 'basic';
            const rand = Math.random();
            
            if (this.difficulty >= 3 && rand < 0.15) {
                enemyType = 'heavy';
            } else if (this.difficulty >= 2 && rand < 0.25) {
                enemyType = 'fast';
            } else if (this.difficulty >= 4 && rand < 0.35) {
                enemyType = 'jumper';
            } else if (this.difficulty >= 5 && rand < 0.45) {
                enemyType = 'ranged';
            } else if (this.difficulty >= 7 && rand < 0.55) {
                enemyType = 'phase';
            }
            
            level.enemies.push({
                x: enemyX,
                y: enemyY,
                type: enemyType
            });
        }
    }
    
    addPowerups(level) {
        const powerupTypes = [
            { type: 'energy', weight: 40 },
            { type: 'life', weight: 10 },
            { type: 'speedBoost', weight: 20 },
            { type: 'shield', weight: 15 },
            { type: 'timeExtender', weight: 15 }
        ];
        
        const numPowerups = Utils.randomInt(5, 10);
        
        for (let i = 0; i < numPowerups; i++) {
            const powerupX = Utils.randomInt(5, this.levelWidth - 5) * this.tileSize;
            
            // Find ground or platform level
            const tileX = Math.floor(powerupX / this.tileSize);
            let groundY = this.levelHeight - 1;
            
            for (let y = 0; y < this.levelHeight; y++) {
                if (level.tiles[y][tileX] === 1 || level.tiles[y][tileX] === 2) {
                    groundY = y - 1;
                    break;
                }
            }
            
            const powerupY = groundY * this.tileSize;
            
            // Select powerup type
            const totalWeight = powerupTypes.reduce((sum, p) => sum + p.weight, 0);
            let random = Math.random() * totalWeight;
            let selectedType = 'energy';
            
            for (const powerup of powerupTypes) {
                random -= powerup.weight;
                if (random <= 0) {
                    selectedType = powerup.type;
                    break;
                }
            }
            
            level.powerups.push({
                x: powerupX,
                y: powerupY,
                type: selectedType
            });
        }
    }
    
    addCheckpoints(level) {
        const numCheckpoints = Math.floor(this.levelWidth / 25);
        
        for (let i = 1; i <= numCheckpoints; i++) {
            const checkpointX = (i * 25) * this.tileSize;
            
            // Find ground level
            const tileX = Math.floor(checkpointX / this.tileSize);
            let groundY = this.levelHeight - 1;
            
            for (let y = 0; y < this.levelHeight; y++) {
                if (level.tiles[y][tileX] === 1 || level.tiles[y][tileX] === 2) {
                    groundY = y - 1;
                    break;
                }
            }
            
            const checkpointY = groundY * this.tileSize;
            
            level.checkpoints.push({
                x: checkpointX,
                y: checkpointY,
                activated: false
            });
        }
    }
    
    addDecorations(level) {
        // Add crystals, tech panels, quantum effects, etc.
        const numDecorations = Utils.randomInt(20, 40);
        
        for (let i = 0; i < numDecorations; i++) {
            const decorX = Utils.randomInt(0, this.levelWidth - 1) * this.tileSize;
            const decorY = Utils.randomInt(0, this.levelHeight - 1) * this.tileSize;
            
            const decorationTypes = ['crystal', 'tech_panel', 'quantum_orb', 'energy_field'];
            const decorType = decorationTypes[Utils.randomInt(0, decorationTypes.length - 1)];
            
            level.decorativeElements.push({
                x: decorX,
                y: decorY,
                type: decorType,
                animationOffset: Math.random() * 100
            });
        }
    }
    
    addBackground(level) {
        // Add parallax background elements
        const numBgElements = Utils.randomInt(10, 20);
        
        for (let i = 0; i < numBgElements; i++) {
            const bgX = Utils.randomInt(-200, this.levelWidth * this.tileSize + 200);
            const bgY = Utils.randomInt(-100, this.levelHeight * this.tileSize);
            
            const bgTypes = ['distant_structure', 'floating_platform', 'energy_beam', 'quantum_rift'];
            const bgType = bgTypes[Utils.randomInt(0, bgTypes.length - 1)];
            
            level.backgroundElements.push({
                x: bgX,
                y: bgY,
                type: bgType,
                parallaxFactor: Utils.randomBetween(0.1, 0.7),
                scale: Utils.randomBetween(0.5, 2.0),
                animationOffset: Math.random() * 200
            });
        }
    }
    
    createSegments() {
        // Predefined level segments for specific challenges
        return {
            jumpChallenge: [
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,2,2,0,0,0,0],
                [0,0,0,0,0,2,2,0],
                [2,2,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,1]
            ],
            
            wallJumpChallenge: [
                [0,0,0,0,0,1],
                [0,0,0,0,0,1],
                [0,0,0,0,0,1],
                [1,0,0,0,0,1],
                [1,0,0,0,0,1],
                [1,1,1,1,1,1]
            ],
            
            enemyGauntlet: [
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,2,0,2,0,2,0],
                [0,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,1]
            ]
        };
    }
    
    // Convert tile grid to physics world
    convertToPhysicsWorld(level, physicsWorld) {
        physicsWorld.clear();
        
        for (let y = 0; y < level.tiles.length; y++) {
            for (let x = 0; x < level.tiles[y].length; x++) {
                const tile = level.tiles[y][x];
                
                if (tile === 1) {
                    // Solid tile
                    physicsWorld.addStaticTile(new CollisionTile(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize,
                        'solid'
                    ));
                } else if (tile === 2) {
                    // Platform tile (one-way)
                    physicsWorld.addStaticTile(new CollisionTile(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize,
                        'platform'
                    ));
                }
            }
        }
    }
    
    renderLevel(ctx, level, camera, time) {
        this.renderBackground(ctx, level, camera, time);
        this.renderTiles(ctx, level, camera);
        this.renderDecorations(ctx, level, camera, time);
    }
    
    renderBackground(ctx, level, camera, time) {
        // Render parallax background elements
        for (const bg of level.backgroundElements) {
            const parallaxX = bg.x - camera.x * bg.parallaxFactor;
            const parallaxY = bg.y - camera.y * bg.parallaxFactor;
            
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.translate(parallaxX, parallaxY);
            ctx.scale(bg.scale, bg.scale);
            
            this.renderBackgroundElement(ctx, bg, time);
            
            ctx.restore();
        }
    }
    
    renderTiles(ctx, level, camera) {
        const startX = Math.max(0, Math.floor(camera.x / this.tileSize) - 1);
        const endX = Math.min(level.tiles[0].length, Math.ceil((camera.x + ctx.canvas.width) / this.tileSize) + 1);
        const startY = Math.max(0, Math.floor(camera.y / this.tileSize) - 1);
        const endY = Math.min(level.tiles.length, Math.ceil((camera.y + ctx.canvas.height) / this.tileSize) + 1);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = level.tiles[y][x];
                if (tile === 0) continue;
                
                const screenX = x * this.tileSize - camera.x;
                const screenY = y * this.tileSize - camera.y;
                
                ctx.save();
                
                if (tile === 1) {
                    // Solid tile
                    ctx.fillStyle = this.getTileColor(level.theme, 'solid');
                    ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    
                    // Add border
                    ctx.strokeStyle = this.getTileColor(level.theme, 'border');
                    ctx.lineWidth = 1;
                    ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                    
                } else if (tile === 2) {
                    // Platform tile
                    ctx.fillStyle = this.getTileColor(level.theme, 'platform');
                    ctx.fillRect(screenX, screenY, this.tileSize, 8);
                    
                    // Glow effect
                    Utils.drawGlow(ctx, screenX + this.tileSize/2, screenY + 4, 
                                  this.tileSize, this.getTileColor(level.theme, 'platform'), 0.3);
                }
                
                ctx.restore();
            }
        }
    }
    
    renderDecorations(ctx, level, camera, time) {
        for (const decoration of level.decorativeElements) {
            const screenX = decoration.x - camera.x;
            const screenY = decoration.y - camera.y;
            
            // Skip if off-screen
            if (screenX < -50 || screenX > ctx.canvas.width + 50 || 
                screenY < -50 || screenY > ctx.canvas.height + 50) {
                continue;
            }
            
            ctx.save();
            ctx.translate(screenX, screenY);
            
            this.renderDecoration(ctx, decoration, time);
            
            ctx.restore();
        }
    }
    
    renderDecoration(ctx, decoration, time) {
        const animTime = (time + decoration.animationOffset) * 0.01;
        
        switch (decoration.type) {
            case 'crystal':
                ctx.save();
                ctx.rotate(Math.sin(animTime) * 0.1);
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(-8, -8, 16, 16);
                Utils.drawGlow(ctx, 0, 0, 20, '#00ffff', 0.5 + Math.sin(animTime * 2) * 0.2);
                ctx.restore();
                break;
                
            case 'tech_panel':
                ctx.fillStyle = '#004444';
                ctx.fillRect(-12, -12, 24, 24);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(-12, -12, 24, 24);
                
                // Animated lights
                ctx.fillStyle = '#00ffff';
                for (let i = 0; i < 3; i++) {
                    const lightTime = animTime + i * 0.5;
                    ctx.globalAlpha = (Math.sin(lightTime) + 1) * 0.5;
                    ctx.fillRect(-8 + i * 8, -2, 4, 4);
                }
                break;
                
            case 'quantum_orb':
                const orbSize = 10 + Math.sin(animTime * 3) * 3;
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(0, 0, orbSize, 0, Math.PI * 2);
                ctx.fill();
                Utils.drawGlow(ctx, 0, 0, orbSize * 2, '#ff00ff', 0.8);
                break;
                
            case 'energy_field':
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.sin(animTime * 4) * 0.2;
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-16, -32, 32, 64);
                ctx.restore();
                break;
        }
    }
    
    renderBackgroundElement(ctx, bg, time) {
        const animTime = (time + bg.animationOffset) * 0.005;
        
        switch (bg.type) {
            case 'distant_structure':
                ctx.fillStyle = '#001122';
                ctx.fillRect(-40, -60, 80, 120);
                ctx.strokeStyle = '#002244';
                ctx.lineWidth = 2;
                ctx.strokeRect(-40, -60, 80, 120);
                break;
                
            case 'floating_platform':
                const bobOffset = Math.sin(animTime) * 5;
                ctx.translate(0, bobOffset);
                ctx.fillStyle = '#003333';
                ctx.fillRect(-30, -10, 60, 20);
                break;
                
            case 'energy_beam':
                ctx.save();
                ctx.globalAlpha = 0.2 + Math.sin(animTime * 3) * 0.1;
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(-5, -200, 10, 400);
                ctx.restore();
                break;
                
            case 'quantum_rift':
                ctx.save();
                ctx.rotate(animTime * 0.5);
                ctx.globalAlpha = 0.4;
                for (let i = 0; i < 5; i++) {
                    ctx.rotate(Math.PI * 2 / 5);
                    ctx.fillStyle = `hsl(${(animTime * 50 + i * 60) % 360}, 80%, 50%)`;
                    ctx.fillRect(-20, -3, 40, 6);
                }
                ctx.restore();
                break;
        }
    }
    
    getTileColor(theme, tileType) {
        const themeColors = {
            cyber: {
                solid: '#001122',
                platform: '#00ffff',
                border: '#004466'
            },
            crystal: {
                solid: '#220044',
                platform: '#ff00ff',
                border: '#440088'
            },
            void: {
                solid: '#000000',
                platform: '#444444',
                border: '#222222'
            },
            neon: {
                solid: '#440022',
                platform: '#ff0080',
                border: '#880044'
            },
            quantum: {
                solid: '#002200',
                platform: '#00ff40',
                border: '#004400'
            }
        };
        
        return themeColors[theme]?.[tileType] || '#ffffff';
    }
}