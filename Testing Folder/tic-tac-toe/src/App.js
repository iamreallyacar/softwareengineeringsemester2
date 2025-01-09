// Import useState hook from React for managing state - this is needed for tracking game state
import { useState } from 'react';

// Square component represents a single square button in the game
// It receives a value (X, O, or null) and a click handler as props
function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

// Board component manages the game board and handles square clicks
// It receives the current player (X or O), square values, and a play handler
function Board({ xIsNext, squares, onPlay }) {
  // handleClick is called when a square is clicked
  // It checks if the game is won or if square is already filled
  // If not, it updates the square with X or O based on current player
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i]) {
      return; // Do nothing if game is won or square is filled
    }
    const nextSquares = squares.slice(); // Create a copy of squares array
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares); // Send updated squares to parent component
  }

  // Check if there's a winner or if the game is a draw and update status message accordingly
  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else if (squares.every(square => square !== null)) {
    status = 'Draw';
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  // Render the game board with 3x3 grid of squares
  // Each square receives its current value and a click handler
  return (
    <>
      <div className="status">{status}</div>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

// Main Game component managing the entire game state
// This is the top-level component that handles game history and time travel
export default function Game() {
  // history stores all board states, currentMove tracks which move we're viewing
  // Array(9).fill(null) creates initial empty board state
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  
  // Determine current player (X plays on even moves, O on odd)
  const xIsNext = currentMove % 2 === 0;
  // Get current board state from history
  const currentSquares = history[currentMove];

  // handlePlay is called when a move is made
  // It updates history with new board state and advances currentMove
  function handlePlay(nextSquares) {
    // Remove any future moves if we're going back in time
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  // jumpTo allows players to view previous game states
  // This enables the "time travel" feature
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  // Create list of buttons for jumping to previous moves
  // This maps through history array to create time travel buttons
  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Go to move #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  // Render game board and move history side by side
  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

// Helper function to determine if there's a winner
// Checks all possible winning combinations of three squares
function calculateWinner(squares) {
  // All possible winning combinations defined by indices
  // For example, [0,1,2] represents top row, [0,3,6] represents left column
  const lines = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left column
    [1, 4, 7], // middle column
    [2, 5, 8], // right column
    [0, 4, 8], // diagonal from top-left
    [2, 4, 6], // diagonal from top-right
  ];
  // Check each winning combination
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    // If three squares in a line are all X or all O, we have a winner
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  // Return null if no winner found
  return null;
}