const board = document.getElementById("board");

let selectedPiece = null;
let currentPlayer = "white";
let whitePieces = 12;
let blackPieces = 12;
let isMultiCapturing = false;

function createBoard() {
    for (let i = 0; i < 8; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((i + j) % 2 === 0 ? "white" : "black");
            cell.dataset.row = i;
            cell.dataset.col = j;

            if (i < 3 && (i + j) % 2 !== 0) {
                addPiece(cell, "black", i, j);
            } else if (i > 4 && (i + j) % 2 !== 0) {
                addPiece(cell, "white", i, j);
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function addPiece(cell, color, row, col) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.col = col;
    piece.dataset.row = row;
    cell.appendChild(piece);
}

function getCell(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function getPiece(row, col) {
    const cell = getCell(row, col);
    return cell ? cell.querySelector(".piece") : null;
}

function getValidMoves(piece, captureOnly = false) {
    const row = parseInt(piece.dataset.row);
    const col = parseInt(piece.dataset.col);
    const color = piece.dataset.color;
    const moves = [];
    const captures = [];

    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const moveDirections = color === "white"
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const targetPiece = getPiece(newRow, newCol);

            if (targetPiece && targetPiece.dataset.color !== color) {
                const jumpRow = newRow + dRow;
                const jumpCol = newCol + dCol;

                if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
                    const jumpPiece = getPiece(jumpRow, jumpCol);
                    if (!jumpPiece) {
                        captures.push({
                            row: jumpRow,
                            col: jumpCol,
                            type: "capture",
                            capturedRow: newRow,
                            capturedCol: newCol
                        });
                    }
                }
            }
        }
    }

    if (captureOnly) {
        return captures;
    }

    if (captures.length === 0) {
        for (const [dRow, dCol] of moveDirections) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = getPiece(newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, type: "move" });
                }
            }
        }
    }

    return captures.length > 0 ? captures : moves;
}

function hasAnyCaptures(color) {
    const pieces = document.querySelectorAll(`.piece.${color}`);
    for (const piece of pieces) {
        const moves = getValidMoves(piece);
        if (moves.some(m => m.type === "capture")) {
            return true;
        }
    }
    return false;
}

function highlightValidMoves(moves) {
    clearHighlights();
    for (const move of moves) {
        const cell = getCell(move.row, move.col);
        cell.classList.add("valid-move");
        if (move.type === "capture") {
            cell.classList.add("capture-move");
        }
    }
}

function clearHighlights() {
    document.querySelectorAll(".valid-move").forEach(cell => {
        cell.classList.remove("valid-move", "capture-move");
    });
}

function clearSelection() {
    if (selectedPiece) {
        selectedPiece.classList.remove("selected");
        selectedPiece = null;
    }
    clearHighlights();
}

function movePiece(piece, targetRow, targetCol, capturedPiece = null) {
    const startRow = parseInt(piece.dataset.row);
    const startCol = parseInt(piece.dataset.col);
    const targetCell = getCell(targetRow, targetCol);

    const cellWidth = targetCell.offsetWidth;
    const cellHeight = targetCell.offsetHeight;
    const deltaRow = targetRow - startRow;
    const deltaCol = targetCol - startCol;

    piece.style.setProperty("--tx", `${deltaCol * cellWidth}px`);
    piece.style.setProperty("--ty", `${deltaRow * cellHeight}px`);

    setTimeout(() => {
        piece.style.setProperty("--tx", "0");
        piece.style.setProperty("--ty", "0");

        piece.dataset.row = targetRow;
        piece.dataset.col = targetCol;

        targetCell.appendChild(piece);

        if (capturedPiece) {
            const capturedRow = parseInt(capturedPiece.dataset.row);
            const capturedCol = parseInt(capturedPiece.dataset.col);
            const capturedColor = capturedPiece.dataset.color;

            capturedPiece.remove();

            if (capturedColor === "white") {
                whitePieces--;
            } else {
                blackPieces--;
            }

            const capturedCell = getCell(capturedRow, capturedCol);
            if (capturedCell) {
                const explosionContainer = document.createElement("div");
                explosionContainer.classList.add("explosion-container");

                const explosion = document.createElement("img");
                explosion.src = "./media/explosion-gif.gif";
                explosion.classList.add("explosion");
                explosionContainer.appendChild(explosion);
                capturedCell.appendChild(explosionContainer);

                setTimeout(() => {
                    explosionContainer.remove();
                }, 500);
            }
        }

        const additionalCaptures = getValidMoves(piece, true);
        if (capturedPiece && additionalCaptures.length > 0) {
            isMultiCapturing = true;
            selectedPiece = piece;
            piece.classList.add("selected");
            highlightValidMoves(additionalCaptures);
        } else {
            isMultiCapturing = false;
            currentPlayer = currentPlayer === "white" ? "black" : "white";
            clearSelection();
            checkVictory();
        }
    }, 300);
}

function checkVictory() {
    let winner = null;

    if (whitePieces === 0) {
        winner = "Чёрные";
    } else if (blackPieces === 0) {
        winner = "Белые";
    }

    if (winner) {
        showVictoryNotification(winner);
    }
}

function showVictoryNotification(winner) {
    const overlay = document.createElement("div");
    overlay.classList.add("victory-overlay");

    const notification = document.createElement("div");
    notification.classList.add("victory-notification");

    const title = document.createElement("h1");
    title.textContent = "Победа!";

    const message = document.createElement("p");
    message.textContent = `${winner} выиграли!`;

    const button = document.createElement("button");
    button.textContent = "Играть снова";
    button.addEventListener("click", () => {
        location.reload();
    });

    notification.appendChild(title);
    notification.appendChild(message);
    notification.appendChild(button);
    overlay.appendChild(notification);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.classList.add("show");
    }, 10);
}

board.addEventListener("click", (e) => {
    const piece = e.target.closest(".piece");
    const cell = e.target.closest(".cell");

    if (piece) {
        if (piece.dataset.color === currentPlayer) {
            if (isMultiCapturing) {
                if (piece !== selectedPiece) {
                    return;
                }
            }

            if (hasAnyCaptures(currentPlayer)) {
                const moves = getValidMoves(piece);
                if (!moves.some(m => m.type === "capture")) {
                    return;
                }
            }

            clearSelection();
            selectedPiece = piece;
            piece.classList.add("selected");
            const moves = getValidMoves(piece);
            highlightValidMoves(moves);
        }
    } else if (cell && selectedPiece) {
        const targetRow = parseInt(cell.dataset.row);
        const targetCol = parseInt(cell.dataset.col);
        const moves = getValidMoves(selectedPiece);

        const move = moves.find(m => m.row === targetRow && m.col === targetCol);
        if (move) {
            const capturedPiece = move.type === "capture"
                ? getPiece(move.capturedRow, move.capturedCol)
                : null;
            movePiece(selectedPiece, targetRow, targetCol, capturedPiece);
        }
    }
});

createBoard();
