const GRID_SIZE = 6;
const CELL_SIZE = 80;
const POINT_RADIUS = 8;
const POINT_OFFSET = CELL_SIZE / 2;

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

canvas.width = CELL_SIZE * GRID_SIZE;
canvas.height = CELL_SIZE * GRID_SIZE;

let bluePos = { x: 0, y: GRID_SIZE - 1 };
let redPos = { x: GRID_SIZE - 1, y: 0 };
let edges = [];
let gameOver = false;
let gameMode = 'offense'; // 'offense', 'defense', or 'twoPlayer'
let redTurn = true; // Red always moves first

function updateGameTitle() {
    const title = document.getElementById('gameTitle');
    if (gameMode === 'offense') {
        title.textContent = 'Try to catch the red point!';
    } else if (gameMode === 'defense') {
        title.textContent = 'Try to escape from the red point!';
    } else {
        title.textContent = 'Two Player Mode';
    }
}

function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
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

    // Draw edges
    edges.forEach(edge => {
        if (edge.active) {
            ctx.beginPath();
            ctx.moveTo(edge.x1 * CELL_SIZE + POINT_OFFSET, edge.y1 * CELL_SIZE + POINT_OFFSET);
            ctx.lineTo(edge.x2 * CELL_SIZE + POINT_OFFSET, edge.y2 * CELL_SIZE + POINT_OFFSET);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    // Draw points
    const drawPoint = (pos, color) => {
        ctx.beginPath();
        ctx.arc(
            pos.x * CELL_SIZE + POINT_OFFSET,
            pos.y * CELL_SIZE + POINT_OFFSET,
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

    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        drawPoint(bluePos, '#8A2BE2'); // Purple when overlapping
    } else {
        drawPoint(redPos, 'red');
        drawPoint(bluePos, 'blue');
    }
}

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function isEdgeBetweenPoints(edge, pos1, pos2) {
    return (
        (edge.x1 === pos1.x && edge.y1 === pos1.y && edge.x2 === pos2.x && edge.y2 === pos2.y) ||
        (edge.x2 === pos1.x && edge.y2 === pos1.y && edge.x1 === pos2.x && edge.y1 === pos2.y)
    );
}

function removeRandomEdge() {
    const activeEdges = edges.filter(edge => {
        if (!edge.active) return false;
        // Don't remove edge between points if they're adjacent
        if (getDistance(bluePos, redPos) === 1 && 
            isEdgeBetweenPoints(edge, bluePos, redPos)) {
            return false;
        }
        return true;
    });

    if (activeEdges.length > 0) {
        const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
        edge.active = false;
        return true;
    }
    return false;
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

function findShortestPath(start, end) {
    const visited = new Set();
    const queue = [[start]];
    
    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];
        const key = `${current.x},${current.y}`;
        
        if (current.x === end.x && current.y === end.y) return path;
        if (visited.has(key)) continue;
        
        visited.add(key);
        const moves = getValidMoves(current);
        moves.forEach(move => {
            if (!visited.has(`${move.x},${move.y}`)) {
                queue.push([...path, move]);
            }
        });
    }
    
    return null;
}

function moveRedEvade() {
    const validMoves = getValidMoves(redPos);
    if (validMoves.length === 0) return;

    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (let move of validMoves) {
        let score = 0;
        
        // Factor 1: Path length from blue to this position
        const pathToBlue = findShortestPath(bluePos, move);
        if (pathToBlue) {
            score += pathToBlue.length * 2; // Weight path length heavily
        } else {
            score += GRID_SIZE * 2; // If no path exists, that's very good
        }

        // Factor 2: Count remaining edges in the area
        let remainingEdges = 0;
        const checkRadius = 2; // Check surrounding area
        for (let i = Math.max(0, move.x - checkRadius); i <= Math.min(GRID_SIZE - 1, move.x + checkRadius); i++) {
            for (let j = Math.max(0, move.y - checkRadius); j <= Math.min(GRID_SIZE - 1, move.y + checkRadius); j++) {
                if (i < GRID_SIZE - 1 && edges[i][j].right) remainingEdges++;
                if (j < GRID_SIZE - 1 && edges[i][j].bottom) remainingEdges++;
            }
        }
        score -= remainingEdges; // Prefer areas with fewer edges

        // Factor 3: Number of escape routes from this position
        const escapeRoutes = getValidMoves(move).length;
        score -= escapeRoutes * 0.5; // Slightly prefer positions with fewer escape routes
                                    // as they're more likely to become isolated after edge removal

        // Factor 4: Distance from corners and edges
        const cornerDistance = Math.min(
            Math.hypot(move.x, move.y), // Distance from top-left
            Math.hypot(move.x, GRID_SIZE - 1 - move.y), // Distance from bottom-left
            Math.hypot(GRID_SIZE - 1 - move.x, move.y), // Distance from top-right
            Math.hypot(GRID_SIZE - 1 - move.x, GRID_SIZE - 1 - move.y) // Distance from bottom-right
        );
        score -= cornerDistance * 0.5; // Slightly prefer corners as they naturally have fewer edges

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    redPos = bestMove;
}

function moveRedAttack() {
    const path = findShortestPath(redPos, bluePos);
    if (!path || path.length < 2) return false;
    
    // Move one step along the shortest path
    redPos = path[1];
    return true;
}

function checkGameOver() {
    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        gameOver = true;
        if (gameMode === 'offense') {
            document.getElementById('message').textContent = 'Blue Wins - Points are joined!';
        } else if (gameMode === 'defense') {
            document.getElementById('message').textContent = 'Red Wins - Points are joined!';
        } else {
            document.getElementById('message').textContent = 'Blue Wins - Points are joined!';
        }
        return true;
    }
    
    const path = findShortestPath(bluePos, redPos);
    if (!path) {
        gameOver = true;
        if (gameMode === 'offense') {
            document.getElementById('message').textContent = 'Red Wins - Points are separated!';
        } else if (gameMode === 'defense') {
            document.getElementById('message').textContent = 'Blue Wins - Points are separated!';
        } else {
            document.getElementById('message').textContent = 'Red Wins - Points are separated!';
        }
        return true;
    }
    
    return false;
}

function handleMove(key) {
    if (gameOver) return;

    if (gameMode === 'twoPlayer') {
        if (redTurn) {
            // Red's turn (WASD)
            const oldPos = { ...redPos };
            switch (key) {
                case 'w': if (redPos.y > 0) redPos.y--; break;
                case 's': if (redPos.y < GRID_SIZE - 1) redPos.y++; break;
                case 'a': if (redPos.x > 0) redPos.x--; break;
                case 'd': if (redPos.x < GRID_SIZE - 1) redPos.x++; break;
                default: return;
            }

            if (canMove(oldPos, redPos)) {
                removeRandomEdge();
                redTurn = false;  // Switch to blue's turn
                if (checkGameOver()) {
                    drawGame();
                    return;
                }
            } else {
                redPos = oldPos;
            }
        } else {
            // Blue's turn (Arrow keys)
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
                redTurn = true;  // Switch back to red's turn
                if (checkGameOver()) {
                    drawGame();
                    return;
                }
            } else {
                bluePos = oldPos;
            }
        }
    } else {
        // Single-player mode logic remains unchanged
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
                if (gameMode === 'offense') {
                    moveRedEvade();
                } else {
                    moveRedAttack();
                }
                removeRandomEdge();
                checkGameOver();
            }
        } else {
            bluePos = oldPos;
        }
    }
    
    drawGame();
}

// Update the event listener to handle both players' turns

function toggleMode() {
    if (gameMode === 'offense') {
        gameMode = 'defense';
        document.getElementById('modeBtn').textContent = 'Defense';
    } else if (gameMode === 'defense') {
        gameMode = 'twoPlayer';
        document.getElementById('modeBtn').textContent = 'Two Player';
    } else {
        gameMode = 'offense';
        document.getElementById('modeBtn').textContent = 'Offense';
    }
    resetGame();
}

function showInstructions() {
    const modal = document.getElementById('instructionsModal');
    modal.style.display = "block";
}

function closeInstructions() {
    const modal = document.getElementById('instructionsModal');
    modal.style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('instructionsModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

document.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (gameMode === 'twoPlayer') {
        if (redTurn && ['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
            handleMove(e.key.toLowerCase());
        } else if (!redTurn && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            handleMove(e.key);
        }
    } else {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            handleMove(e.key);
        }
    }
});

// Make sure redTurn is properly initialized in resetGame
function resetGame() {
    gameOver = false;
    redTurn = true;  // Red always starts
    document.getElementById('message').textContent = '';
    initializeEdges();
    initializePositions();
    updateGameTitle();
    drawGame();
}

// Initialize game
resetGame();
