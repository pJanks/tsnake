import { HiScores, TableObject, Options, Head } from './interfaces';

const app = async () => {
  // board dimensions are 600px x 350px
  // each snake piece is 10px x 10px

  const closeInstructionsButton = document.querySelector('.close-instructions-button') as HTMLButtonElement;
  const viewInstructionsButton = document.querySelector('.view-instructions-button') as HTMLButtonElement;
  const startOrResetButton = document.querySelector('.start-or-reset-game-button') as HTMLButtonElement;
  const closeHiScoresButton = document.querySelector('.close-hi-scores-button') as HTMLButtonElement;
  const closeGameOverButton = document.querySelector('.close-game-over-button') as HTMLButtonElement;
  const instructionsModal = document.querySelector('.game-instructions-modal') as HTMLElement;
  const viewHiScoresButton = document.querySelector('.view-hi-scores-button') as HTMLButtonElement;
  const mobileNotSupportedModal = document.querySelector('.mobile-modal') as HTMLElement;
  const snakeGameWrapper = document.querySelector('.snake-game-wrapper') as HTMLElement;
  const hiScoresModal = document.querySelector('.hi-scores-modal') as HTMLElement;
  const gameOverModal = document.querySelector('.game-over-modal') as HTMLElement;
  const snakeBoard = document.querySelector('.snake-game-canvas') as HTMLCanvasElement;
  const finalScore = document.querySelector('.final-score') as HTMLElement;
  const timer = document.querySelector('.timer') as HTMLElement;

  if (!closeInstructionsButton || !viewInstructionsButton || !startOrResetButton || !closeHiScoresButton || !closeGameOverButton || !instructionsModal || !viewHiScoresButton || !mobileNotSupportedModal || !snakeGameWrapper || !hiScoresModal || !gameOverModal || !snakeBoard || !finalScore || !timer) {
    throw new Error('dom element was undefined or null . . .');
  }

  closeInstructionsButton.addEventListener('click', () => toggleModals(instructionsModal));
  viewInstructionsButton.addEventListener('click', () => toggleModals(instructionsModal));
  startOrResetButton.addEventListener('click', (e) => handleStartOrResetButtonClick(e));
  closeHiScoresButton.addEventListener('click', () => toggleModals(hiScoresModal));
  closeGameOverButton.addEventListener('click', () => toggleModals(gameOverModal));
  viewHiScoresButton.addEventListener('click', () => toggleModals(hiScoresModal));
  snakeBoard.addEventListener('keydown', (e) => setVelocities(e));

  // prevent a user from navigating out of gameboard
  snakeBoard.addEventListener('blur', () => running ? snakeBoard.focus() : null);

  const snakeBoardContext = snakeBoard.getContext('2d');

  // snake always begins in the middle of the board
  const snake = [
    { x: 300, y: 180 },
    { x: 290, y: 180 },
    { x: 280, y: 180 },
    { x: 270, y: 180 },
    { x: 260, y: 180 },
  ];

  let pillColor = '#F00',
  running = false,
  loser = false,
  score = 0,
  timeout = 100,
  points = 100,
  keyClicked = false,
  pillsEaten = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  xVelocity = 10,
  yVelocity = 0,
  hiScores: HiScores[] = [],
  pillXValue: number,
  pillYValue: number,
  interval: number;

  // create and print a table to the console of defaults
  const initialTableObject: TableObject = {
    intervalRunsIn: `${timeout} ms`,
    nextPillIsWorth: points,
    score,
    pillsEaten,
  };

  console.table(initialTableObject);

  const makeNetworkRequest = async (url: string, options?: Options) => {
    try {
      const response = await fetch(url, options);
      const parsedResponse = await response.json();
      return parsedResponse;
    } catch (err) {
      console.log(`thre was an error: ${err}`);
    }
  }

  const padNumber = (numberToPad: number) => String(numberToPad).padStart(2, '0');

  const toggleModals = (modal: HTMLElement) => {
    snakeGameWrapper.classList.toggle('hidden');
    modal.classList.toggle('hidden');
  }

  window.onload = () => populateHiScores();

  const populateHiScores = async () => {
    try {
      if ("ontouchstart" in document.documentElement) {
        toggleModals(mobileNotSupportedModal);
        return;
      }

      hiScores = await makeNetworkRequest('/backend/get_scores.php');
      for (let i = 0; i < 10; i++) {
        const hiScore = hiScores[i] ?? {
          name: 'EMPTY',
          score: 0,
          time: '00:00:00',
          pills_eaten: 0,
        };
        const hiScoreRow: HTMLElement | null = document.querySelector(`.table-data-${i}`);
        if (!hiScoreRow) {
          throw Error('hi score row undefined or null . . .');
        }
        hiScoreRow.innerText = '';
        hiScoreRow.innerText = `${padNumber(i + 1)}. ${hiScore.name} - ${hiScore.score} - ${hiScore.time} - ${hiScore.pills_eaten} pills eaten`;
      }
    } catch (err) {
      console.log(`thre was an error: ${err}`);
      viewHiScoresButton.disabled = true;
    }
  }

  const drawSnake = () => {
    if (!snakeBoardContext) {
      throw new Error('canvas context is undefined or null . . .');
    }
    snake.forEach((part, i) => {
      !i ? snakeBoardContext.fillStyle = '#FF0' : snakeBoardContext.fillStyle = '#28BD00';
      snakeBoardContext.fillRect(part.x, part.y, 10, 10);
      snakeBoardContext.strokeRect(part.x, part.y, 10, 10);
    });
  }

  const populatePill = async (x?: number, y?: number) => {
    let pillIsOnOrAroundSnake = false;
    if (!x || !y) {

      // get random 10x10 blocks on the canvas for pill placement
      // add five to center the pill in the square on the grid
      const possibleX = Math.random() * 60 + 5;
      const possibleY = Math.random() * 35 + 5;
      
      // make sure the random coordinates are not on top of the snake
      snake.forEach(part => {
        if (possibleX * 10 - part.x <= 5 && possibleX * 10 - part.x >= -5 && possibleY * 10 - part.y <= 5 && possibleY * 10 - part.y >= -5) {
          pillIsOnOrAroundSnake = true;
        }
      });

      // make sure random coordinates are not off the border
      if (possibleX * 10 < 5 || possibleX * 10 > 595 || possibleY * 10 < 5 || possibleY * 10 > 345 || pillIsOnOrAroundSnake) {
        populatePill();
        return;
      }

      // scale values to actual columns and rows
      pillXValue = Math.round(possibleX) * 10 + 5;
      pillYValue = Math.round(possibleY) * 10 + 5;
    }

    // draw pills
    if (!snakeBoardContext) {
      throw new Error('canvas context is undefined or null . . .');
    }
    snakeBoardContext.beginPath();
    snakeBoardContext.ellipse(pillXValue, pillYValue, 5 , 5, Math.PI / 4, 0, 2 * Math.PI);
    snakeBoardContext.stroke();
    snakeBoardContext.fillStyle = pillColor;
    snakeBoardContext.fill();
    snakeBoardContext.closePath();
  }

  const handleStartOrResetButtonClick = (e: Event) => {
    if (!e || !e.target) {
      throw new Error('event in handleStartOrResetButtonClick is undefined or null . . .');
    }
    const target = e.target as HTMLElement;
    if (target.innerText.toLowerCase() !== 'reset') {
      target.innerText = 'Reset';

      viewInstructionsButton.disabled = true;
      viewHiScoresButton.disabled = true;
    
      interval = setInterval(adjustTimes, 1000);
    
      snakeBoard.focus();
    
      runGame();
      running = true;
    } else {
      location.reload();
    }
  }

  const adjustTimes = () => {
    seconds++;

    if (seconds === 60) {
      minutes++;
      seconds = 0;
      points += 3;
      console.log('extra points added for a minute');
    }

    if (minutes === 60) {
      hours++;
      minutes = 0;
      points += 13;
      console.log('extra points added for an hour');
    }

    timer.innerText = `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
  }

  const runGame = async () => {
    if (loser) {
      viewInstructionsButton.disabled = false;
      viewHiScoresButton.disabled = false;

      toggleModals(gameOverModal);
      closeGameOverButton.focus();
      finalScore.innerText = String(score);

      if (hiScores && !hiScores[9] || score > Number(hiScores[9].score)) {
        const name = prompt(`
          Congrats, You\'ve scored in the top 10!!
          Please enter an identifier:
        `);
        await insertScore(name ? name : 'anonymous');
        populateHiScores();
      } else {
        insertScore('not_a_hi_scorer');
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

  const clearCanvas = () => {
    if (!snakeBoardContext) {
      throw new Error('canvas context is undefined or null . . .');
    }
    snakeBoardContext.fillStyle = '#000';
    snakeBoardContext.fillRect(0, 0, snakeBoard.width, snakeBoard.height);
    snakeBoardContext.strokeRect(0, 0, snakeBoard.width, snakeBoard.height);
  }

  const moveSnake = () => {  

    // check for collision with walls
    if (snake[0].x + xVelocity === -10 || snake[0].x + xVelocity === 600 || snake[0].y + yVelocity === -10 || snake[0].y + yVelocity === 350) {
      loser = true;
      running = false;
      clearInterval(interval);
      return;
    }

    // where the snake will be next
    const head: Head = {
      x: snake[0].x + xVelocity,
      y: snake[0].y + yVelocity,
    };

    checkForTailCollision(head);

    if (checkForPillCollision(head)) {
      populatePill();
    } else {
      snake.unshift(head);
      snake.pop();
    }
  }

  const checkForTailCollision = (head: Head) => {
    snake.forEach(part => {
      if (head.x === part.x && head.y === part.y) {
        loser = true;
        clearInterval(interval);
      }
    });
  }

  const checkForPillCollision = (head: Head) => {
    if ((xVelocity && head.x + 5 === pillXValue) && head.y + 5 === pillYValue || (yVelocity && head.y + 5 === pillYValue) && head.x + 5 === pillXValue) {

      pillColor === '#F00' ? pillColor = '#00F' : pillColor = '#F00';

      snake.unshift(head);

      score += points;
      points++;
      pillsEaten++;
      timeout = Number((timeout - .04).toFixed(2));

      const tableObject: TableObject = {
        intervalRunsIn: `${timeout} ms`,
        nextPillIsWorth: points,
        score,
        pillsEaten,
      };
      console.table(tableObject);
      return true;
    }
  }

  // update velocities based on keypresses
  // and make sure that you can't move backwards into your self
  const setVelocities = (e: KeyboardEvent) => {
    if (!keyClicked) {
      keyClicked = true;
      if (!xVelocity && e.key.toLowerCase() === 'a') {
        xVelocity = -10;
        yVelocity = 0;
      } else if (!xVelocity && e.key.toLowerCase() === 'd') {
        xVelocity = 10;
        yVelocity = 0;
      } else if (!yVelocity && e.key.toLowerCase() === 'w') {
        xVelocity = 0;
        yVelocity = -10;
      } else if (!yVelocity && e.key.toLowerCase() === 's') {
        xVelocity = 0;
        yVelocity = 10;
      }
    }
  }

  const insertScore = async (name: string) => {
    if (viewHiScoresButton.disabled) {
      console.log('db doesn\'t seem to be up');
      return;
    }
    try {
      const time = timer.innerText;
      const options: Options = {
        method: 'POST',
        body: JSON.stringify({ score, name, time, pillsEaten }),
        headers: {
          'content-type': 'application/json',
        },
      };
      await makeNetworkRequest('/backend/insert_scores.php', options);
    } catch (err) {
      console.log(`thre was an error: ${err}`);
    }
  }

  drawSnake();
  populatePill();
}

app();