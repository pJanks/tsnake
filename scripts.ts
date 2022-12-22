// interfaces (obvoiusly..)
interface DomElement {
  [domElementName: string]: HTMLElement | CanvasRenderingContext2D | HTMLButtonElement
}

interface SnakeSegment {
  x: number,
  y: number,
}

interface Score {
  name: string,
  score: number,
  time: string,
  pills_eaten: number,
}

interface ConsoleTable {
  intervalRunsIn: string,
  nextPillIsWorth: number,
  score: number,
  pillsEaten: number,
}

interface RequestOptions {
  method: string,
  body: string,
  headers: {
    'content-type': string,
  },
}

// dom elements exist or error out
const throwDomError = (element: string): Error => {
  alert(`${element}: null or undefined . . .`);
  throw Error (`${element}: null or undefined . . .`);
}

// gameboard: dimensions are 600px x 350px each snake piece is 10px x 10px
const snakeGameWrapper = document.querySelector('.snake-game-wrapper') as HTMLElement;
const snakeBoard = document.querySelector('.snake-game-canvas') as HTMLCanvasElement;

// check for board to get canvas context
if (!snakeBoard) throwDomError('snakeBoard');
const snakeBoardContext = snakeBoard.getContext('2d') as CanvasRenderingContext2D;

// modals
const instructionsModal = document.querySelector('.game-instructions-modal') as HTMLElement;
const mobileNotSupportedModal = document.querySelector('.mobile-modal') as HTMLElement;
const hiScoresModal = document.querySelector('.hi-scores-modal') as HTMLElement;
const gameOverModal = document.querySelector('.game-over-modal') as HTMLElement;

// targeted spans
const finalScore = document.querySelector('.final-score') as HTMLElement;
const timer = document.querySelector('.timer') as HTMLElement;

// buttons
const closeInstructionsButton = document.querySelector('.close-instructions-button') as HTMLButtonElement;
const viewInstructionsButton = document.querySelector('.view-instructions-button') as HTMLButtonElement;
const startOrResetButton = document.querySelector('.start-or-reset-game-button') as HTMLButtonElement;
const closeHiScoresButton = document.querySelector('.close-hi-scores-button') as HTMLButtonElement;
const closeGameOverButton = document.querySelector('.close-game-over-button') as HTMLButtonElement;
const viewHiScoresButton = document.querySelector('.view-hi-scores-button') as HTMLButtonElement;

// dom checks
const domElements: DomElement[] = [
  { snakeGameWrapper },
  { snakeBoard },
  { instructionsModal },
  { mobileNotSupportedModal },
  { hiScoresModal },
  { gameOverModal },
  { finalScore },
  { timer },
  { closeInstructionsButton },
  { viewInstructionsButton },
  { startOrResetButton },
  { closeHiScoresButton },
  { closeGameOverButton },
  { viewHiScoresButton },
];

domElements.forEach((domElement: DomElement, i) => {
  const key: string = Object.keys(domElement)[0];
  if (!domElements[i][key]) throwDomError(key);
});

closeInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
viewInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
startOrResetButton.addEventListener('click', (e) => handleStartOrResetButtonClick(e));
closeHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
closeGameOverButton.addEventListener('click', () => toggleModal(gameOverModal));
viewHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
snakeBoard.addEventListener('blur', () => !running || snakeBoard.focus());
snakeBoard.addEventListener('keydown', (e) => setVelocities(e));

// snake
const snake: SnakeSegment[] = [
  { x: 300, y: 180 },
  { x: 290, y: 180 },
  { x: 280, y: 180 },
  { x: 270, y: 180 },
  { x: 260, y: 180 },
];

let pillColor = '#F00',
keyClicked = false,
running = false,
loser = false,
timeout = 100,
points = 100,
pillsEaten = 0,
xVelocity = 10,
yVelocity = 0,
minutes = 0,
seconds = 0,
score = 0,
hours = 0,
hiScores: Score[] = [],
pillXValue: number,
pillYValue: number,
interval: number;

// print defaults
const initialTableObject: ConsoleTable = {
  intervalRunsIn: `${timeout} ms`,
  nextPillIsWorth: points,
  score,
  pillsEaten,
};

console.table(initialTableObject);

const makeNetworkRequest = async (url: string, options?: RequestOptions): Promise<Score[] | void> => {
  const response = await fetch(url, options);
  const parsedResponse = await response.json();
  return parsedResponse;
}

const padNumber = (number: number): string => String(number).padStart(2, '0');

const toggleModal = (modal: HTMLElement): void => {
  snakeGameWrapper.classList.toggle('hidden');
  modal.classList.toggle('hidden');
}

const populateHiScores = async (): Promise<void> => {
  if ('ontouchstart' in document.documentElement) {
    toggleModal(mobileNotSupportedModal);
    return;
  }

  const getScoresResponse = await makeNetworkRequest('backend/get_scores.php');
  if (!Array.isArray(getScoresResponse)) {
    console.error('there was an error with the getScoresResponse . . .');
    alert('there was an error with the getScoresResponse . . .');
    return;
  }

  hiScores = getScoresResponse;
  for (let i = 0; i < 10; i++) {
    const hiScore: Score = hiScores[i] ?? {
      name: 'EMPTY',
      score: 0,
      time: '00:00:00',
      pills_eaten: 0,
    };
    const hiScoreRow = document.querySelector(`.table-data-${i}`) as HTMLElement;
    if (!hiScoreRow) throwDomError(`hiScoreRow ${i}`);

    const pillOrPills: string = hiScore.pills_eaten === 1 ? 'pill' : 'pills';
    hiScoreRow.innerText = `${padNumber(i + 1)}. ${hiScore.name} - ${hiScore.score} - ${hiScore.time} - ${hiScore.pills_eaten} ${pillOrPills} eaten`;
  }
  startOrResetButton.disabled = false;
  viewInstructionsButton.disabled = false;
  viewHiScoresButton.disabled = false;
}

const drawSnake = (): void => {
  snake.forEach((part, i) => {
    !i ? snakeBoardContext.fillStyle = '#FF0' : snakeBoardContext.fillStyle = '#28BD00';
    snakeBoardContext.fillRect(part.x, part.y, 10, 10);
    snakeBoardContext.strokeRect(part.x, part.y, 10, 10);
  });
}

const populatePill = (x?: number, y?: number): void => {
  if (!x || !y) {

    // get random coordinates on the canvas for pill placement
    // add five to center the pill in the square on the grid
    const possibleX = Math.random() * 60 + 5;
    const possibleY = Math.random() * 35 + 5;
    
    // if coordinates are not within border
    if (possibleX * 10 < 5 || possibleX * 10 > 595 || possibleY * 10 < 5 || possibleY * 10 > 345) {
      populatePill();
      return;
    }
    
    // if coordinates are on snake
    snake.forEach(part => {
      if (possibleX * 10 - part.x <= 5 && possibleX * 10 - part.x >= -5 && possibleY * 10 - part.y <= 5 && possibleY * 10 - part.y >= -5) {
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
  snakeBoardContext.ellipse(pillXValue, pillYValue, 5 , 5, Math.PI / 4, 0, 2 * Math.PI);
  snakeBoardContext.stroke();
  snakeBoardContext.fillStyle = pillColor;
  snakeBoardContext.fill();
  snakeBoardContext.closePath();
}

const handleStartOrResetButtonClick = (e: Event): void => {
  const target = e.target as HTMLButtonElement;
  if (!target) throwDomError('startOrResetButton');

  if (target.innerText.toLowerCase() !== 'reset') {
    interval = setInterval(adjustTimes, 1000);
    viewInstructionsButton.disabled = true;
    viewHiScoresButton.disabled = true;
    target.innerText = 'Reset';
    running = true;

    snakeBoard.focus();
    runGame();
  } else {
    location.reload();
  }
}

const adjustTimes = (): void => {
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
}

const runGame = async (): Promise<void> => {
  if (loser) {
    viewInstructionsButton.disabled = false;
    viewHiScoresButton.disabled = false;

    toggleModal(gameOverModal);
    closeGameOverButton.focus();
    finalScore.innerText = String(score);

    if (!hiScores[9] || score > Number(hiScores[9].score)) {
      const name = prompt(`
        Congrats, You\'ve scored in the top 10!!
        Please enter an identifier:
      `);
      await insertScore(name || 'anonymous');
    } else {
      await insertScore('not_a_hi_scorer');
    }
    populateHiScores();
  } else {
    setTimeout(() => {
      keyClicked = false;
      clearCanvas();
      populatePill(pillXValue, pillYValue);
      moveSnake();
      drawSnake();
      runGame();
    }, timeout);
  }
}

const clearCanvas = (): void => {
  snakeBoardContext.fillStyle = '#000';
  snakeBoardContext.fillRect(0, 0, snakeBoard.width, snakeBoard.height);
  snakeBoardContext.strokeRect(0, 0, snakeBoard.width, snakeBoard.height);
}

const moveSnake = (): void => { 
  
  // where the snake will be next
  const head: SnakeSegment = {
    x: snake[0].x + xVelocity,
    y: snake[0].y + yVelocity,
  };

  // check for collisions
  if (head.x === -10 || head.x === 600 || head.y === -10 || head.y === 350 || checkForTailCollision(head)) {
    loser = true;
    running = false;
    clearInterval(interval);
    return;
  } else if (checkForPillCollision(head)) {
    populatePill();
  } else {
    snake.unshift(head);
    snake.pop();
  }
}

const checkForTailCollision = (head: SnakeSegment): boolean => {
  let collidedWithTail = false;
  snake.forEach(part => {
    if (head.x === part.x && head.y === part.y) {
      collidedWithTail = true;
    }
  });
  return collidedWithTail;
}

const checkForPillCollision = (head: SnakeSegment): boolean => {
  if ((xVelocity && head.x + 5 === pillXValue) && head.y + 5 === pillYValue || (yVelocity && head.y + 5 === pillYValue) && head.x + 5 === pillXValue) {

    pillColor === '#F00' ? pillColor = '#00F' : pillColor = '#F00';

    snake.unshift(head);

    score += points;
    points++;
    pillsEaten++;
    timeout = Number((timeout - .04).toFixed(2));

    const updatedScoreDetails: ConsoleTable = {
      intervalRunsIn: `${timeout} ms`,
      nextPillIsWorth: points,
      score,
      pillsEaten,
    };
    console.table(updatedScoreDetails);
    return true;
  }
  return false;
}

// update velocities based on keypresses
// and make the snake can't back into
// itself
const setVelocities = (e: KeyboardEvent): void => {
  if (!keyClicked) {
    keyClicked = true;
    const key = e.key.toLowerCase();
    if (!xVelocity && key === 'a' || key === 'arrowleft') {
      xVelocity = -10;
      yVelocity = 0;
    } else if (!xVelocity && key === 'd' || key === 'arrowright') {
      xVelocity = 10;
      yVelocity = 0;
    } else if (!yVelocity && key === 'w' || key === 'arrowup') {
      xVelocity = 0;
      yVelocity = -10;
    } else if (!yVelocity && key === 's' || key === 'arrowdown') {
      xVelocity = 0;
      yVelocity = 10;
    }
  }
}

const insertScore = async (name: string): Promise<void> => {
  const time = timer.innerText;
  const body: Score = {
    name,
    score,
    time,
    pills_eaten: pillsEaten,
  }
  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  };
  await makeNetworkRequest('backend/insert_scores.php', options);
}

populateHiScores();
populatePill();
drawSnake();