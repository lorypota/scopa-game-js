class PRNG {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    return this.seed = this.seed * 16807 % 2147483647;
  }

  nextFloat() {
    return (this.next() - 1) / 2147483646;
  }
}

const user = '4ID';
const pass = 'Grena';
const credentials = btoa(`${user}:${pass}`);  // codifica in base64 le credenziali

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');
const username = urlParams.get('username');

let playerId;
let prng;

let deck;
let moves;
let board = [];
let myCards = [];
let theirCardsNum;

let firstPlayerInterval;
let gameStateInterval;

if (gameId === null || username === null) {
  alert('Game ID or username not provided. Please join a game from the lobby.');
  window.location.href = 'index.html';  
} else {
  console.log(`Game ID: ${gameId}, Username: ${username}`);

  startGame();
}

// Funzione per ottenere la lista delle partite disponibili
async function savePlayerId() {
  const response = await fetch('https://classe5ID.altervista.org/games/partitaN/3', {
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });

  const temp = await response.json();
  const gameList = temp.data;

  for (let game of gameList) {
    if(game.ID === gameId){
      for (let i = 1; i < 8; i++) {
        let player = `PLAYER${i}`
        if(game[player] === username) {
          playerId = i;
          return;
        }
      }
    }
  }
}

// Funzione per inserire una mossa nella partita
async function makeMove(move) {
  const response = await fetch(`https://classe5ID.altervista.org/games/mossa/${gameId}/${username}/${move}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });

  const moveId = await response.text();
  return moveId;
}

// Funzione per ottenere l'ultima mossa di una partita
async function getLastMove() {
  const response = await fetch(`https://classe5ID.altervista.org/games/mossa/${gameId}`, {
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });
  const lastMove = await response.text();
  console.log('Ultima mossa:', lastMove);
  return lastMove;
}

// Funzione per ottenere le mosse di una partita
async function getGameMoves() {
  const response = await fetch(`https://classe5ID.altervista.org/games/mosse/${gameId}`, {
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });
  const temp = await response.json();
  moves = temp.data.moves.map(item => parseInt(item.MOSSA));
}

function shuffleArray(array, prng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(prng.nextFloat() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function startGame(){
  await savePlayerId();
  document.getElementById("showName").innerHTML = "Giocatore n." + playerId +"<br> Username: " + username;
  deck = Array.from({length: 40}, (_, i) => i + 1);
  prng = new PRNG(gameId);
  shuffleArray(deck, prng);

  console.log(deck);
  
  if(playerId === null) {
    alert("player didn't join the match");
    window.location.href = `index.html`;
  } else if (playerId === 1) {
    board = deck.splice(0, 4);
    firstPlayerInterval = setInterval(handleFirstPlayer, 3000);
  } else if(playerId === 2) {
    handleSecondPlayer();
  }
}

async function pollGameState() {
  await getGameMoves();

  if(deck.length === 0){
    clearInterval(gameStateInterval);
    //showResults();
    return;
  }

  if(myCards.length === 0 && (moves.length - 4) % 6 === 0){
    drawCards();
  }

  loadGamePanel();

  if (playerId === 1) { //player 1

    if(moves.length % 2 === 0) {
      enableControls();
    } else {
      disableControls();
    }

  } else {  //player 2

    if(moves.length % 2 === 1) {
      enableControls();
    } else {
      disableControls();
    }

  }
}

function enableControls() {
  $('#card1').prop('disabled', false);
  $('#card2').prop('disabled', false);
  $('#card3').prop('disabled', false);
}

function disableControls() {
  $('#card1').prop('disabled', true);
  $('#card2').prop('disabled', true);
  $('#card3').prop('disabled', true);
}

$('#card1').on('click', () => makeMoveAndRemove(myCards[0]));
$('#card2').on('click', () => makeMoveAndRemove(myCards[1]));
$('#card3').on('click', () => makeMoveAndRemove(myCards[2]));

async function handleFirstPlayer(){
  await getGameMoves();

  if(moves !== undefined && moves.length >= 4){
    clearInterval(firstPlayerInterval);
    movesNumber = 4;

    gameStateInterval = setInterval(pollGameState, 3000);
  }

}

async function handleSecondPlayer(){
  for(i = 0; i < 4; i++){
    let startingCard = deck.shift();
    board.push(startingCard);
    await makeMove(startingCard);
  }

  // DA TOGLIERE PER TESTAREEEEE
 /*  deck.splice(0, 4); */
  // DA TOGLIERE PER TESTAREEEEE

  movesNumber = 4;

  await getGameMoves();

  setInterval(pollGameState, 3000);
}

function drawCards(){
  if (playerId % 2 !== 0) {
    takeNCards(3);
    deck.splice(0, 3);
  } else {
    deck.splice(0, 3);
    takeNCards(3);
  }
}

function takeNCards(n){
  for(i = 0; i < n; i++){
    myCards.push(deck.shift());
  }
}

async function loadGamePanel(){
  loadTheirHand();
  loadBoard();
  loadPlayerCards();
}

async function loadTheirHand(){
  if(playerId === 1){
    if(moves.length % 2 === 0){
      theirCardsNum = myCards.length
    } else {
      theirCardsNum = myCards.length + 1
    }
  } else {
    if(moves.length % 2 === 0){
      theirCardsNum = myCards.length
    } else {
      theirCardsNum = myCards.length - 1
    }
  }

  for(i = 0; i < theirCardsNum; i++) {
    $(`#theirCard${i + 1}`).show();
  }

  for(i = theirCardsNum; i < 3; i++) {
    $(`#theirCard${i + 1}`).hide();
  }
}

async function loadBoard(){
  console.log(board);
  $(`#board`).html(board.join(" "));
}

async function loadPlayerCards(){
  for(i = 0; i < myCards.length; i++) {
    $(`#card${i + 1}`).html(myCards[i]);
    $(`#card${i + 1}`).show();
  }

  for(i = myCards.length; i < 3; i++) {
    $(`#card${i + 1}`).hide();
  }
}

function makeMoveAndRemove(move){
  makeMove(move);
  myCards = myCards.filter(item => item !== move);
  disableControls();
}

$('.card').click(function() {
  $(this).hide();
});