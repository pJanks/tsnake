"use strict";
// board dimensions are 600px x 350px
// each snake piece is 10px x 10px
// buttons
const closeInstructionsButton = document.querySelector('.close-instructions-button');
const viewInstructionsButton = document.querySelector('.view-instructions-button');
const startOrResetButton = document.querySelector('.start-or-reset-game-button');
const closeHiScoresButton = document.querySelector('.close-hi-scores-button');
const closeGameOverButton = document.querySelector('.close-game-over-button');
const viewHiScoresButton = document.querySelector('.view-hi-scores-button');
// modal sections
const instructionsModal = document.querySelector('.game-instructions-modal');
const mobileNotSupportedModal = document.querySelector('.mobile-modal');
const snakeGameWrapper = document.querySelector('.snake-game-wrapper');
const hiScoresModal = document.querySelector('.hi-scores-modal');
const gameOverModal = document.querySelector('.game-over-modal');
// target spans
const finalScore = document.querySelector('.final-score');
const timer = document.querySelector('.timer');
// canvas elements
const snakeBoard = document.querySelector('.snake-game-canvas');
const snakeBoardContext = snakeBoard.getContext('2d');
// check dom elements
const throwDomError = (element) => {
    const message = `${element}: undefined or null . . .`;
    alert(message);
    throw new Error(message);
};
if (!mobileNotSupportedModal)
    throwDomError('mobileNotSupportedModal');
if (!closeInstructionsButton)
    throwDomError('closeInstructionsButton');
if (!viewInstructionsButton)
    throwDomError('viewInstructionsButton');
if (!closeHiScoresButton)
    throwDomError('closeHiScoresButton');
if (!closeGameOverButton)
    throwDomError('closeGameOverButton');
if (!viewHiScoresButton)
    throwDomError('viewHiScoresButton');
if (!startOrResetButton)
    throwDomError('startOrResetButton');
if (!snakeBoardContext)
    throwDomError('snakeBoardContext');
if (!instructionsModal)
    throwDomError('instructionsModal');
if (!snakeGameWrapper)
    throwDomError('snakeGameWrapper');
if (!hiScoresModal)
    throwDomError('hiScoresModal');
if (!gameOverModal)
    throwDomError('gameOverModal');
if (!snakeBoard)
    throwDomError('snakeBoard');
if (!finalScore)
    throwDomError('finalScore');
if (!timer)
    throwDomError('timer');
closeInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
viewInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
startOrResetButton.addEventListener('click', (e) => handleStartOrResetButtonClick(e));
closeHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
closeGameOverButton.addEventListener('click', () => toggleModal(gameOverModal));
viewHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
snakeBoard.addEventListener('blur', () => running || snakeBoard.focus());
snakeBoard.addEventListener('keydown', (e) => setVelocities(e));
const snake = [
    { x: 300, y: 180 },
    { x: 290, y: 180 },
    { x: 280, y: 180 },
    { x: 270, y: 180 },
    { x: 260, y: 180 },
];
let score = 0, points = 100, timeout = 100, running = false, loser = false, pillsEaten = 0, seconds = 0, minutes = 0, hours = 0, xVelocity = 10, yVelocity = 0, keyClicked = false, pillColor = '#F00', hiScores, pillXValue, pillYValue, interval;
const defaultsTable = {
    intervalRunsIn: `${timeout} ms`,
    nextPillIsWorth: points,
    score,
    pillsEaten,
};
console.table(defaultsTable);
const makeNetworkRequest = async (url, options) => {
    try {
        const response = await fetch(url, options);
        const parsedResponse = await response.json();
        return parsedResponse;
    }
    catch (err) {
        console.log(`there was an error: ${err}`);
        alert(`there was an error: ${err}`);
    }
};
const padNumber = (numberToPad) => String(numberToPad).padStart(2, '0');
const toggleModal = (modal) => {
    snakeGameWrapper.classList.toggle('hidden');
    modal.classList.toggle('hidden');
};
window.onload = () => populateHiScores();
const populateHiScores = async () => {
    var _a;
    try {
        if ("ontouchstart" in document.documentElement) {
            toggleModal(mobileNotSupportedModal);
            return;
        }
        const getScoresResponse = await makeNetworkRequest('/backend/get_scores.php');
        if (!Array.isArray(getScoresResponse)) {
            console.log('something is wrong with get_scores response');
            alert('something is wrong with get_scores response');
            return;
        }
        hiScores = getScoresResponse;
        for (let i = 0; i < 10; i++) {
            const hiScore = (_a = hiScores[i]) !== null && _a !== void 0 ? _a : {
                name: 'EMPTY',
                score: 0,
                time: '00:00:00',
                pills_eaten: 0,
            };
            const hiScoreRow = document.querySelector(`.table-data-${i}`);
            hiScoreRow.innerText = '';
            hiScoreRow.innerText = `${padNumber(i + 1)}. ${hiScore.name} - ${hiScore.score} - ${hiScore.time} - ${hiScore.pills_eaten} pills eaten`;
        }
    }
    catch (err) {
        viewHiScoresButton.disabled = true;
        console.log(`there was an error: ${err}`);
        alert(`there was an error: ${err}`);
    }
};
const drawSnake = () => {
    snake.forEach((part, i) => {
        !i ? snakeBoardContext.fillStyle = '#FF0' : snakeBoardContext.fillStyle = '#28BD00';
        snakeBoardContext.fillRect(part.x, part.y, 10, 10);
        snakeBoardContext.strokeRect(part.x, part.y, 10, 10);
    });
};
const populatePill = async (x, y) => {
    if (!x || !y) {
        // get random 10x10 blocks on the canvas for pill placement
        // add five to center the pill in the square on the grid
        const possibleX = Math.random() * 60 + 5;
        const possibleY = Math.random() * 35 + 5;
        // make sure the random coordinates are not on borders or on top of the snake
        snake.forEach(part => {
            if (possibleX * 10 - part.x <= 5 && possibleX * 10 - part.x >= -5 && possibleY * 10 - part.y <= 5 && possibleY * 10 - part.y >= -5 || possibleX * 10 < 5 || possibleX * 10 > 595 || possibleY * 10 < 5 || possibleY * 10 > 345) {
                populatePill();
                return;
            }
        });
        // scale values to actual columns and rows
        pillXValue = Math.round(possibleX) * 10 + 5;
        pillYValue = Math.round(possibleY) * 10 + 5;
    }
    // draw pills
    snakeBoardContext.beginPath();
    snakeBoardContext.ellipse(pillXValue, pillYValue, 5, 5, Math.PI / 4, 0, 2 * Math.PI);
    snakeBoardContext.stroke();
    snakeBoardContext.fillStyle = pillColor;
    snakeBoardContext.fill();
    snakeBoardContext.closePath();
};
const handleStartOrResetButtonClick = (e) => {
    const target = e.target;
    if (target.innerText.toLowerCase() !== 'reset') {
        target.innerText = 'Reset';
        viewInstructionsButton.disabled = true;
        viewHiScoresButton.disabled = true;
        interval = setInterval(adjustTimes, 1000);
        snakeBoard.focus();
        runGame();
        running = true;
    }
    else
        location.reload();
};
const adjustTimes = () => {
    seconds++;
    if (seconds === 60) {
        minutes++;
        seconds = 0;
        points += 3;
        console.log('three extra points added for a minute');
    }
    if (minutes === 60) {
        hours++;
        minutes = 0;
        points += 13;
        console.log('thirteen extra points added for an hour');
    }
    timer.innerText = `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
};
const runGame = async () => {
    if (loser) {
        toggleModal(gameOverModal);
        finalScore.innerText = String(score);
        closeGameOverButton.focus();
        viewInstructionsButton.disabled = false;
        viewHiScoresButton.disabled = false;
        if (hiScores && !hiScores[9] || score > Number(hiScores[9].score)) {
            const name = prompt(`
        Congrats, You\'ve scored in the top 10!!
        Please enter an identifier:
      `);
            await insertScore(name || 'anonymous');
        }
        else {
            await insertScore('not_a_hi_scorer');
        }
        populateHiScores();
    }
    else {
        setTimeout(() => {
            keyClicked = false;
            clearCanvas();
            populatePill(pillXValue, pillYValue);
            moveSnake();
            drawSnake();
            runGame();
        }, timeout);
    }
};
const clearCanvas = () => {
    snakeBoardContext.fillStyle = '#000';
    snakeBoardContext.fillRect(0, 0, snakeBoard.width, snakeBoard.height);
    snakeBoardContext.strokeRect(0, 0, snakeBoard.width, snakeBoard.height);
};
const moveSnake = () => {
    // where the snakes head will be next
    const head = {
        x: snake[0].x + xVelocity,
        y: snake[0].y + yVelocity,
    };
    // check for collisions
    if (head.x === -10 || head.x === 600 || head.y === -10 || head.y === 350 || checkForTailCollision(head)) {
        loser = true;
        running = false;
        clearInterval(interval);
        return;
    }
    else if (checkForPillCollision(head)) {
        populatePill();
    }
    else {
        snake.unshift(head);
        snake.pop();
    }
};
const checkForTailCollision = (head) => {
    let collidedWithTail = false;
    snake.forEach(part => {
        if (head.x === part.x && head.y === part.y) {
            collidedWithTail = true;
        }
    });
    return collidedWithTail;
};
const checkForPillCollision = (head) => {
    if ((xVelocity && head.x + 5 === pillXValue) && head.y + 5 === pillYValue || (yVelocity && head.y + 5 === pillYValue) && head.x + 5 === pillXValue) {
        pillColor === '#F00' ? pillColor = '#00F' : pillColor = '#F00';
        snake.unshift(head);
        score += points;
        points++;
        pillsEaten++;
        timeout = Number((timeout - .04).toFixed(2));
        const scoreDetails = {
            intervalRunsIn: `${timeout} ms`,
            nextPillIsWorth: points,
            score,
            pillsEaten,
        };
        console.table(scoreDetails);
        return true;
    }
    return false;
};
// update velocities based on keypresses
// and make sure that you can't move backwards into your self
const setVelocities = (e) => {
    if (!keyClicked) {
        keyClicked = true;
        const key = e.key.toLowerCase();
        if (!xVelocity && (key === 'a' || key === 'arrowleft')) {
            xVelocity = -10;
            yVelocity = 0;
        }
        else if (!xVelocity && (key === 'd' || key === 'arrowright')) {
            xVelocity = 10;
            yVelocity = 0;
        }
        else if (!yVelocity && (key === 'w' || key === 'arrowup')) {
            xVelocity = 0;
            yVelocity = -10;
        }
        else if (!yVelocity && (key === 's' || key === 'arrowdown')) {
            xVelocity = 0;
            yVelocity = 10;
        }
    }
};
const insertScore = async (name) => {
    if (viewHiScoresButton.disabled) {
        console.log('db doesn\'t seem to be up');
        return;
    }
    try {
        const time = timer.innerText;
        const options = {
            method: 'POST',
            body: JSON.stringify({ score, name, time, pillsEaten }),
            headers: {
                'content-type': 'application/json',
            },
        };
        await makeNetworkRequest('/backend/insert_scores.php', options);
    }
    catch (err) {
        console.log(`there was an error: ${err}`);
        alert(`there was an error: ${err}`);
    }
};
drawSnake();
populatePill();
