// Quantum Runner - Input System
class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
        this.mousePos = new Vector2(0, 0);
        this.mousePressed = false;
        this.mouseReleased = false;
        
        this.gamepad = null;
        this.gamepadButtons = {};
        this.gamepadPrevButtons = {};
        
        this.bindEvents();
        this.setupGamepadSupport();
    }
    
    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                            'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyE'];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysReleased[e.code] = true;
        });
        
        // Mouse events
        document.addEventListener('mousemove', (e) => {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mousePressed = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouseReleased = true;
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupGamepadSupport() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad.id);
        });
    }
    
    update() {
        // Update gamepad
        const gamepads = navigator.getGamepads();
        if (gamepads[0]) {
            this.gamepad = gamepads[0];
            
            // Store previous button states
            this.gamepadPrevButtons = { ...this.gamepadButtons };
            
            // Update current button states
            this.gamepadButtons = {};
            for (let i = 0; i < this.gamepad.buttons.length; i++) {
                this.gamepadButtons[i] = this.gamepad.buttons[i].pressed;
            }
        }
    }
    
    // Keyboard input methods
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    isKeyJustPressed(keyCode) {
        return !!this.keysPressed[keyCode];
    }
    
    isKeyJustReleased(keyCode) {
        return !!this.keysReleased[keyCode];
    }
    
    // Gamepad input methods
    isButtonPressed(buttonIndex) {
        return !!this.gamepadButtons[buttonIndex];
    }
    
    isButtonJustPressed(buttonIndex) {
        return this.gamepadButtons[buttonIndex] && !this.gamepadPrevButtons[buttonIndex];
    }
    
    getAxisValue(axisIndex) {
        if (!this.gamepad || !this.gamepad.axes[axisIndex]) return 0;
        const value = this.gamepad.axes[axisIndex];
        return Math.abs(value) > 0.1 ? value : 0; // Dead zone
    }
    
    // Game-specific input methods
    getHorizontalInput() {
        let input = 0;
        
        // Keyboard
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA')) input -= 1;
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) input += 1;
        
        // Gamepad
        if (this.gamepad) {
            const axisInput = this.getAxisValue(0);
            if (Math.abs(axisInput) > Math.abs(input)) {
                input = axisInput;
            }
        }
        
        return Utils.clamp(input, -1, 1);
    }
    
    getVerticalInput() {
        let input = 0;
        
        // Keyboard
        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW')) input -= 1;
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS')) input += 1;
        
        // Gamepad
        if (this.gamepad) {
            const axisInput = this.getAxisValue(1);
            if (Math.abs(axisInput) > Math.abs(input)) {
                input = axisInput;
            }
        }
        
        return Utils.clamp(input, -1, 1);
    }
    
    isJumpPressed() {
        return this.isKeyPressed('Space') || 
               this.isKeyPressed('ArrowUp') || 
               this.isKeyPressed('KeyW') ||
               this.isButtonPressed(0); // A button on gamepad
    }
    
    isJumpJustPressed() {
        return this.isKeyJustPressed('Space') || 
               this.isKeyJustPressed('ArrowUp') || 
               this.isKeyJustPressed('KeyW') ||
               this.isButtonJustPressed(0);
    }
    
    isDashPressed() {
        return this.isKeyPressed('ShiftLeft') || 
               this.isKeyPressed('ShiftRight') ||
               this.isButtonPressed(1); // B button on gamepad
    }
    
    isDashJustPressed() {
        return this.isKeyJustPressed('ShiftLeft') || 
               this.isKeyJustPressed('ShiftRight') ||
               this.isButtonJustPressed(1);
    }
    
    isTimeSlowPressed() {
        return this.isKeyPressed('Space') ||
               this.isButtonPressed(2); // X button on gamepad
    }
    
    isPhaseShiftPressed() {
        return this.isKeyPressed('KeyE') ||
               this.isButtonPressed(3); // Y button on gamepad
    }
    
    isPhaseShiftJustPressed() {
        return this.isKeyJustPressed('KeyE') ||
               this.isButtonJustPressed(3);
    }
    
    isPausePressed() {
        return this.isKeyJustPressed('Escape') ||
               this.isButtonJustPressed(9); // Start button on gamepad
    }
    
    // Clear frame-specific input states
    clearFrameInputs() {
        this.keysPressed = {};
        this.keysReleased = {};
        this.mousePressed = false;
        this.mouseReleased = false;
    }
}