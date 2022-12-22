"use strict";
// if any validation check fails alert and throw error
const alertAndThrowError = (identifier, method) => {
    const startingMessageFragment = `something is wrong with ${identifier}`;
    const endingMessageFragment = method ? `, method: ${method}..` : '..';
    const message = `${startingMessageFragment}${endingMessageFragment}`;
    document.querySelectorAll('button').forEach((button) => {
        button.disabled = true;
    });
    alert(message);
    throw new Error(message);
};
// * select and validate existing dom elements
// select and validate game wrapper
const snakeGameWrapper = document.querySelector('.snake-game-wrapper');
if (!snakeGameWrapper)
    alertAndThrowError('snakeGameWrapper');
// select and validate canvas
const snakeBoard = document.querySelector('.snake-game-canvas');
if (!snakeBoard)
    alertAndThrowError('snakeBoard');
// select and validate context
const snakeBoardContext = snakeBoard.getContext('2d');
if (!snakeBoardContext)
    alertAndThrowError('snakeBoardContext');
// select buttons
const closeInstructionsButton = document.querySelector('.close-instructions-button');
const viewInstructionsButton = document.querySelector('.view-instructions-button');
const startOrResetButton = document.querySelector('.start-or-reset-game-button');
const closeHiScoresButton = document.querySelector('.close-hi-scores-button');
const closeGameOverButton = document.querySelector('.close-game-over-button');
const viewHiScoresButton = document.querySelector('.view-hi-scores-button');
// select modals
const instructionsModal = document.querySelector('.game-instructions-modal');
const mobileNotSupportedModal = document.querySelector('.mobile-modal');
const hiScoresModal = document.querySelector('.hi-scores-modal');
const gameOverModal = document.querySelector('.game-over-modal');
// select spans
const finalScore = document.querySelector('.final-score');
const timer = document.querySelector('.timer');
const unvalidatedDomElements = [
    // buttons to validate
    { closeInstructionsButton },
    { viewInstructionsButton },
    { closeHiScoresButton },
    { closeGameOverButton },
    { startOrResetButton },
    { viewHiScoresButton },
    // modals to validate
    { mobileNotSupportedModal },
    { instructionsModal },
    { hiScoresModal },
    { gameOverModal },
    // spans to validate
    { finalScore },
    { timer },
];
// validate remaining elements
unvalidatedDomElements.forEach((unvalidatedDomElement, i) => {
    const key = Object.keys(unvalidatedDomElement)[0];
    if (!unvalidatedDomElements[i][key])
        alertAndThrowError(key);
});
// all elements validated, add listeners
startOrResetButton.addEventListener('click', (e) => handleStartOrResetButtonClick(e));
closeInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
viewInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
closeGameOverButton.addEventListener('click', () => toggleModal(gameOverModal));
closeHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
viewHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
snakeBoard.addEventListener('keydown', (e) => setVelocities(e));
snakeBoard.addEventListener('blur', () => !running || snakeBoard.focus());
// nonconstant global variables
let pillColor = '#F00', keyClicked = false, running = false, loser = false, pillsEaten = 0, xVelocity = 10, yVelocity = 0, timeout = 100, points = 100, minutes = 0, seconds = 0, score = 0, hours = 0, pillXValue, pillYValue, interval;
const snake = [
    { x: 300, y: 180 },
    { x: 290, y: 180 },
    { x: 280, y: 180 },
    { x: 270, y: 180 },
    { x: 260, y: 180 },
];
const hiScores = [];
// print defaults
const initialTableObject = {
    intervalRunsIn: `${timeout} ms`,
    nextPillIsWorth: points,
    score,
    pillsEaten,
};
console.table(initialTableObject);
const makeNetworkRequest = async (url, options) => {
    try {
        const response = await fetch(url, options);
        const parsedResponse = await response.json();
        return parsedResponse;
    }
    catch (err) {
        const method = options?.method ?? 'GET';
        throw new Error(`something is wrong with makeNetworkRequest. method: ${method}`);
    }
};
const padNumber = (number) => String(number).padStart(2, '0');
const toggleModal = (modal) => {
    snakeGameWrapper.classList.toggle('hidden');
    modal.classList.toggle('hidden');
};
const populateHiScores = async () => {
    if ('ontouchstart' in document.documentElement) {
        toggleModal(mobileNotSupportedModal);
        return;
    }
    const getScoresResponse = await makeNetworkRequest('backend/get_scores.php');
    if (Array.isArray(getScoresResponse)) {
        const emptyScore = {
            name: 'EMPTY',
            score: 0,
            time: '00:00:00',
            pills_eaten: 0,
        };
        let i = 0;
        for (i; i < 10; i++) {
            const hiScore = getScoresResponse[i] ?? emptyScore;
            hiScores.push(hiScore);
            // select and validate table rows on dom
            const hiScoreRow = document.querySelector(`.table-data-${i}`);
            if (!hiScoreRow)
                alertAndThrowError(`hiScoreRow ${i}`);
            const rowNumber = padNumber(i + 1);
            const rowName = hiScore.name;
            const rowScore = String(hiScore.score);
            const rowTime = hiScore.time;
            const rowPillOrPills = hiScore.pills_eaten === 1 ? 'pill' : 'pills';
            const rowPillsEaten = `${String(hiScore.pills_eaten)} ${rowPillOrPills} eaten`;
            const rowContent = `${rowNumber}. ${rowName} - ${rowScore} - ${rowTime} - ${rowPillsEaten}`;
            hiScoreRow.innerText = rowContent;
        }
    }
    startOrResetButton.disabled = false;
    viewInstructionsButton.disabled = false;
    viewHiScoresButton.disabled = false;
};
const drawSnake = () => {
    snake.forEach((part, i) => {
        !i ? snakeBoardContext.fillStyle = '#FF0' : snakeBoardContext.fillStyle = '#28BD00';
        snakeBoardContext.fillRect(part.x, part.y, 10, 10);
        snakeBoardContext.strokeRect(part.x, part.y, 10, 10);
    });
};
const populatePill = (x, y) => {
    let pillIsOnOrAroundSnake = false;
    if (!x || !y) {
        // get random coordinates on the canvas for pill placement
        // add five to center the pill in the square on the grid
        const possibleX = Math.random() * 60 + 5;
        const possibleY = Math.random() * 35 + 5;
        // if coordinates are on snake recurse
        snake.forEach((part) => {
            if (possibleX * 10 - part.x <= 5 && possibleX * 10 - part.x >= -5 && possibleY * 10 - part.y <= 5 && possibleY * 10 - part.y >= -5) {
                pillIsOnOrAroundSnake = true;
            }
        });
        // if coordinates are not within border recurse
        if (possibleX * 10 < 5 || possibleX * 10 > 595 || possibleY * 10 < 5 || possibleY * 10 > 345 || pillIsOnOrAroundSnake) {
            populatePill();
            return;
        }
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
        interval = setInterval(adjustTimes, 1000);
        viewInstructionsButton.disabled = true;
        viewHiScoresButton.disabled = true;
        target.innerText = 'Reset';
        running = true;
        snakeBoard.focus();
        runGame();
    }
    else {
        location.reload();
    }
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
        viewInstructionsButton.disabled = false;
        viewHiScoresButton.disabled = false;
        toggleModal(gameOverModal);
        closeGameOverButton.focus();
        finalScore.innerText = String(score);
        if (!hiScores[9] || score > hiScores[9].score) {
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
    // next snake head coordinates
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
    snake.forEach((part) => {
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
        const updatedScoreDetails = {
            intervalRunsIn: `${timeout} ms`,
            nextPillIsWorth: points,
            score,
            pillsEaten,
        };
        console.table(updatedScoreDetails);
        return true;
    }
    return false;
};
// update velocities based on keypresses and
// make the snake can't back into itself
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
    const time = timer.innerText;
    const body = {
        name,
        score,
        time,
        pills_eaten: pillsEaten,
    };
    const options = {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'content-type': 'application/json',
        },
    };
    await makeNetworkRequest('backend/insert_scores.php', options);
};
populateHiScores();
populatePill();
drawSnake();
