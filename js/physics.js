// Quantum Runner - Physics System
class PhysicsBody {
    constructor(x, y, width, height) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.width = width;
        this.height = height;
        this.mass = 1;
        this.friction = 0.8;
        this.bounce = 0;
        this.grounded = false;
        this.onWall = false;
        this.wallDirection = 0;
        this.maxVelocity = new Vector2(15, 20);
        this.gravity = 0.8;
        this.terminalVelocity = 20;
        this.collisionLayers = ['solid'];
        this.isStatic = false;
        this.isTrigger = false;
        
        // Collision callbacks
        this.onCollisionEnter = null;
        this.onCollisionExit = null;
        this.onTriggerEnter = null;
        this.onTriggerExit = null;
    }
    
    update(deltaTime) {
        if (this.isStatic) return;
        
        // Apply gravity
        this.acceleration.y += this.gravity;
        
        // Update velocity
        this.velocity = this.velocity.add(this.acceleration.multiply(deltaTime));
        
        // Apply friction when grounded
        if (this.grounded) {
            this.velocity.x *= this.friction;
        }
        
        // Clamp velocity
        this.velocity.x = Utils.clamp(this.velocity.x, -this.maxVelocity.x, this.maxVelocity.x);
        this.velocity.y = Utils.clamp(this.velocity.y, -this.maxVelocity.y, this.maxVelocity.y);
        
        // Update position
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        
        // Reset acceleration
        this.acceleration = new Vector2(0, 0);
    }
    
    addForce(force) {
        this.acceleration = this.acceleration.add(force.multiply(1 / this.mass));
    }
    
    addImpulse(impulse) {
        this.velocity = this.velocity.add(impulse);
    }
    
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }
    
    getCenter() {
        return new Vector2(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
    }
    
    overlaps(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        return Utils.rectCollision(bounds1, bounds2);
    }
}

class CollisionTile {
    constructor(x, y, width, height, type = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class PhysicsWorld {
    constructor() {
        this.bodies = [];
        this.staticTiles = [];
        this.gravity = new Vector2(0, 0.8);
        this.airResistance = 0.99;
    }
    
    addBody(body) {
        this.bodies.push(body);
        return body;
    }
    
    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }
    
    addStaticTile(tile) {
        this.staticTiles.push(tile);
        return tile;
    }
    
    update(deltaTime) {
        // Update all bodies
        for (const body of this.bodies) {
            if (!body.isStatic) {
                // Reset collision flags
                body.grounded = false;
                body.onWall = false;
                body.wallDirection = 0;
                
                // Update physics
                body.update(deltaTime);
                
                // Check collisions with static tiles
                this.resolveStaticCollisions(body);
                
                // Check collisions with other bodies
                this.resolveDynamicCollisions(body);
            }
        }
    }
    
    resolveStaticCollisions(body) {
        const bodyBounds = body.getBounds();
        
        for (const tile of this.staticTiles) {
            if (Utils.rectCollision(bodyBounds, tile.getBounds())) {
                if (tile.type === 'solid') {
                    this.resolveSolidCollision(body, tile);
                } else if (tile.type === 'platform' && body.velocity.y > 0) {
                    // One-way platforms (only collide from above)
                    if (body.position.y < tile.y) {
                        this.resolveSolidCollision(body, tile);
                    }
                }
            }
        }
    }
    
    resolveSolidCollision(body, tile) {
        const bodyBounds = body.getBounds();
        const tileBounds = tile.getBounds();
        
        // Calculate overlap
        const overlapX = Math.min(
            bodyBounds.x + bodyBounds.width - tileBounds.x,
            tileBounds.x + tileBounds.width - bodyBounds.x
        );
        const overlapY = Math.min(
            bodyBounds.y + bodyBounds.height - tileBounds.y,
            tileBounds.y + tileBounds.height - bodyBounds.y
        );
        
        // Resolve collision based on smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (body.position.x < tile.x) {
                // Hit from left
                body.position.x = tile.x - body.width;
                body.onWall = true;
                body.wallDirection = 1;
            } else {
                // Hit from right
                body.position.x = tile.x + tile.width;
                body.onWall = true;
                body.wallDirection = -1;
            }
            body.velocity.x = 0;
        } else {
            // Vertical collision
            if (body.position.y < tile.y) {
                // Hit from above (landing)
                body.position.y = tile.y - body.height;
                body.grounded = true;
            } else {
                // Hit from below (ceiling)
                body.position.y = tile.y + tile.height;
            }
            body.velocity.y = 0;
        }
    }
    
    resolveDynamicCollisions(body) {
        for (const other of this.bodies) {
            if (body === other || other.isStatic) continue;
            
            if (body.overlaps(other)) {
                if (body.isTrigger || other.isTrigger) {
                    // Handle trigger collision
                    if (body.onTriggerEnter) {
                        body.onTriggerEnter(other);
                    }
                    if (other.onTriggerEnter) {
                        other.onTriggerEnter(body);
                    }
                } else {
                    // Handle solid collision
                    this.resolveBodyCollision(body, other);
                }
            }
        }
    }
    
    resolveBodyCollision(body1, body2) {
        const bounds1 = body1.getBounds();
        const bounds2 = body2.getBounds();
        
        // Calculate overlap
        const overlapX = Math.min(
            bounds1.x + bounds1.width - bounds2.x,
            bounds2.x + bounds2.width - bounds1.x
        );
        const overlapY = Math.min(
            bounds1.y + bounds1.height - bounds2.y,
            bounds2.y + bounds2.height - bounds1.y
        );
        
        // Separate bodies
        if (overlapX < overlapY) {
            // Horizontal separation
            const direction = body1.position.x < body2.position.x ? -1 : 1;
            const separation = overlapX / 2 * direction;
            
            body1.position.x -= separation;
            body2.position.x += separation;
            
            // Exchange velocities (simplified elastic collision)
            const temp = body1.velocity.x;
            body1.velocity.x = body2.velocity.x * body1.bounce;
            body2.velocity.x = temp * body2.bounce;
        } else {
            // Vertical separation
            const direction = body1.position.y < body2.position.y ? -1 : 1;
            const separation = overlapY / 2 * direction;
            
            body1.position.y -= separation;
            body2.position.y += separation;
            
            // Exchange velocities
            const temp = body1.velocity.y;
            body1.velocity.y = body2.velocity.y * body1.bounce;
            body2.velocity.y = temp * body2.bounce;
        }
        
        // Trigger collision callbacks
        if (body1.onCollisionEnter) body1.onCollisionEnter(body2);
        if (body2.onCollisionEnter) body2.onCollisionEnter(body1);
    }
    
    raycast(start, end, layerMask = ['solid']) {
        const direction = end.subtract(start).normalize();
        const distance = start.distance(end);
        const stepSize = 2;
        const steps = Math.ceil(distance / stepSize);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const currentPos = start.lerp(end, t);
            
            // Check against static tiles
            for (const tile of this.staticTiles) {
                if (layerMask.includes(tile.type)) {
                    if (Utils.pointInRect(currentPos, tile.getBounds())) {
                        return {
                            hit: true,
                            point: currentPos,
                            distance: start.distance(currentPos),
                            object: tile
                        };
                    }
                }
            }
            
            // Check against dynamic bodies
            for (const body of this.bodies) {
                if (!body.isTrigger && Utils.pointInRect(currentPos, body.getBounds())) {
                    return {
                        hit: true,
                        point: currentPos,
                        distance: start.distance(currentPos),
                        object: body
                    };
                }
            }
        }
        
        return {
            hit: false,
            point: end,
            distance: distance,
            object: null
        };
    }
    
    clear() {
        this.bodies = [];
        this.staticTiles = [];
    }
}