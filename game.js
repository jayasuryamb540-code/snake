// Game Configuration
const boardSize = 10;
const totalCells = 100;
// Snakes: Start -> End (Go Down)
const snakes = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
// Ladders: Start -> End (Go Up)
const ladders = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

let playerPos = 1;
let isRolling = false;

const boardEl = document.getElementById('board');
const svgEl = document.getElementById('board-svg');
const statusEl = document.getElementById('game-status');
const diceEl = document.getElementById('dice-display');
const rollBtn = document.getElementById('roll-btn');
const resetBtn = document.getElementById('reset-btn');

// Create player element
const playerEl = document.createElement('div');
playerEl.className = 'player';
boardEl.appendChild(playerEl);

// ---- Initialization ----
function initBoard() {
    // Generate Cells
    boardEl.innerHTML = ''; // Clear
    boardEl.appendChild(svgEl); // Re-add SVG
    boardEl.appendChild(playerEl); // Re-add Player

    // Create 100 cells
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            // Calculate cell number based on zigzag
            let logicRow = (boardSize - 1) - row;
            let number;

            if (logicRow % 2 === 0) {
                // Even logic row (0, 2...) -> Left to Right
                number = logicRow * boardSize + col + 1;
            } else {
                // Odd logic row (1, 3...) -> Right to Left
                number = logicRow * boardSize + (boardSize - 1 - col) + 1;
            }

            cell.innerText = number;
            cell.dataset.num = number;
            cell.style.gridRow = row + 1;
            cell.style.gridColumn = col + 1;
            boardEl.appendChild(cell);
        }
    }

    drawConnectors();
    updatePlayerPosition(1, false); // Instant reset
}

// Helper to get center coordinates of a cell number relative to board
function getCellCenter(num) {
    const cells = document.querySelectorAll('.cell');
    for (let cell of cells) {
        if (parseInt(cell.dataset.num) === num) {
            return {
                x: cell.offsetLeft + cell.offsetWidth / 2,
                y: cell.offsetTop + cell.offsetHeight / 2
            };
        }
    }
    return { x: 0, y: 0 };
}

// Draw Snakes and Ladders using SVG lines
function drawConnectors() {
    let svgHTML = '';

    // Draw Snakes (Red)
    for (const [start, end] of Object.entries(snakes)) {
        const s = getCellCenter(parseInt(start));
        const e = getCellCenter(end);
        svgHTML += `<line x1="${s.x}" y1="${s.y}" x2="${e.x}" y2="${e.y}" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round" opacity="0.6" />`;
        svgHTML += `<circle cx="${s.x}" cy="${s.y}" r="4" fill="#ff4d4d" />`; // Head
    }

    // Draw Ladders (Green)
    for (const [start, end] of Object.entries(ladders)) {
        const s = getCellCenter(parseInt(start));
        const e = getCellCenter(end);
        svgHTML += `<line x1="${s.x}" y1="${s.y}" x2="${e.x}" y2="${e.y}" stroke="#4dff88" stroke-width="4" stroke-linecap="round" stroke-dasharray="5,5" opacity="0.8" />`;
    }

    svgEl.innerHTML = svgHTML;
}

function updatePlayerPosition(num, animate = true) {
    playerPos = num;
    const coords = getCellCenter(playerPos);

    playerEl.style.transition = animate ? 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none';
    playerEl.style.left = coords.x + 'px';
    playerEl.style.top = coords.y + 'px';
}

// Game Logic
async function rollDice() {
    if (isRolling) return;
    isRolling = true;
    rollBtn.disabled = true;
    statusEl.innerText = "Rolling...";

    // Dice animation
    let rolls = 0;
    const maxRolls = 10;
    const interval = setInterval(() => {
        diceEl.innerText = Math.floor(Math.random() * 6) + 1;
        rolls++;
        if (rolls >= maxRolls) {
            clearInterval(interval);
            finalizeMove();
        }
    }, 60);
}

async function finalizeMove() {
    const diceVal = Math.floor(Math.random() * 6) + 1;
    diceEl.innerText = diceVal;
    statusEl.innerText = `You rolled a ${diceVal}!`;

    let nextPos = playerPos + diceVal;

    if (nextPos > 100) {
        statusEl.innerText = `Need ${100 - playerPos} to win!`;
        isRolling = false;
        rollBtn.disabled = false;
        return;
    }

    // Move Player
    updatePlayerPosition(nextPos);
    await new Promise(r => setTimeout(r, 600)); // Wait for move

    // Check Win
    if (nextPos === 100) {
        statusEl.innerText = "🎉 YOU WIN! 🎉";
        isRolling = false;
        return;
    }

    // Check Snake
    if (snakes[nextPos]) {
        statusEl.innerText = "Oh no! A snake! 🐍";
        await new Promise(r => setTimeout(r, 500));
        updatePlayerPosition(snakes[nextPos]);
        statusEl.innerText = `Slid down to ${snakes[nextPos]}`;
    }

    // Check Ladder
    if (ladders[nextPos]) {
        statusEl.innerText = "Yay! A ladder! 🪜";
        await new Promise(r => setTimeout(r, 500));
        updatePlayerPosition(ladders[nextPos]);
        statusEl.innerText = `Climbed up to ${ladders[nextPos]}`;
    }

    playerPos = parseInt(playerEl.style.left) ? playerPos : nextPos; // Sync just in case

    // Final check after slide/climb
    if (playerPos === 100) {
        statusEl.innerText = "🎉 YOU WIN! 🎉";
    } else {
        statusEl.innerText = "Your turn to roll.";
    }

    isRolling = false;
    rollBtn.disabled = false;
}

rollBtn.addEventListener('click', rollDice);
resetBtn.addEventListener('click', () => {
    playerPos = 1;
    updatePlayerPosition(1);
    statusEl.innerText = "Start the game!";
    diceEl.innerText = "🎲";
    rollBtn.disabled = false;
    isRolling = false;
});

// Initialize on Load
window.addEventListener('load', initBoard);
window.addEventListener('resize', () => {
    drawConnectors();
    updatePlayerPosition(playerPos, false);
});
