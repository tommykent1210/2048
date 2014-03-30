function GameManager(InputManager, Actuator, StorageManager) {
  this.size           = 5; // Size of the grid
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.startTiles     = 2;
  this.spawnChance    = 0.8;
  this.timerMaxSeconds   = 3;
  this.timerCurrentSeconds  = 3;
  this.timerObj = null;
  this.isDebug = true;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("begin", this.beginGame.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("difficultyEasy", this.gamemodeDifficultyEasy.bind(this));
  this.inputManager.on("difficultyMedium", this.gamemodeDifficultyMedium.bind(this));
  this.inputManager.on("difficultyHard", this.gamemodeDifficultyHard.bind(this));
  this.inputManager.on("sizeFour", this.gamemodeSizeFour.bind(this));
  this.inputManager.on("sizeFive", this.gamemodeSizeFive.bind(this));
  this.inputManager.on("sizeSix", this.gamemodeSizeSix.bind(this));
  this.inputManager.on("gmAdd", this.gamemodeAddToggle.bind(this));
  this.inputManager.on("gmRemove", this.gamemodeRemoveToggle.bind(this));

  this.difficultySettings = {
    "easy":{
      "timerAddMaxSeconds": 10,
      "timerRemoveMaxSeconds": 30,
      "startMultiplier": 1.0
    },
    "medium":{
      "timerAddMaxSeconds": 6,
      "timerRemoveMaxSeconds": 20,
      "startMultiplier": 2.0
    },
    "hard":{
      "timerAddMaxSeconds": 3,
      "timerRemoveMaxSeconds": 10,
      "startMultiplier": 3.0
    }
  };
  this.isMenu = true;
  this.gameModeAddEnabled = false;
  this.gameModeRemoveEnabled = false;
  this.gameModeDifficulty = "medium";
  this.gameModeMultiplier = 1.0;

    //reset the game menu
  this.resetGameMenu();
  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  console.log("Restart Game");
  this.resetGameMenu();
  this.isMenu = true;
  this.setup();
  this.clearTimers();
};

GameManager.prototype.beginGame = function () {
  this.isMenu = false;
  this.storageManager.clearGameState();
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();  
};



// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};

// Display the menu
GameManager.prototype.displayMenu = function () {
  this.isMenu = true;
  this.clearTimers();
};



// Set up the game
GameManager.prototype.setup = function () {
  
  var previousState = this.storageManager.getGameState();


  // Reload the game from a previous game if present
  if (previousState) {
    this.actuator.setupGameGrid(previousState.grid.size);
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else if (this.isMenu) {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;
    this.timerCurrentSeconds = this.timerMaxSeconds;
    this.actuator.setupGameGrid(this.size);
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;
    this.timerCurrentSeconds = this.timerMaxSeconds;
    this.actuator.updateTimer(this.timerCurrentSeconds);
    this.actuator.setupGameGrid(this.size);
    // Add the initial tiles
    this.addStartTiles();
  }
  //start the timer
  if (!this.isMenu) {
    this.timerObj = window.setInterval(this.timer.bind( this ), 1000 );
  }

  // Update the actuator
  this.actuate();
};

GameManager.prototype.resetGameMenu = function () {
  this.gameModeDifficulty = "medium";
  this.size = 5;
  this.actuator.deactivateButton(".gamemode-difficulty-easy");
  this.actuator.activateButton(".gamemode-difficulty-medium");
  this.actuator.deactivateButton(".gamemode-difficulty-hard");
  this.actuator.deactivateButton(".gamemode-size-four");
  this.actuator.activateButton(".gamemode-size-five");
  this.actuator.deactivateButton(".gamemode-size-six");
}

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

GameManager.prototype.timer = function() {
  if (this.over == true) {
    this.timerCurrentSeconds = 0;
  } else {
      
    if (this.timerCurrentSeconds <= 0) {
       this.timerCurrentSeconds = this.timerMaxSeconds;
       if (this.grid.cellsAvailable()) {
        
        var tile = new Tile(this.grid.randomAvailableCell(), "X");

        this.grid.insertTile(tile);
        this.actuator.addTile(tile);
        this.storageManager.setGameState(this.serialize());
        if (!this.movesAvailable()) {
          console.log("Game Over");
          this.over = true; // Game over!
          this.actuate(this.grid, this);
          this.clearTimers();
          this.timerCurrentSeconds = 0;
        }

       }

       //console.log('Add new tile...');
    }
    this.timerCurrentSeconds = this.timerCurrentSeconds - 1;
  }
  //console.log('Timer: ' + this.timerCurrentSeconds);

  //Do code for showing the number of seconds here
  this.actuator.updateTimer(this.timerCurrentSeconds);
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  //only spawn a new tile at certain times
  
    if (this.grid.cellsAvailable()) {
      var value = Math.random() < 0.9 ? 2 : 4;
      var tile = new Tile(this.grid.randomAvailableCell(), value);

      this.grid.insertTile(tile);
    }
    return tile;

};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore(this.size, this.gameModeDifficulty) < this.score) {
    this.storageManager.setBestScore(this.score, this.size, this.gameModeDifficulty);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
    this.ismenu = true;
  } else {
    this.storageManager.setGameState(this.serialize());
    this.ismenu = false;
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(this.size, this.gameModeDifficulty),
    terminated: this.isGameTerminated(),
    isMenu:     this.isMenu
  });

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying
  };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

GameManager.prototype.clearTimers = function () {
  clearInterval(this.timerObj);
};


// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 128) {
            self.won = true;
            self.clearTimers();
          }
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    if (Math.random() < this.spawnChance) {
      this.addRandomTile();
    }
    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {

        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value && (other.value !== "X" || tile.value !== "X")) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

//Game Mode Stuff

// Restart the game
GameManager.prototype.gamemodeDifficultyEasy = function () {
  this.gameModeDifficulty = "easy";
  this.actuator.activateButton(".gamemode-difficulty-easy");
  this.actuator.deactivateButton(".gamemode-difficulty-medium");
  this.actuator.deactivateButton(".gamemode-difficulty-hard");

  if (this.isDebug === true) {
    console.log("Button Press: gamemodeDifficultyEasy");
  }
};
// Restart the game
GameManager.prototype.gamemodeDifficultyMedium = function () {
  this.gameModeDifficulty = "medium";
  this.actuator.deactivateButton(".gamemode-difficulty-easy");
  this.actuator.activateButton(".gamemode-difficulty-medium");
  this.actuator.deactivateButton(".gamemode-difficulty-hard");
  if (this.isDebug === true) {
    console.log("Button Press: gamemodeDifficultyMedium");
  }
};
// Restart the game
GameManager.prototype.gamemodeDifficultyHard = function () {
  this.gameModeDifficulty = "hard";
  this.actuator.deactivateButton(".gamemode-difficulty-easy");
  this.actuator.deactivateButton(".gamemode-difficulty-medium");
  this.actuator.activateButton(".gamemode-difficulty-hard");
  if (this.isDebug === true) {
    console.log("Button Press: gamemodeDifficultyHard");
  }
};
// Restart the game
GameManager.prototype.gamemodeSizeFour = function () {
  this.size = 4;
  this.actuator.activateButton(".gamemode-size-four");
  this.actuator.deactivateButton(".gamemode-size-five");
  this.actuator.deactivateButton(".gamemode-size-six");
  if (this.isDebug === true) {
    console.log("Button Press: gamemodeSizeFour");
  }
};
// Restart the game
GameManager.prototype.gamemodeSizeFive = function () {
  this.size = 5;
  this.actuator.deactivateButton(".gamemode-size-four");
  this.actuator.activateButton(".gamemode-size-five");
  this.actuator.deactivateButton(".gamemode-size-six");
  if (this.isDebug === true) {
    console.log("Button Press: gamemodeSizeFive");
  }
};
// Restart the game
GameManager.prototype.gamemodeSizeSix = function () {
  this.size = 6;
  this.actuator.deactivateButton(".gamemode-size-four");
  this.actuator.deactivateButton(".gamemode-size-five");
  this.actuator.activateButton(".gamemode-size-six");
  if (this.isDebug === true) {
    console.log("Button Press: gamemodeSizeSix");
  }
};
// Restart the game
GameManager.prototype.gamemodeAddToggle = function () {
  if (this.gameModeAddEnabled === true) {
    this.gameModeAddEnabled = false;
  } else {
    this.gameModeAddEnabled = true;
  }
  if (this.isDebug === true) {
    console.log("Button Press: gamemodeAddToggle");
  }
};
// Restart the game
GameManager.prototype.gamemodeRemoveToggle = function () {
  if (this.gameModeRemoveEnabled === true) {
    this.gameModeRemoveEnabled = false;
  } else {
    this.gameModeRemoveEnabled = true;
  }
  if (this.isDebug === true) {
    console.log("Button Press: gamemodeRemoveToggle");
  }
};
