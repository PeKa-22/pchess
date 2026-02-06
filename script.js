// script.js - Local 1 vs 1 usando chess.js (reglas).
// Click o drag & drop. Promoción a reina por defecto.

// Mapeo de piezas Unicode (visual simple)
const UNICODE = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

// DOM refs
const boardEl = document.getElementById('board');
const turnEl = document.getElementById('turn');
const resetBtn = document.getElementById('reset');
const gameStatusEl = document.getElementById('game-status');
const inCheckEl = document.getElementById('in-check');

let game = new Chess(); // chess.js
let selectedSquare = null;
let lastMove = null;

// Board coordinates
const files = ['a','b','c','d','e','f','g','h'];
const ranks = [8,7,6,5,4,3,2,1];

// Construir tablero DOM 8x8
function buildBoardDOM(){
  boardEl.innerHTML = '';
  for (let r of ranks){
    for (let f of files){
      const sq = `${f}${r}`;
      const square = document.createElement('div');
      square.className = 'square';
      const fileIndex = files.indexOf(f);
      const isLight = (fileIndex + (r % 2)) % 2 === 0;
      square.classList.add(isLight ? 'light' : 'dark');
      square.dataset.square = sq;
      square.setAttribute('role','button');
      square.setAttribute('aria-label', `Casilla ${sq}`);

      const piece = document.createElement('div');
      piece.className = 'piece';
      piece.draggable = true;

      // eventos
      square.addEventListener('click', onSquareClick);
      piece.addEventListener('dragstart', onDragStart);
      square.addEventListener('dragover', onDragOver);
      square.addEventListener('drop', onDrop);

      square.appendChild(piece);
      boardEl.appendChild(square);
    }
  }
}

// Render según estado de chess.js
function render(){
  // limpiar estilos
  document.querySelectorAll('.square').forEach(s => {
    s.classList.remove('selected','legal','last-move');
    const dot = s.querySelector('.move-dot'); if (dot) dot.remove();
  });

  const board = game.board();
  for (let r = 0; r < 8; r++){
    for (let f = 0; f < 8; f++){
      const sq = files[f] + ranks[r];
      const squareEl = document.querySelector(`.square[data-square="${sq}"]`);
      const pieceEl = squareEl.querySelector('.piece');
      pieceEl.textContent = '';
      pieceEl.classList.remove('w','b');
      const piece = board[r][f];
      if (piece){
        pieceEl.textContent = UNICODE[piece.type][piece.color];
        pieceEl.classList.add(piece.color);
      }
      // draggability: solo si la pieza pertenece al turno actual
      pieceEl.draggable = !!(piece && piece.color === game.turn());
    }
  }

  if (lastMove){
    const fromEl = document.querySelector(`.square[data-square="${lastMove.from}"]`);
    const toEl = document.querySelector(`.square[data-square="${lastMove.to}"]`);
    if (fromEl) fromEl.classList.add('last-move');
    if (toEl) toEl.classList.add('last-move');
  }

  turnEl.textContent = game.turn() === 'w' ? 'Blancas' : 'Negras';
  updateGameStatus();
}

// Click handlers
function onSquareClick(e){
  const square = e.currentTarget.dataset.square;
  handleSelection(square);
}

function handleSelection(square){
  // si se clica la misma sq deseleccionar
  if (selectedSquare === square){
    clearSelection();
    return;
  }

  const moves = game.moves({ square, verbose: true });
  const piece = game.get(square);
  // si hay movimientos legales y la pieza es del turno -> seleccionar
  if (moves.length > 0 && piece && piece.color === game.turn()){
    selectedSquare = square;
    highlightSelectedAndLegal(square, moves.map(m => m.to));
    return;
  }

  // si había una selección, intentar mover
  if (selectedSquare){
    attemptMove(selectedSquare, square);
  }
}

function clearSelection(){
  selectedSquare = null;
  document.querySelectorAll('.square').forEach(s => s.classList.remove('selected','legal'));
}

function highlightSelectedAndLegal(sq, targets = []){
  document.querySelectorAll('.square').forEach(s => s.classList.remove('selected','legal'));
  const sel = document.querySelector(`.square[data-square="${sq}"]`);
  if (sel) sel.classList.add('selected');
  targets.forEach(t => {
    const el = document.querySelector(`.square[data-square="${t}"]`);
    if (el) el.classList.add('legal');
  });
}

// Drag & drop handlers
function onDragStart(e){
  const parentSq = e.target.closest('.square');
  if (!parentSq) return;
  const from = parentSq.dataset.square;
  const piece = game.get(from);
  if (!piece || piece.color !== game.turn()){
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData('text/plain', from);
}

function onDragOver(e){ e.preventDefault(); }
function onDrop(e){
  e.preventDefault();
  const toSq = e.currentTarget.dataset.square;
  const from = e.dataTransfer.getData('text/plain');
  if (!from) return;
  attemptMove(from, toSq);
}

// Intentar movimiento (usa chess.js). Si promoción, promueve a reina por defecto.
function attemptMove(from, to){
  // promoción a reina por defecto
  const move = game.move({ from, to, promotion: 'q' });
  if (move){
    lastMove = { from: move.from, to: move.to };
    clearSelection();
    render();
  } else {
    clearSelection();
  }
}

// Estado del juego (jaque, mate, tablas)
function updateGameStatus(){
  if (game.isCheckmate()){
    gameStatusEl.textContent =
      `Jaque mate — ${game.turn() === 'w' ? 'Negras ganan' : 'Blancas ganan'}`;
    inCheckEl.textContent = '';
  } else if (
    game.isDraw() ||
    game.isStalemate() ||
    game.isThreefoldRepetition()
  ){
    gameStatusEl.textContent = 'Tablas';
    inCheckEl.textContent = '';
  } else {
    gameStatusEl.textContent = 'En juego';
    inCheckEl.textContent = game.isCheck() ? '¡Jaque!' : '';
  }
}


// Reiniciar partida
resetBtn.addEventListener('click', () => {
  game.reset();
  lastMove = null;
  clearSelection();
  render();
});

// Inicialización
buildBoardDOM();
render();

// Atajo 'r' para reiniciar
document.addEventListener('keydown', (e) => {
  if (e.key === 'r') {
    game.reset();
    lastMove = null;
    render();
  }
});