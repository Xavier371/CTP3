// Constants and Variables
const GRID_SIZE = 10;
const CELL_SIZE = 40;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

let edges = [];
let gameOver = false;
let gameMode = 'offense'; // 'offense' or 'defense'
let lastCapturePos = null;

let bluePos = {
    x: 0,
    y: 0
};

let redPos = {
    x: GRID_SIZE - 1,
    y: GRID_SIZE - 1
};

// Initialize edges
for (let i = 0; i < GRID_SIZE; i++) {
    edges[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
        edges[i][j] = {
            right: true,
            bottom: true
        };
    }
}

function updateGameTitle() {
    const title = document.getElementById('gameTitle');
    const subtitle = document.getElementById('gameSubtitle');
    const modeBtn = document.getElementById('modeBtn');
    
    if (gameMode === 'offense') {
        title.textContent = 'Try to catch the red point';
        subtitle.textContent = '';
        modeBtn.textContent = 'Offense';
        modeBtn.className = 'game-button';
    } else if (gameMode === 'defense') {
        title.textContent = 'Try to escape from the blue point';
        subtitle.textContent = '';
        modeBtn.textContent = 'Defense';
        modeBtn.className = 'game-button defense-mode';
    }
}

function drawGame() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // Draw edges
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (!edges[i][j].right && i < GRID_SIZE - 1) {
                ctx.beginPath();
                ctx.moveTo((i + 1) * CELL_SIZE, j * CELL_SIZE);
                ctx.lineTo((i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.stroke();
            }
            if (!edges[i][j].bottom && j < GRID_SIZE - 1) {
                ctx.beginPath();
                ctx.moveTo(i * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.lineTo((i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.stroke();
            }
        }
    }
    
    // Draw points
    const radius = CELL_SIZE / 3;
    
    // Draw blue point
    ctx.beginPath();
    ctx.arc(
        bluePos.x * CELL_SIZE + CELL_SIZE / 2,
        bluePos.y * CELL_SIZE + CELL_SIZE / 2,
        radius,
        0,
        2 * Math.PI
    );
    ctx.fillStyle = 'blue';
    ctx.fill();
    
    // Draw red point
    ctx.beginPath();
    ctx.arc(
        redPos.x * CELL_SIZE + CELL_SIZE / 2,
        redPos.y * CELL_SIZE + CELL_SIZE / 2,
        radius,
        0,
        2 * Math.PI
    );
    ctx.fillStyle = 'red';
    ctx.fill();

    // Draw purple capture point if applicable
    if (lastCapturePos) {
        ctx.beginPath();
        ctx.arc(
            lastCapturePos.x * CELL_SIZE + CELL_SIZE / 2,
            lastCapturePos.y * CELL_SIZE + CELL_SIZE / 2,
            radius,
            0,
            2 * Math.PI
        );
        ctx.fillStyle = 'purple';
        ctx.fill();
    }
}

function areAdjacent(pos1, pos2) {
    return (Math.abs(pos1.x - pos2.x) === 1 && pos1.y === pos2.y) ||
           (Math.abs(pos1.y - pos2.y) === 1 && pos1.x === pos2.x);
}

function canMove(from, to) {
    if (from.x === to.x && from.y === to.y) return false;
    if (!areAdjacent(from, to)) return false;

    if (from.x === to.x) {
        // Vertical movement
        const minY = Math.min(from.y, to.y);
        return edges[from.x][minY].bottom;
    } else {
        // Horizontal movement
        const minX = Math.min(from.x, to.x);
        return edges[minX][from.y].right;
    }
}

function getValidMoves(pos) {
    const moves = [];
    const directions = [
        {x: -1, y: 0}, // left
        {x: 1, y: 0},  // right
        {x: 0, y: -1}, // up
        {x: 0, y: 1}   // down
    ];

    for (let dir of directions) {
        const newPos = {
            x: pos.x + dir.x,
            y: pos.y + dir.y
        };

        if (newPos.x >= 0 && newPos.x < GRID_SIZE &&
            newPos.y >= 0 && newPos.y < GRID_SIZE &&
            canMove(pos, newPos)) {
            moves.push(newPos);
        }
    }

    return moves;
}

function findShortestPath(start, target) {
    const queue = [[start]];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (current.x === target.x && current.y === target.y) {
            return path;
        }

        const validMoves = getValidMoves(current);
        for (let move of validMoves) {
            const key = `${move.x},${move.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                const newPath = [...path, move];
                queue.push(newPath);
            }
        }
    }

    return null;
}

function moveRedEvade() {
    const validMoves = getValidMoves(redPos);
    if (validMoves.length === 0) return;

    // Find the move that maximizes distance from blue
    let bestMove = validMoves[0];
    let maxDistance = -1;

    for (let move of validMoves) {
        const distance = Math.abs(move.x - bluePos.x) + Math.abs(move.y - bluePos.y);
        if (distance > maxDistance) {
            maxDistance = distance;
            bestMove = move;
        }
    }

    redPos = bestMove;
}

function moveBlueAttack() {
    const path = findShortestPath(bluePos, redPos);
    if (path && path.length > 1) {
        bluePos = path[1];
    }
}

function handleMove(key) {
    if (gameOver) return;

    if (gameMode === 'defense') {
        // Defense mode: user controls red
        const oldPos = { ...redPos };
        switch (key) {
            case 'ArrowLeft': if (redPos.x > 0) redPos.x--; break;
            case 'ArrowRight': if (redPos.x < GRID_SIZE - 1) redPos.x++; break;
            case 'ArrowUp': if (redPos.y > 0) redPos.y--; break;
            case 'ArrowDown': if (redPos.y < GRID_SIZE - 1) redPos.y++; break;
            default: return;
        }

        if (canMove(oldPos, redPos)) {
            removeRandomEdge();
            if (!checkGameOver()) {
                moveBlueAttack();
                removeRandomEdge();
                checkGameOver();
            }
        } else {
            redPos = oldPos;
        }
    } else {
        // Offense mode: user controls blue
        const oldPos = { ...bluePos };
        switch (key) {
            case 'ArrowLeft': if (bluePos.x > 0) bluePos.x--; break;
            case 'ArrowRight': if (bluePos.x < GRID_SIZE - 1) bluePos.x++; break;
            case 'ArrowUp': if (bluePos.y > 0) bluePos.y--; break;
            case 'ArrowDown': if (bluePos.y < GRID_SIZE - 1) bluePos.y++; break;
            default: return;
        }

        if (canMove(oldPos, bluePos)) {
            removeRandomEdge();
            if (!checkGameOver()) {
                moveRedEvade();
                removeRandomEdge();
                checkGameOver();
            }
        } else {
            bluePos = oldPos;
        }
    }
    
    drawGame();
}

function removeRandomEdge() {
    const availableEdges = [];
    
    // Collect all available edges
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (i < GRID_SIZE - 1 && edges[i][j].right) {
                availableEdges.push({x: i, y: j, type: 'right'});
            }
            if (j < GRID_SIZE - 1 && edges[i][j].bottom) {
                availableEdges.push({x: i, y: j, type: 'bottom'});
            }
        }
    }
    
    if (availableEdges.length > 0) {
        const edge = availableEdges[Math.floor(Math.random() * availableEdges.length)];
        edges[edge.x][edge.y][edge.type] = false;
    }
}

function checkGameOver() {
    if (areAdjacent(bluePos, redPos) && canMove(bluePos, redPos)) {
        gameOver = true;
        lastCapturePos = {...redPos};
        
        if (gameMode === 'offense') {
            setTimeout(() => alert("Blue Wins - Points are joined!"), 100);
        } else if (gameMode === 'defense') {
            setTimeout(() => alert("Blue Wins - Red is captured!"), 100);
        }
        return true;
    }
    return false;
}

function resetGame() {
    bluePos = {x: 0, y: 0};
    redPos = {x: GRID_SIZE - 1, y: GRID_SIZE - 1};
    
    for (let i = 0; i < GRID_SIZE; i++) {
        edges[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            edges[i][j] = {
                right: true,
                bottom: true
            };
        }
    }
    
    gameOver = false;
    lastCapturePos = null;
    drawGame();
}

function toggleMode() {
    gameMode = gameMode === 'offense' ? 'defense' : 'offense';
    updateGameTitle();
    resetGame();
}

function showInstructions() {
    document.getElementById('instructionsModal').style.display = 'block';
}

function closeInstructions() {
    document.getElementById('instructionsModal').style.display = 'none';
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    e.preventDefault();
    
    if (e.key === 'Enter') {
        resetGame();
        return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleMove(e.key);
    }
});

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('modeBtn').addEventListener('click', toggleMode);
document.getElementById('helpBtn').addEventListener('click', showInstructions);
document.getElementById('closeInstructions').addEventListener('click', closeInstructions);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const instructionsModal = document.getElementById('instructionsModal');
    if (e.target === instructionsModal) {
        instructionsModal.style.display = 'none';
    }
});

// Initialize game
window.onload = function() {
    updateGameTitle();
    drawGame();
}
