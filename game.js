const GRID_SIZE = 6;
const CELL_SIZE = 80;
const POINT_RADIUS = 10;
const MIN_SAFE_DISTANCE = 2; // Minimum safe distance from blue point

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

canvas.width = CELL_SIZE * (GRID_SIZE - 1);
canvas.height = CELL_SIZE * (GRID_SIZE - 1);

let bluePos = { x: 0, y: GRID_SIZE - 1 };
let redPos = { x: GRID_SIZE - 1, y: 0 };
let edges = [];
let gameOver = false;

function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
}

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function initializePositions() {
    // Generate random positions ensuring they're not too close
    do {
        bluePos = getRandomPosition();
        redPos = getRandomPosition();
    } while (getDistance(bluePos, redPos) < MIN_SAFE_DISTANCE);
}

function initializeEdges() {
    edges = [];
    // Horizontal edges
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 1; x++) {
            edges.push({
                x1: x, y1: y,
                x2: x + 1, y2: y,
                active: true
            });
        }
    }
    // Vertical edges
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 1; y++) {
            edges.push({
                x1: x, y1: y,
                x2: x, y2: y + 1,
                active: true
            });
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw active edges only
    edges.forEach(edge => {
        if (edge.active) {
            ctx.beginPath();
            ctx.moveTo(edge.x1 * CELL_SIZE, edge.y1 * CELL_SIZE);
            ctx.lineTo(edge.x2 * CELL_SIZE, edge.y2 * CELL_SIZE);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    // Draw points
    ctx.beginPath();
    ctx.arc(bluePos.x * CELL_SIZE, bluePos.y * CELL_SIZE, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(redPos.x * CELL_SIZE, redPos.y * CELL_SIZE, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
}

function removeRandomEdge() {
    const activeEdges = edges.filter(edge => edge.active);
    if (activeEdges.length > 0) {
        const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
        edge.active = false;
    }
    drawGame();
}

function canMove(from, to) {
    return edges.some(edge => 
        edge.active && 
        ((edge.x1 === from.x && edge.y1 === from.y && edge.x2 === to.x && edge.y2 === to.y) ||
         (edge.x2 === from.x && edge.y2 === from.y && edge.x1 === to.x && edge.y1 === to.y))
    );
}

function getValidMoves(pos) {
    const moves = [];
    const directions = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];

    directions.forEach(dir => {
        const newPos = { x: pos.x + dir.dx, y: pos.y + dir.dy };
        if (newPos.x >= 0 && newPos.x < GRID_SIZE && 
            newPos.y >= 0 && newPos.y < GRID_SIZE && 
            canMove(pos, newPos)) {
            moves.push(newPos);
        }
    });
    return moves;
}

function moveRed() {
    const validMoves = getValidMoves(redPos);
    if (validMoves.length > 0) {
        // Score each move based on future options and distance from blue
        const scoredMoves = validMoves.map(move => {
            const distanceFromBlue = getDistance(move, bluePos);
            const futureOptions = getValidMoves(move).length;
            
            // Heavily penalize moves that get too close to blue
            const distanceScore = distanceFromBlue < MIN_SAFE_DISTANCE ? -100 : distanceFromBlue * 2;
            
            // Prioritize moves with more future options
            const score = futureOptions * 10 + distanceScore;
            
            return { move, score };
        });

        // Sort by score (highest first) and take the best move
        scoredMoves.sort((a, b) => b.score - a.score);
        redPos = scoredMoves[0].move;
    }
}

function checkWin() {
    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        gameOver = true;
        document.getElementById('message').textContent = 'You Win!';
    }
}

function handleMove(key) {
    if (gameOver) return;

    const oldPos = { ...bluePos };
    switch (key) {
        case 'ArrowLeft': if (bluePos.x > 0) bluePos.x--; break;
        case 'ArrowRight': if (bluePos.x < GRID_SIZE - 1) bluePos.x++; break;
        case 'ArrowUp': if (bluePos.y > 0) bluePos.y--; break;
        case 'ArrowDown': if (bluePos.y < GRID_SIZE - 1) bluePos.y++; break;
    }

    if (canMove(oldPos, bluePos)) {
        removeRandomEdge();
        checkWin();
        if (!gameOver) {
            moveRed();
            checkWin();
        }
    } else {
        bluePos = oldPos;
    }
    drawGame();
}

function resetGame() {
    gameOver = false;
    document.getElementById('message').textContent = '';
    initializeEdges();
    initializePositions();
    drawGame();
}

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleMove(e.key);
    }
});

// Initialize game
resetGame();
