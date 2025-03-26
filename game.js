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
let gameMode = 'offense';
let lastCapturePos = null;
let lastMoveWasBlue = false;

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
        title.textContent = 'Try to catch the red point!';
        subtitle.textContent = '';
        modeBtn.textContent = 'Offense';
        modeBtn.className = 'game-button';
    } else if (gameMode === 'defense') {
        title.textContent = 'Try to escape from the blue point!';
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
    
    // Draw edges (walls)
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

function evaluatePosition(pos, isRed) {
    let score = 0;
    
    // Count available moves (mobility)
    const validMoves = getValidMoves(pos);
    score += validMoves.length * 2;
    
    // Evaluate distance from center (red prefers edges, blue prefers center)
    const centerDist = Math.abs(pos.x - GRID_SIZE/2) + Math.abs(pos.y - GRID_SIZE/2);
    score += isRed ? centerDist : -centerDist;
    
    // Count surrounding edges (red prefers fewer, blue prefers more)
    let surroundingEdges = 0;
    [-1, 0, 1].forEach(dx => {
        [-1, 0, 1].forEach(dy => {
            const x = pos.x + dx;
            const y = pos.y + dy;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                if (x < GRID_SIZE - 1 && edges[x][y].right) surroundingEdges++;
                if (y < GRID_SIZE - 1 && edges[x][y].bottom) surroundingEdges++;
            }
        });
    });
    score += isRed ? -surroundingEdges : surroundingEdges;
    
    return score;
}

function moveRedEvade() {
    const validMoves = getValidMoves(redPos);
    if (validMoves.length === 0) return;

    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (let move of validMoves) {
        let score = 0;
        
        // Factor 1: Path length from blue (most important)
        const pathToBlue = findShortestPath(bluePos, move);
        if (pathToBlue) {
            score += pathToBlue.length * 3;
        } else {
            score += GRID_SIZE * 3; // Heavily reward positions with no path to blue
        }
        
        // Factor 2: Count open directions (prefer more escape routes)
        const futureValidMoves = getValidMoves(move);
        score += futureValidMoves.length * 2;
        
        // Factor 3: Prefer corners when blocked
        if (futureValidMoves.length <= 2) {
            const isCorner = (move.x === 0 || move.x === GRID_SIZE - 1) && 
                           (move.y === 0 || move.y === GRID_SIZE - 1);
            if (isCorner) score += 5;
        }
        
        // Factor 4: Avoid getting trapped
        const blueValidMoves = getValidMoves(bluePos);
        for (let blueMove of blueValidMoves) {
            const futurePathToBlue = findShortestPath(blueMove, move);
            if (futurePathToBlue && futurePathToBlue.length < 3) {
                score -= 10; // Heavily penalize positions that could get trapped
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    redPos = bestMove;
}

function moveBlueAttack() {
    const validMoves = getValidMoves(bluePos);
    if (validMoves.length === 0) return;

    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (let move of validMoves) {
        let score = 0;
        
        // Factor 1: Path length to red (primary goal)
        const pathToRed = findShortestPath(move, redPos);
        score -= pathToRed ? pathToRed.length * 3 : GRID_SIZE * 3;
        
        // Factor 2: Position evaluation
        score += evaluatePosition(move, false) * 2;
        
        // Factor 3: Cut off escape routes
        const redEscapeRoutes = getValidMoves(redPos);
        score -= redEscapeRoutes.length * 2;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    bluePos = bestMove;
}

function handleMove(key) {
    if (gameOver) return;

    if (gameMode === 'twoPlayer') {
        // Handle WASD for red point
        if (['w', 'a', 's', 'd'].includes(key.toLowerCase())) {
            const oldPos = { ...redPos };
            switch (key.toLowerCase()) {
                case 'w': if (redPos.y > 0) redPos.y--; break;
                case 's': if (redPos.y < GRID_SIZE - 1) redPos.y++; break;
                case 'a': if (redPos.x > 0) redPos.x--; break;
                case 'd': if (redPos.x < GRID_SIZE - 1) redPos.x++; break;
            }
            if (!canMove(oldPos, redPos)) {
                redPos = oldPos;
            }
        }
        // Handle arrow keys for blue point
        else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            const oldPos = { ...bluePos };
            switch (key) {
                case 'ArrowLeft': if (bluePos.x > 0) bluePos.x--; break;
                case 'ArrowRight': if (bluePos.x < GRID_SIZE - 1) bluePos.x++; break;
                case 'ArrowUp': if (bluePos.y > 0) bluePos.y--; break;
                case 'ArrowDown': if (bluePos.y < GRID_SIZE - 1) bluePos.y++; break;
            }
            if (!canMove(oldPos, bluePos)) {
                bluePos = oldPos;
            }
        }
    } else {
        // Single player mode (existing offense/defense logic)
        const oldPos = gameMode === 'defense' ? { ...redPos } : { ...bluePos };
        switch (key) {
            case 'ArrowLeft': if (oldPos.x > 0) oldPos.x--; break;
            case 'ArrowRight': if (oldPos.x < GRID_SIZE - 1) oldPos.x++; break;
            case 'ArrowUp': if (oldPos.y > 0) oldPos.y--; break;
            case 'ArrowDown': if (oldPos.y < GRID_SIZE - 1) oldPos.y++; break;
            default: return;
        }

        if (canMove(gameMode === 'defense' ? redPos : bluePos, oldPos)) {
            if (gameMode === 'defense') {
                redPos = oldPos;
                if (!checkGameOver()) {
                    moveBlueAttack();
                    checkGameOver();
                }
            } else {
                bluePos = oldPos;
                if (!checkGameOver()) {
                    moveRedEvade();
                    checkGameOver();
                }
            }
        }
    }
    
    checkGameOver();
    drawGame();
}


function removeRandomEdge() {
    const availableEdges = [];
    const centerX = (GRID_SIZE - 1) / 2;
    const centerY = (GRID_SIZE - 1) / 2;
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            // Calculate center bias (0 to 1, where 1 is most central)
            const distanceFromCenter = 1 - (Math.abs(i - centerX) + Math.abs(j - centerY)) / (GRID_SIZE - 1);
            const weight = Math.floor(distanceFromCenter * 2) + 1;
            
            if (i < GRID_SIZE - 1 && edges[i][j].right) {
                for (let w = 0; w < weight; w++) {
                    availableEdges.push({x: i, y: j, type: 'right'});
                }
            }
            if (j < GRID_SIZE - 1 && edges[i][j].bottom) {
                for (let w = 0; w < weight; w++) {
                    availableEdges.push({x: i, y: j, type: 'bottom'});
                }
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
        // Only end game if red has no valid moves to escape
        if (gameMode === 'offense' && !lastMoveWasBlue) {
            const validMoves = getValidMoves(redPos);
            if (validMoves.length > 0) {
                return false; // Red can still escape
            }
        }
        gameOver = true;
        lastCapturePos = {...redPos};
        setTimeout(() => alert(gameMode === 'offense' ? 
            "Blue Wins - Points are joined!" : 
            "Blue Wins - Red is captured!"), 100);
        return true;
    }
    return false;
}

function resetGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    // Random position on top row for blue
    bluePos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: 0
    };
    
    // Random position on bottom row for red
    redPos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: GRID_SIZE - 1
    };
    
    // Ensure minimum starting distance
    while (Math.abs(bluePos.x - redPos.x) < Math.floor(GRID_SIZE * 0.5)) {
        redPos.x = Math.floor(Math.random() * GRID_SIZE);
    }
    
    // Reset edges
    for (let i = 0; i < GRID_SIZE; i++) {
        edges[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            edges[i][j] = {
                right: true,
                bottom: true
            };
        }
    }
    
    // Remove more initial edges in offense mode for balance
    if (gameMode === 'offense') {
        const initialEdges = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < initialEdges; i++) {
            removeRandomEdge();
        }
    }
    
    gameOver = false;
    lastCapturePos = null;
    lastMoveWasBlue = false;
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
// Also add this event listener right after your other event listeners:
document.addEventListener('keydown', (e) => {
    e.preventDefault();
    
    if (e.key === 'Enter') {
        resetGame();
        return;
    }

    // Handle both WASD and arrow keys in two-player mode
    if (gameMode === 'twoPlayer') {
        if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            handleMove(e.key);
        }
    } else {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            handleMove(e.key);
        }
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
    resetGame();
}
