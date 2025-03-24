const GRID_SIZE = 6;
const CELL_SIZE = 500 / GRID_SIZE;
const POINT_RADIUS = Math.min(CELL_SIZE / 4, 15);
const PADDING = CELL_SIZE; // Add padding around the grid

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Set canvas size including padding
canvas.width = CELL_SIZE * GRID_SIZE + (PADDING * 2);
canvas.height = CELL_SIZE * GRID_SIZE + (PADDING * 2);

let bluePos = { x: 0, y: GRID_SIZE - 1 };
let redPos = { x: GRID_SIZE - 1, y: 0 };
let edges = [];
let gameOver = false;

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

    // Draw active edges
    edges.forEach(edge => {
        if (edge.active) {
            ctx.beginPath();
            ctx.moveTo(edge.x1 * CELL_SIZE + PADDING, edge.y1 * CELL_SIZE + PADDING);
            ctx.lineTo(edge.x2 * CELL_SIZE + PADDING, edge.y2 * CELL_SIZE + PADDING);
            ctx.strokeStyle = '#666';
            ctx.stroke();
        }
    });

    // Draw points
    ctx.beginPath();
    ctx.arc(
        bluePos.x * CELL_SIZE + PADDING, 
        bluePos.y * CELL_SIZE + PADDING, 
        POINT_RADIUS, 
        0, 
        Math.PI * 2
    );
    ctx.fillStyle = 'blue';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
        redPos.x * CELL_SIZE + PADDING, 
        redPos.y * CELL_SIZE + PADDING, 
        POINT_RADIUS, 
        0, 
        Math.PI * 2
    );
    ctx.fillStyle = 'red';
    ctx.fill();
}

// Rest of the functions remain the same
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
        // Calculate distances from blue point for each possible move
        const movesWithDistances = validMoves.map(move => {
            const dx = move.x - bluePos.x;
            const dy = move.y - bluePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return { move, distance };
        });

        // Sort by distance (furthest first)
        movesWithDistances.sort((a, b) => b.distance - a.distance);

        // Take the move that maximizes distance from blue
        redPos = movesWithDistances[0].move;
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
    bluePos = { x: 0, y: GRID_SIZE - 1 };
    redPos = { x: GRID_SIZE - 1, y: 0 };
    gameOver = false;
    document.getElementById('message').textContent = '';
    initializeEdges();
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
