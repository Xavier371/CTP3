const GRID_SIZE = 6;
const CELL_SIZE = Math.min(window.innerWidth, window.innerHeight) * 0.7 / GRID_SIZE;
const POINT_RADIUS = CELL_SIZE / 6;

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

canvas.width = CELL_SIZE * GRID_SIZE;
canvas.height = CELL_SIZE * GRID_SIZE;

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
                active: true,
                opacity: 1
            });
        }
    }
    // Vertical edges
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 1; y++) {
            edges.push({
                x1: x, y1: y,
                x2: x, y2: y + 1,
                active: true,
                opacity: 1
            });
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
        if (edge.active || edge.opacity > 0) {
            ctx.beginPath();
            ctx.moveTo(edge.x1 * CELL_SIZE, edge.y1 * CELL_SIZE);
            ctx.lineTo(edge.x2 * CELL_SIZE, edge.y2 * CELL_SIZE);
            ctx.strokeStyle = `rgba(0, 0, 0, ${edge.opacity})`;
            ctx.stroke();
        }
    });

    // Draw blue point
    ctx.beginPath();
    ctx.arc(bluePos.x * CELL_SIZE, bluePos.y * CELL_SIZE, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();

    // Draw red point
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
        fadeEdge(edge);
    }
}

function fadeEdge(edge) {
    const fadeInterval = setInterval(() => {
        edge.opacity -= 0.1;
        if (edge.opacity <= 0) {
            clearInterval(fadeInterval);
        }
        drawGame();
    }, 50);
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
        const newPos = validMoves[Math.floor(Math.random() * validMoves.length)];
        redPos = newPos;
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
