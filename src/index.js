import $ from 'jquery';
import './css/base.scss';

import './images/underwater.jpg'
import './images/underwater-light.jpg'
import Player from '../src/Player'
import Game from '../src/Game'
import Clue from '../src/Clue'
import '../src/Round'

let nameInputSection = document.querySelector(".player-name-input-section")
let gameRules = document.querySelector(".game-rules");
let player1Input = document.querySelector(".player1");
let player2Input = document.querySelector(".player2");
let player3Input = document.querySelector(".player3");
let player1Name = document.querySelector(".player1-name");
let player2Name = document.querySelector(".player2-name");
let player3Name = document.querySelector(".player3-name");
let player1Score = document.querySelector(".player1-score");
let player2Score = document.querySelector(".player2-score");
let player3Score = document.querySelector(".player3-score");
let continueBtn = document.querySelector(".continue-button");
let gameBoard = document.querySelector(".game-board");
let playBtn = document.querySelector(".play-button");
let clueCards = document.querySelector(".clue-cards");
let players = [];
let clue;
let clueCategories = [];
let clueInfo = [];
let clueId = 1;
let selectedClue;
let submitGuessBtn = document.querySelector(".submit-guess")


nameInputSection.addEventListener("keyup", checkInputs);
continueBtn.addEventListener("click", instantiatePlayers);
playBtn.addEventListener("click", instantiateGame);
clueCards.addEventListener("click", displaySelectedClue)
submitGuessBtn.addEventListener("click", evaluateGuess)


function categoryFetch() {
  return fetch('https://fe-apps.herokuapp.com/api/v1/gametime/1903/jeopardy/data')
    .then(data => data.json())
    .then(data => data.data.categories)
    .then(categories => {
      let catKeys = Object.keys(categories)
      catKeys.forEach(key => clueCategories.push({
        category: key, id: categories[key]
      }))
    })
    .catch(error => console.log('failure'))
}

function clueFetch() {
  return fetch('https://fe-apps.herokuapp.com/api/v1/gametime/1903/jeopardy/data')
    .then(data => data.json())
    .then(data => data.data.clues)
    .then(clues => {
      let clueKeys = Object.keys(clues)
      clueKeys.forEach(key => clueInfo.push(clues[key]))
    })
    .catch(error => console.log('failure'))
}

function getFetches() {
  return Promise.all([clueFetch(), categoryFetch()])
}

getFetches()
  .then(() => instantiateClues())

function instantiateClues() {
  return clueInfo.map(c => {
    c.id = clueId;
    clue = new Clue(c);
    clueId++;
  })
}

function checkInputs() {
  if (player1Input.value && player2Input.value && player3Input.value) {
    continueBtn.id = "active";
  }
};

function instantiatePlayers() {
  if (continueBtn.id === "active") {
    let player1 = new Player(player1Input.value);
    let player2 = new Player(player2Input.value);
    let player3 = new Player(player3Input.value);
    players.push(player1, player2, player3);
    showRules();
  } else {
    document.querySelector(".error").style.visibility = "visible";
  }
};

function showRules() {
  let welcomeMsg = `<h3>Welcome ${player1Input.value}, ${player2Input.value}, & ${player3Input.value}!`
  gameRules.insertAdjacentHTML("afterbegin", welcomeMsg);
  nameInputSection.style.display = "none";
  gameRules.style.display = "block";
};

function instantiateGame() {
  let game = new Game(players);
  pickCategories();
  players[0].takeTurn();
  showGame();
}

function pickCategories() {
  shuffleArray(clueCategories);
  let currentIndex = 0;
  let currentCategories = [];
  while (4 !== currentIndex) {
    $(`.category${currentIndex + 1}`).text(`${clueCategories[`${currentIndex}`].category.split(/(?=[A-Z])/).join(" ").toUpperCase()}`);
    currentCategories.push(clueCategories[`${currentIndex}`]);
    currentIndex++;
  }
  findCategoryClues(currentCategories);
}

function shuffleArray(arr) {
	let currentIndex = arr.length;
	let temporaryValue;
  let randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = arr[currentIndex];
		arr[currentIndex] = arr[randomIndex];
		arr[randomIndex] = temporaryValue;
	}
};

function findCategoryClues(categories) {
  categories.forEach(category => {
    let categoryClues = clueInfo.filter(clue => clue.categoryId === category.id)
    shuffleArray(categoryClues);
    let currentClues = [];
    let pointLevel = 1;
    while (pointLevel !== 5) {
      let clue = categoryClues.find(clue => clue.pointValue == `${pointLevel}00`)
      currentClues.push(clue);
      pointLevel++;
    }
    addCluesToDom(currentClues)
  })
}

function addCluesToDom(clues) {
  let pointLevel = 1;
  while (pointLevel !== 5) {
    clues.forEach(clue => {
      if (clue.pointValue == `${pointLevel}00`) {
        $( ".clue-cards" ).append(`<div class="clue-card clue-points value${pointLevel}00" id="${clue.id}">${pointLevel}00</div>`);
      }
    })
    pointLevel++;
  }
}

function showGame() {
  player1Name.innerText = `${player1Input.value}`;
  player2Name.innerText = `${player2Input.value}`;
  player3Name.innerText = `${player3Input.value}`;
  gameRules.style.display = "none";
  gameBoard.style.display = "grid";
  updatePlayerScore();
}


function updatePlayerScore() {
  player1Score.innerText = `${players[0].score}`
  player2Score.innerText = `${players[1].score}`
  player3Score.innerText = `${players[2].score}`
}

function displaySelectedClue(event) {
  let clickedCard = event.target.closest(".clue-card");
  selectedClue = clueInfo.find(clue => clue.id == clickedCard.id)
  let selectedCategory = clueCategories.find(category => category.id === selectedClue.categoryId)
  $('.selected-clue-category').text(`${selectedCategory.category.split(/(?=[A-Z])/).join(" ").toUpperCase()}`);
  $('.selected-clue-points').text(`${selectedClue.pointValue}`);
  $('.question').text(`${selectedClue.question}`);
}

function evaluateGuess() {
  let response;
  $('.answer-response').css("display", "flex");
  if ($(".player-guess").val().toUpperCase() === selectedClue.answer.toUpperCase()) {
    $(".response").text(`Correct! \n You get ${selectedClue.pointValue} points!`);
    response = "correct";
  } else {
    $(".response").text(`Incorrect! \n The answer is ${selectedClue.answer}. \n You lose ${selectedClue.pointValue} points!`)
    response = "incorrect";
  }
  $(".player-guess").val('');
  calculateScore(response);
}

function calculateScore(response) {
  let currentPlayer = players.find(player => player.turn);
  if (response === 'correct') {
    currentPlayer.score += selectedClue.pointValue;
  } else {
    currentPlayer.score -= selectedClue.pointValue;
  }
  updatePlayerScore();
  switchPlayer(currentPlayer);
  $(`#${selectedClue.id}`).css("visibility", "hidden");
  setTimeout(function() { $('.answer-response').css("display", "none")}, 2000);
}

function switchPlayer(player) {
  player.takeTurn();
  if (players[players.indexOf(player) + 1]) {
    players[players.indexOf(player) + 1].takeTurn();
  } else {
    players[0].takeTurn();
  }
}
