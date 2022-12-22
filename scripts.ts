// gameboard canvas dimensions are 600px x 350px
// each SnakeSegment or pill occupies 10px x 10px
interface DomElement {
  [domElementName: string]: HTMLElement | HTMLButtonElement,
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

// if any validation check fails alert and throw error
const alertAndThrowError = (identifier: string): never => {
  const message: string = `something is wrong with ${identifier}`;
  alert(message);
  throw new Error(message);
}

// * select and validate existing dom elements
// select and validate game wrapper
const snakeGameWrapper = document.querySelector('.snake-game-wrapper') as HTMLElement;
if (!snakeGameWrapper) alertAndThrowError('snakeGameWrapper');

// select and validate canvas
const snakeBoard = document.querySelector('.snake-game-canvas') as HTMLCanvasElement;
if (!snakeBoard) alertAndThrowError('snakeBoard');

// select and validate context
const snakeBoardContext = snakeBoard.getContext('2d') as CanvasRenderingContext2D;
if (!snakeBoardContext) alertAndThrowError('snakeBoardContext');

// select buttons
const closeInstructionsButton = document.querySelector('.close-instructions-button') as HTMLButtonElement;
const viewInstructionsButton = document.querySelector('.view-instructions-button') as HTMLButtonElement;
const startOrResetButton = document.querySelector('.start-or-reset-game-button') as HTMLButtonElement;
const closeHiScoresButton = document.querySelector('.close-hi-scores-button') as HTMLButtonElement;
const closeGameOverButton = document.querySelector('.close-game-over-button') as HTMLButtonElement;
const viewHiScoresButton = document.querySelector('.view-hi-scores-button') as HTMLButtonElement;

// select modals
const instructionsModal = document.querySelector('.game-instructions-modal') as HTMLElement;
const mobileNotSupportedModal = document.querySelector('.mobile-modal') as HTMLElement;
const hiScoresModal = document.querySelector('.hi-scores-modal') as HTMLElement;
const gameOverModal = document.querySelector('.game-over-modal') as HTMLElement;

// select spans
const finalScore = document.querySelector('.final-score') as HTMLElement;
const timer = document.querySelector('.timer') as HTMLElement;

const unvalidatedDomElements: DomElement[] = [
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
unvalidatedDomElements.forEach((unvalidatedDomElement: DomElement, i: number): void => {
  const key: string = Object.keys(unvalidatedDomElement)[0];
  if (!unvalidatedDomElements[i][key]) alertAndThrowError(key);
});

// all elements validated, add listeners
startOrResetButton.addEventListener('click', (e: MouseEvent) => handleStartOrResetButtonClick(e));
closeInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
viewInstructionsButton.addEventListener('click', () => toggleModal(instructionsModal));
closeGameOverButton.addEventListener('click', () => toggleModal(gameOverModal));
closeHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
viewHiScoresButton.addEventListener('click', () => toggleModal(hiScoresModal));
snakeBoard.addEventListener('keydown', (e: KeyboardEvent) => setVelocities(e));
snakeBoard.addEventListener('blur', () => !running || snakeBoard.focus());

// nonconstant global variables
let pillColor: string = '#F00',
hiScoresStayDisabled: boolean = false,
keyClicked: boolean = false,
running: boolean = false,
loser: boolean = false,
pillsEaten: number = 0,
xVelocity: number = 10,
yVelocity: number = 0,
timeout: number = 100,
points: number = 100,
minutes: number = 0,
seconds: number = 0,
score: number = 0,
hours: number = 0,
pillXValue: number,
pillYValue: number,
interval: number;

const snake: SnakeSegment[] = [
  { x: 300, y: 180 },
  { x: 290, y: 180 },
  { x: 280, y: 180 },
  { x: 270, y: 180 },
  { x: 260, y: 180 },
];

const hiScores: Score[] = [];

// print defaults
const initialTableObject: ConsoleTable = {
  intervalRunsIn: `${timeout} ms`,
  nextPillIsWorth: points,
  score,
  pillsEaten,
};
console.table(initialTableObject);

const makeNetworkRequest = async (url: string, options?: RequestOptions): Promise<Score[] | void> => {
  try {
    const response: Response = await fetch(url, options);
    const parsedResponse:  Score[] | void = await response.json();
    return parsedResponse;
  } catch(err) {
    hiScoresStayDisabled = true;
    viewHiScoresButton.disabled = true;
    const method: string = options?.method ?? 'GET';
    console.warn(`something is wrong in makeNetworkRequest, method: ${method}. this is probably a db connection issue`);
  }
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

  const getScoresResponse: Score[] | void = await makeNetworkRequest('backend/get_scores.php');

  if (Array.isArray(getScoresResponse)) {
    const emptyScore = {
      name: 'EMPTY',
      score: 0,
      time: '00:00:00',
      pills_eaten: 0,
    };
    let i: number = 0;
    for (i; i < 10; i++) {
      const hiScore: Score = getScoresResponse[i] ?? emptyScore;
      hiScores.push(hiScore);

      // select and validate table rows on dom
      const hiScoreRow = document.querySelector(`.table-data-${i}`) as HTMLElement;
      if (!hiScoreRow) alertAndThrowError(`hiScoreRow ${i}`);
  
      const rowNumber: string = padNumber(i + 1);
      const rowName: string = hiScore.name;
      const rowScore: string = String(hiScore.score);
      const rowTime: string = hiScore.time;
      const rowPillOrPills: string = hiScore.pills_eaten === 1 ? 'pill' : 'pills';
      const rowPillsEaten: string = `${String(hiScore.pills_eaten)} ${rowPillOrPills} eaten`;
      
      const rowContent: string = `${rowNumber}. ${rowName} - ${rowScore} - ${rowTime} - ${rowPillsEaten}`;
      hiScoreRow.innerText = rowContent;
    }
  }
  startOrResetButton.disabled = false;
  viewInstructionsButton.disabled = false;

  if (!hiScoresStayDisabled) {
    viewHiScoresButton.disabled = false;
  }
}

const drawSnake = (): void => {
  snake.forEach((part: SnakeSegment, i: number) => {
    !i ? snakeBoardContext.fillStyle = '#FF0' : snakeBoardContext.fillStyle = '#28BD00';
    snakeBoardContext.fillRect(part.x, part.y, 10, 10);
    snakeBoardContext.strokeRect(part.x, part.y, 10, 10);
  });
}

const populatePill = (x?: number, y?: number): void => {
  let pillIsOnOrAroundSnake: boolean = false;
  if (!x || !y) {

    // get random coordinates on the canvas for pill placement
    // add five to center the pill in the square on the grid
    const possibleX: number = Math.random() * 60 + 5;
    const possibleY: number = Math.random() * 35 + 5;
    
    // if coordinates are on snake recurse
    snake.forEach((part: SnakeSegment) => {
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
  snakeBoardContext.ellipse(pillXValue, pillYValue, 5 , 5, Math.PI / 4, 0, 2 * Math.PI);
  snakeBoardContext.stroke();
  snakeBoardContext.fillStyle = pillColor;
  snakeBoardContext.fill();
  snakeBoardContext.closePath();
}

const handleStartOrResetButtonClick = (e: MouseEvent): void => {
  const target = e.target as HTMLButtonElement;

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

    if (!hiScoresStayDisabled) {
      viewHiScoresButton.disabled = false;
    }

    toggleModal(gameOverModal);
    closeGameOverButton.focus();
    finalScore.innerText = String(score);

    if (!viewHiScoresButton.disabled && score >= hiScores[9].score) {
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
  
  // next snake head coordinates
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
  let collidedWithTail: boolean = false;
  snake.forEach((part: SnakeSegment) => {
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

// update velocities based on keypresses and
// make the snake can't back into itself
const setVelocities = (e: KeyboardEvent): void => {
  if (!keyClicked) {
    keyClicked = true;
    const key: string = e.key.toLowerCase();
    if (!xVelocity && (key === 'a' || key === 'arrowleft')) {
      xVelocity = -10;
      yVelocity = 0;
    } else if (!xVelocity && (key === 'd' || key === 'arrowright')) {
      xVelocity = 10;
      yVelocity = 0;
    } else if (!yVelocity && (key === 'w' || key === 'arrowup')) {
      xVelocity = 0;
      yVelocity = -10;
    } else if (!yVelocity && (key === 's' || key === 'arrowdown')) {
      xVelocity = 0;
      yVelocity = 10;
    }
  }
}

const insertScore = async (name: string): Promise<void> => {
  const time: string = timer.innerText;
  const body: Score = {
    name,
    score,
    time,
    pills_eaten: pillsEaten,
  }
  const options: RequestOptions = {
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