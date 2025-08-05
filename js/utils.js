// Quantum Runner - Utility Functions
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(vector) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }
    
    subtract(vector) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }
    
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return new Vector2(this.x / mag, this.y / mag);
    }
    
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    
    distance(vector) {
        return Math.sqrt(Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2));
    }
    
    lerp(target, t) {
        return new Vector2(
            this.x + (target.x - this.x) * t,
            this.y + (target.y - this.y) * t
        );
    }
    
    clone() {
        return new Vector2(this.x, this.y);
    }
}

class Utils {
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static map(value, fromMin, fromMax, toMin, toMax) {
        return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
    }
    
    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    static easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    static easeIn(t) {
        return t * t * t;
    }
    
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    static rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    static circleCollision(circle1, circle2) {
        const distance = Math.sqrt(
            Math.pow(circle1.x - circle2.x, 2) + 
            Math.pow(circle1.y - circle2.y, 2)
        );
        return distance < circle1.radius + circle2.radius;
    }
    
    static pointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }
    
    static wrapAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }
    
    static screenShake(intensity = 5, duration = 200) {
        if (!window.gameState) return;
        
        window.gameState.screenShake = {
            intensity: intensity,
            duration: duration,
            timer: 0
        };
    }
    
    static hitStop(duration = 100) {
        if (!window.gameState) return;
        
        window.gameState.hitStop = {
            duration: duration,
            timer: 0
        };
    }
    
    static formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        const ms = Math.floor((milliseconds % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    static formatScore(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    static saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save data to localStorage:', e);
        }
    }
    
    static loadData(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Could not load data from localStorage:', e);
            return defaultValue;
        }
    }
    
    static ripple(ctx, x, y, radius, color = '#00ffff') {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    static drawGlow(ctx, x, y, radius, color = '#00ffff', intensity = 1) {
        ctx.save();
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color + Math.floor(255 * intensity).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, color + Math.floor(128 * intensity).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}