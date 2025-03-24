const GRID_SIZE = 6;
const CELL_SIZE = 80;
const POINT_RADIUS = 8;  // Slightly smaller points
const GRID_PADDING = CELL_SIZE / 2;  // Add padding to ensure points are visible

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Increase canvas size to account for padding
canvas.width = CELL_SIZE * (GRID_SIZE - 1) + GRID_PADDING * 2;
canvas.height = CELL_SIZE * (GRID_SIZE - 1) + GRID_PADDING * 2;

let bluePos = { x: 0, y: GRID_SIZE - 1 };
let redPos = { x: GRID_SIZE - 1, y: 0 };
let edges = [];
let gameOver = false;

function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1, // Keep away from edges
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
    };
}

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getMoveDirection(from, to) {
    return {
        dx: Math.sign(to.x - from.x),
        dy: Math.sign(to.y - from.y)
    };
}

function initializePositions() {
    do {
        bluePos = getRandomPosition();
        redPos = getRandomPosition();
    } while (getDistance(bluePos, redPos) < 3);
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

    // Draw active edges with padding offset
    edges.forEach(edge => {
        if (edge.active) {
            ctx.beginPath();
            ctx.moveTo(edge.x1 * CELL_SIZE + GRID_PADDING, edge.y1 * CELL_SIZE + GRID_PADDING);
            ctx.lineTo(edge.x2 * CELL_SIZE + GRID_PADDING, edge.y2 * CELL_SIZE + GRID_PADDING);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    // Draw points with white border for visibility
    const drawPoint = (pos, color) => {
        ctx.beginPath();
        ctx.arc(
            pos.x * CELL_SIZE + GRID_PADDING,
            pos.y * CELL_SIZE + GRID_PADDING,
            POINT_RADIUS,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    drawPoint(bluePos, 'blue');
    drawPoint(redPos, 'red');
}

function removeRandomEdge() {
    const activeEdges = edges.filter(edge => edge.active);
    if (activeEdges.length > 0) {
        const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
        edge.active = false;
    }
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
    if (validMoves.length === 0) return false;

    // Get the direction blue is coming from
    const blueDirection = getMoveDirection(redPos, bluePos);

    // Filter moves that don't go towards blue
    const safeMoves = validMoves.filter(move => {
        const moveDir = getMoveDirection(redPos, move);
        return moveDir.dx !== blueDirection.dx || moveDir.dy !== blueDirection.dy;
    });

    // If no safe moves, use all valid moves
    const movesToConsider = safeMoves.length > 0 ? safeMoves : validMoves;

    // Score moves based on number of future moves and distance from blue
    const scoredMoves = movesToConsider.map(move => {
        const futureOptions = getValidMoves(move).length;
        const distanceFromBlue = getDistance(move, bluePos);
        return {
            move,
            score: futureOptions * 10 + distanceFromBlue
        };
    });

    // Sort by score (highest first)
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Make the best move
    redPos = scoredMoves[0].move;
    return true;
}

function checkGameOver() {
    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        gameOver = true;
        document.getElementById('message').textContent = 'You Win!';
        return true;
    }
    return false;
}

function handleMove(key) {
    if (gameOver) return;

    // Move red first
    if (moveRed()) {
        if (checkGameOver()) return;
    }

    // Then move blue
    const oldPos = { ...bluePos };
    switch (key) {
        case 'ArrowLeft': if (bluePos.x > 0) bluePos.x--; break;
        case 'ArrowRight': if (bluePos.x < GRID_SIZE - 1) bluePos.x++; break;
        case 'ArrowUp': if (bluePos.y > 0) bluePos.y--; break;
        case 'ArrowDown': if (bluePos.y < GRID_SIZE - 1) bluePos.y++; break;
    }

    if (canMove(oldPos, bluePos)) {
        if (checkGameOver()) return;
        removeRandomEdge();
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
