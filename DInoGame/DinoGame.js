// Constants
const DEFAULT_GRAVITY = 1.5;
const MIN_DISTANCE = 200;
const MAX_DISTANCE = 300;
const FALL_MULTIPLIER = 5;
const SCORE_INCREMENT = 1;
const JUMP_FORCE = -20;
const OBSTACLE_ACCELERATION = -0.1; // Negative value to increase speed towards the left
const OBSTACLE_MIN_HEIGHT = 100; // Minimum height above the ground for floating obstacles
const OBSTACLE_MAX_HEIGHT = 187; // Maximum height for floating obstacles
const NORMAL_OBSTACLE_HEIGHT = 187; // Height for normal obstacles

/**
 * Player class representing the player character.
 */
class Player {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityY = 0;
        this.jumping = false;
    }

    jump() {
        if (!this.jumping) {
            this.velocityY = JUMP_FORCE;
            this.jumping = true;
        }
    }

    applyGravity(gravity) {
        this.velocityY += gravity;
        this.y += this.velocityY;
    }

    stopJump() {
        this.jumping = false;
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/**
 * Obstacle class representing obstacles in the game.
 */
class Obstacle {
    constructor(x, y, width, height, velocityX, acceleration = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.initialVelocityX = velocityX;
        this.velocityX = velocityX;
        this.initialAcceleration = acceleration;
        this.acceleration = acceleration;
    }

    move() {
        this.velocityX += this.acceleration; // Apply acceleration
        this.x += this.velocityX;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    reset() {
        this.velocityX = this.initialVelocityX; // Reset to initial velocity
        this.acceleration = this.initialAcceleration; // Reset to initial acceleration
    }
}

/**
 * Game class representing the game state and logic.
 */
class Game {
    constructor() {
        this.canvas = this.createCanvas(800, 300);
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(50, 187, 33, 13);
        this.obstacles = [];
        this.gravity = DEFAULT_GRAVITY;
        this.score = 0;
        this.gameOver = false;
        this.intervalId = null; // Store interval ID
        this.initEventListeners();
        this.startGameLoop();
    }

    /**
     * Creates the game canvas.
     */
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        document.body.appendChild(canvas);
        return canvas;
    }

    /**
     * Restarts the game by resetting the game state.
     */
    restart() {
        if (this.gameOver) {
            this.player = new Player(50, 187, 33, 13); // Reset player
            this.obstacles = []; // Clear obstacles if necessary

            this.gravity = DEFAULT_GRAVITY; // Reset gravity
            this.score = 0; // Reset score
            this.gameOver = false; // Set game over state to false

            if (this.intervalId) {
                clearInterval(this.intervalId); // Clear previous interval
            }

            this.startGameLoop(); // Restart the game loop
        }
    }

    /**
     * Initializes event listeners for the game.
     */
    initEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver) {
                this.restart();
            } else {
                if (event.key === 'w' || event.key === 'W') {
                    this.player.jump();
                }

                if (event.key === 's' || event.key === 'S') {
                    this.gravity *= FALL_MULTIPLIER;
                }
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 's' || event.key === 'S') {
                this.gravity = DEFAULT_GRAVITY;
            }
        });
    }

    /**
     * Starts the game loop.
     */
    startGameLoop() {
        this.intervalId = setInterval(() => this.gameLoop(), 1000 / 30);
    }

    /**
     * The main game loop.
     */
    gameLoop() {
        if (this.gameOver) return; // Stop the game loop if game over
        this.player.applyGravity(this.gravity);
        this.generateObstacles();
        this.updateObstacles();
        this.checkCollisions();
        this.clearCanvas();
        this.draw();
        this.updateScore();
    }

    /**
     * Generates obstacles based on the current score.
     */
    generateObstacles() {
        const probabilityFactor = 0.5;
        if (Math.random() < probabilityFactor && (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x + MIN_DISTANCE < this.canvas.width)) {
            let distance = Math.random() * (MAX_DISTANCE - MIN_DISTANCE) + MIN_DISTANCE;
            if (this.score >= 200 && Math.random() < 0.5) { // 50% chance to generate floating obstacles after score reaches 200
                let height = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
                let floatingObstacle = new Obstacle(
                    this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1].x + distance : this.canvas.width,
                    height,
                    33,
                    13,
                    -10, // Initial velocityX
                    OBSTACLE_ACCELERATION // Initial acceleration
                );
                this.obstacles.push(floatingObstacle);
            } else { // Generate normal obstacles
                let normalObstacle = new Obstacle(
                    this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1].x + distance : this.canvas.width,
                    NORMAL_OBSTACLE_HEIGHT,
                    33,
                    13,
                    -10, // Initial velocityX
                    OBSTACLE_ACCELERATION // Initial acceleration
                );
                this.obstacles.push(normalObstacle);
            }
        }
    }

    /**
     * Updates the positions of all obstacles.
     */
    updateObstacles() {
        this.obstacles.forEach(obstacle => obstacle.move());
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0); // Remove obstacles that have moved off the screen
    }

    /**
     * Checks for collisions between the player and obstacles.
     */
    checkCollisions() {
        if (this.player.y >= this.canvas.height - 113) {
            this.player.y = this.canvas.height - 113;
            this.player.velocityY = 0;
            this.player.jumping = false;
        }

        this.obstacles.forEach(obstacle => {
            if (this.checkCollision(this.player, obstacle)) {
                console.log("Collision detected!");
                this.gameOver = true;
            }
        });
    }

    /**
     * Clears the game canvas.
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draws all game elements.
     */
    draw() {
        this.drawGround();
        this.player.draw(this.ctx);
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        if (this.gameOver) {
            this.displayGameOver();
        }
    }

    /**
     * Draws the ground on the canvas.
     */
    drawGround() {
        const groundHeight = this.canvas.height / 3;
        this.ctx.fillStyle = 'gray';
        this.ctx.fillRect(0, this.canvas.height - groundHeight, this.canvas.width, groundHeight);
    }

    /**
     * Updates and displays the score.
     */
    updateScore() {
        if (!this.gameOver) {
            this.score += SCORE_INCREMENT;
            this.displayScore();
        }
    }

    /**
     * Displays the current score on the canvas.
     */
    displayScore() {
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillStyle = "yellow";
        this.ctx.fillText('Score', 50, 30);
        this.ctx.fillText(this.score.toString(), 50, 60);
    }

    /**
     * Displays the game over message.
     */
    displayGameOver() {
        this.ctx.font = '40px "Press Start 2P"';
        this.ctx.fillStyle = "red";
        this.ctx.fillText('GAME OVER', 250, 150);
    }

    /**
     * Checks for collision between the player and a specific obstacle.
     */
    checkCollision(player, obstacle) {
        return !(player.x + player.width < obstacle.x ||
            player.x > obstacle.x + obstacle.width ||
            player.y + player.height < obstacle.y ||
            player.y > obstacle.y + obstacle.height);
    }
}

// Start the game
const game = new Game();
