const GRID_SIZE = 6;
const CELL_SIZE = 80;
const POINT_RADIUS = 8;

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

canvas.width = CELL_SIZE * GRID_SIZE;
canvas.height = CELL_SIZE * GRID_SIZE;

let bluePos = { x: 0, y: GRID_SIZE - 1 };
let redPos = { x: GRID_SIZE - 1, y: 0 };
let edges = [];
let gameOver = false;

function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
    };
}

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
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

    const drawPoint = (pos, color) => {
        ctx.beginPath();
        ctx.arc(
            pos.x * CELL_SIZE,
            pos.y * CELL_SIZE,
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

    if (!(bluePos.x === redPos.x && bluePos.y === redPos.y)) {
        drawPoint(redPos, 'red');
    }
    drawPoint(bluePos, 'blue');
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
        // Don't remove edges between blue and red points if they're adjacent
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
            queue.push([...path, move]);
        });
    }
    
    return null;
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

function evaluatePosition(pos, depth = 2) {
    if (depth === 0) return getValidMoves(pos).length;
    
    const moves = getValidMoves(pos);
    if (moves.length === 0) return 0;
    
    return Math.max(...moves.map(move => evaluatePosition(move, depth - 1))) + moves.length;
}

function moveRed() {
    const validMoves = getValidMoves(redPos);
    if (validMoves.length === 0) return false;

    // Filter out moves that would place red adjacent to blue if alternatives exist
    const isAdjacentToBlue = (pos) => {
        return Math.abs(pos.x - bluePos.x) + Math.abs(pos.y - bluePos.y) === 1;
    };

    let availableMoves = validMoves;
    const saferMoves = validMoves.filter(move => !isAdjacentToBlue(move));
    
    // Only use safer moves if they exist
    if (saferMoves.length > 0) {
        availableMoves = saferMoves;
    }

    const scoredMoves = availableMoves.map(move => {
        const pathToBlue = findShortestPath(bluePos, move);
        const distanceFromBlue = pathToBlue ? pathToBlue.length : Infinity;
        const futureOptions = evaluatePosition(move);
        const immediateOptions = getValidMoves(move).length;
        
        const currentPathToBlue = findShortestPath(bluePos, redPos);
        const currentDistance = currentPathToBlue ? currentPathToBlue.length : Infinity;
        
        // Increased penalty for moving adjacent to blue
        const adjacencyPenalty = isAdjacentToBlue(move) ? -2000 : 0;
        const distancePenalty = distanceFromBlue < currentDistance ? -1000 : 0;
        
        return {
            move,
            score: distanceFromBlue * 10 + futureOptions * 5 + 
                   immediateOptions * 3 + distancePenalty + adjacencyPenalty
        };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    
    if (scoredMoves.length > 0) {
        redPos = scoredMoves[0].move;
        return true;
    }
    
    return false;
}

function checkGameOver() {
    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        gameOver = true;
        document.getElementById('message').textContent = 'You Win!';
        return true;
    }
    
    const path = findShortestPath(bluePos, redPos);
    if (!path) {
        gameOver = true;
        document.getElementById('message').textContent = 'Game Over - Points are separated!';
        return true;
    }
    
    return false;
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
        // First check if player caught the red point
        if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
            checkGameOver();
            drawGame();
            return;
        }

        // Remove edge and redraw
        removeRandomEdge();
        drawGame();

        // Move red point
        if (moveRed()) {
            drawGame();
        }

        // Check for game over after all moves are complete
        if (checkGameOver()) {
            drawGame();
            return;
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
