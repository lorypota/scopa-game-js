const user = '4ID';
const pass = 'Grena';
const credentials = btoa(`${user}:${pass}`);  // codifica in base64 le credenziali

// Funzione per creare una nuova partita
async function createGame(username) {
  const response = await fetch(`https://classe5ID.altervista.org/games/partita/${username}`, { 
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });
  const gameId = await response.text();

  // Check if the game was created successfully
  if (response.ok) {
    // Show a success message
    console.log('Nuova partita creata con ID:', gameId);

    let gameData = JSON.parse(gameId);
    let id = gameData.data.id;
    window.location.href = `game.html?gameId=${id}&username=${username}`;
  } else {
    // Show an error message
    console.log('Failed to create game');
  }

  return gameId;
}

// Funzione per unirsi a una partita esistente
async function joinGame(gameId, username) {
  const response = await fetch(`https://classe5ID.altervista.org/games/join/${gameId}/${username}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });

  const joinedGameId = await response.text();
  console.log('Sei entrato nella partita con ID:', joinedGameId);

  // Check if the response was successful
  if (response.ok) {
    // Navigate to the new HTML page, append the game id if necessary
    window.location.href = `game.html?gameId=${gameId}&username=${username}`;
  } else {
    // Handle error
    console.log('Failed to join the game');
  }

  return joinedGameId;
}

// Funzione per ottenere la lista delle partite disponibili
async function getAvailableGames() {
  const response = await fetch('https://classe5ID.altervista.org/games/partita', {
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });
  const gameList = await response.json();
  console.log('Partite disponibili:', gameList);
  return gameList;
}

// Funzione per mostrare le partite disponibili
async function showAvailableGames() {
  const response = await getAvailableGames();

  // If the response is a string, try parsing it as JSON
  const games = response.data;

  // Check if games is actually an array
  if (Array.isArray(games)) {

    let gamesDiv = document.getElementById('availableGames');

    // Clear the previous contents of the div
    gamesDiv.innerHTML = '';

    // Create a new div for each game and add it to the page
    games.forEach(game => {
      const gameDiv = document.createElement('div');

      let textContent = `Game ID: ${game.ID}, <br>Date and time of creation: ${game.CREATED_AT}, <br>`;
      for (let i = 1; i < 8; i++) {
        let player = `PLAYER${i}`
        textContent += `Player${i}: ` + game[player] + "&nbsp;&nbsp;";
      }

      textContent += "<br> <br>";

      gameDiv.innerHTML = textContent;
      gamesDiv.appendChild(gameDiv);
    });
  } else {
    console.error('getAvailableGames did not return an array');
  }
}