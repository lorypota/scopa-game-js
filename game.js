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

// fetch API credentials
const user = '4ID';
const pass = 'Grena';
const credentials = btoa(`${user}:${pass}`);

// fetching URL parameters
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');
const username = urlParams.get('username');

// game state
let deck, moves, board = [], myCards = [], theirCardsNum = 0, lastMove, totalMoves = 4;
let savedCards = [], numScope = 0, tookLast;
let playerId, prng;

// UI elements
const showNameEl = document.getElementById("showName");

// intervals
let firstPlayerInterval, gameStateInterval;

//redirect if parameters are not provided
if (gameId === null || username === null) {
  alert('Game ID or username not provided. Please join a game from the lobby.');
  window.location.href = 'index.html';  
} else {
  console.log(`Game ID: ${gameId}, Username: ${username}`);
  
  startGame();
}



async function startGame(){
  try {
    await savePlayerId();
    showNameEl.innerHTML = "Giocatore n." + playerId +"<br> Username: " + username;
  
    initializeDeckAndBoard();
    
    if(playerId === null) {
      alert("player didn't join the match");
      window.location.href = `index.html`;
    } else {
      handlePlayerRoles();
    }
  } catch (err) {
    console.error("Error starting game: ", err);
  }
}

function initializeDeckAndBoard() {
  deck = Array.from({length: 40}, (_, i) => i);
  prng = new PRNG(gameId);
  shuffleArray(deck, prng);
  console.log(deck);
}

function shuffleArray(array, prng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(prng.nextFloat() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function handlePlayerRoles(){
  if (playerId === 1) {
    board = deck.splice(0, 4);
    firstPlayerInterval = setInterval(handleFirstPlayer, 3000);
  } else {
    handleSecondPlayer();
  }
}

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

  movesNumber = 4;

  await getGameMoves(); //probabilmente da togliere

  gameStateInterval = setInterval(pollGameState, 3000);
}

async function pollGameState() {
  //update game state
  await getGameMoves();
  await getLastMove();

  if(moves.length > totalMoves){
    totalMoves++;
    addToBoard(lastMove, false);
  }

  if(moves.length != 40 && myCards.length === 0 && (moves.length - 4) % 6 === 0){
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

  if(moves.length === 40){
    clearInterval(gameStateInterval);
    if(tookLast){
      while(board.length){
        savedCards.push(board.pop());
      }
    }

    showResults();
  }
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
  const temp = await response.json();

  lastMove = Number(temp.data.play.MOSSA);
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

$('#card1').on('click', () => executePlayerMove(myCards[0]));
$('#card2').on('click', () => executePlayerMove(myCards[1]));
$('#card3').on('click', () => executePlayerMove(myCards[2]));

function drawCards(){
  if (playerId === 1) {
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
    if(deck.length === 0 && myCards.length === 0) {
      theirCardsNum = 0
    } else if(moves.length % 2 === 0){
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
    $(`#theirCard${i + 1}`).html('<img src="bergamoCards/retro.png" alt="Card Back Image" />');
    $(`#theirCard${i + 1}`).show();
  }

  for(i = theirCardsNum; i < 3; i++) {
    $(`#theirCard${i + 1}`).hide();
  }
}

async function loadBoard(){
  let html = '';
  for(let card of board) {
    html += `<img src="bergamoCards/${card}.png" alt="Card Image" /> `;
  }
  $('#board').html(html);
}

async function loadPlayerCards(){
  for(i = 0; i < myCards.length; i++) {
    $(`#card${i + 1}`).html(`<img src="bergamoCards/${myCards[i]}.png" alt="Card Image" />`);
    $(`#card${i + 1}`).show();
  }

  for(i = myCards.length; i < 3; i++) {
    $(`#card${i + 1}`).hide();
  }

  $(`#numScope`).html("Numero scope: " + numScope);
}

async function showPlayedCard(move){
  $(`#playedCard`).html(`<img src="bergamoCards/${move}.png" alt="Card Image"/>`);
  $(`#playedCard`).show();
  await delay(2000);
  $(`#playedCard`).hide();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

$('.card').click(function() {
  $(this).hide();
});

async function executePlayerMove(move){
  disableControls();
  makeMove(move);
  myCards = myCards.filter(item => item !== move);

  await addToBoard(move);

  totalMoves++;

  if(move % 10 !== 0 && board.length === 0){
    numScope++;
  }
}

async function addToBoard(move, isPlayer = true){
  let cardValue = move % 10; //valore della mia carta senza segno

  if(isPlayer){
    tookLast = true;
  } else {
    tookLast = false;
    await showPlayedCard(move);
  }

  //gestisco caso carta uguale
  let selectedBoardCard = undefined;
  for(i = 0; i < board.length; i++){
    let valoreCardBoard = board[i] % 10; //valore della carta in banco senza segno
    if(valoreCardBoard === cardValue){
      if(board[i] <= 9){ //caso in cui carta sia di ori
        removeAndSaveCard(board[i], isPlayer);
        if(isPlayer){
          savedCards.push(move);
        }
        return;
      } else {
        selectedBoardCard = board[i];
      }
    }
  }

  if(selectedBoardCard !== undefined) {
    removeAndSaveCard(selectedBoardCard, isPlayer);
    if(isPlayer){
      savedCards.push(move);
    }
    return;
  }

  //gestisco caso asso
  if(cardValue === 0){
    putsDownAce(isPlayer);
    if(isPlayer){
      savedCards.push(move);
    }
    return;
  }

  //gestisco caso somma di carte
  let notHandled = handlesSum(cardValue, move, isPlayer);

  //gestisco caso in cui nessuna carta combacia
  if(notHandled){
    board.push(move);
  }
}

function removeAndSaveCard(boardCard, isPlayer){
  if(isPlayer){
    savedCards.push(boardCard);
  }
  board = board.filter(item => item !== boardCard);
}

function putsDownAce(isPlayer){
  while (board.length) {
    let cardBoard = board.pop();
    if(isPlayer){
      savedCards.push(cardBoard);
    }
  }
}

function handlesSum(cardValue, move, isPlayer){
  let boardValues = board.map(number => number % 10);
  let incrementedArray = boardValues.map(x => x + 1);
  let arrayTakeableCards = sumSubsets((cardValue + 1), incrementedArray);

  let randomTakeableCards = undefined;
  if(arrayTakeableCards.length === 0){
    return true;
  } else {
    randomTakeableCards = arrayTakeableCards[0].map(x => x - 1);
  }

  for(i = 0; i < randomTakeableCards.length; i++){
    for(let j = 0; j < board.length; j++) {
      if(board[j] % 10 === randomTakeableCards[i]){
        if(isPlayer){
          savedCards.push(board[j]);
        }
        board.splice(j, 1);
        break;
      }
    }
  }
  if(isPlayer){
    savedCards.push(move);
  }
}

function sumSubsets(target, numbers, subset = [], index = 0){

  var result = [];

  if(target === 0){
    return [subset];
  }

  for(let i = index; i < numbers.length; i++){
    if(numbers[i] > target) {
      continue;
    }

    var newSubset = subset.concat(numbers[i]);
    var newResult = sumSubsets(target - numbers[i], numbers, newSubset, i + 1);

    result = result.concat(newResult);
  }

  return result;
}

function showResults(){
  let results = "";

  let numCarte = savedCards.length;
  let numOri = 0; 
  let numSette = 0;
  let numSei = 0;
  let setteBello;

  for(i = 0; i < savedCards.length; i++){
    if(savedCards[i] <= 9){
      numOri++;
    }

    if(savedCards[i] % 10 === 6){
      numSette++;
    }

    if(savedCards[i] % 10 === 5){
      numSei++;
    }

    if(savedCards[i] === 6){
      setteBello = true;
    }
  }

  let primiera; //true se vince, false se perde

  if(numSette > 2){
    primiera = true;
  } else if(numSette === 2){
    
    if(numSei > 2){
      primiera = true;
    } else if(numSei === 2){
      primiera = undefined;
    } else {
      primiera = false;
    }

  } else {
    primiera = false;
  }

  let numPunti = numScope;

  if(numCarte >= 21)
    numPunti++;

  if(numOri >= 6)
    numPunti++;

  if(setteBello === true)
    numPunti++;

  if(primiera === true)
    numPunti++;
  
  results += "Numero scope: " + numScope + "<br>";
  results += "Num Carte: " + numCarte + "<br>";
  results += "Num ori: " + numOri + "<br>";
  results += "Sette bello: " + setteBello + "<br>";
  results += "Primiera: " + primiera + "<br>";
  results += "Punti totali: " + numPunti + "<br>";

  /* console.log("Carte salvate: " + savedCards.map(x => x + 1).join(", "));
  console.log("Num Carte: " + numCarte) 
  console.log("Num ori: " + numOri)
  console.log("Sette bello: " + setteBello)
  console.log("Primiera: " + primiera);
  console.log("num punti: " + numPunti); */

  window.location.href = `finishedGame.html?results=${results}`;
  return;
}