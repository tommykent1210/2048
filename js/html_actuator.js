function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");
  this.timerContainer   = document.querySelector(".timer-container");
  this.gridContainer    = document.querySelector(".grid-container");
  this.menuContainer    = document.querySelector(".main-menu");
  this.rootContainer    = document.querySelector(".container");
  this.gameContainer    = document.querySelector(".game-container");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;
  if (metadata.isMenu) {
    console.log("Dispaly Menu");
    window.requestAnimationFrame(function () {
      self.clearContainer(self.tileContainer);
      self.message("menu");
    }); 
  } else {
    window.requestAnimationFrame(function () {
      self.clearContainer(self.tileContainer);

      grid.cells.forEach(function (column) {
        column.forEach(function (cell) {
          if (cell) {
            self.addTile(cell);
          }
        });
      });

      self.updateScore(metadata.score);
      self.updateBestScore(metadata.bestScore);

      if (metadata.terminated) {
        if (metadata.isMenu) {
          console.log("Gamestate: Menu");
          self.message("menu"); // You lose
        } else if (metadata.over) {
          console.log("Gamestate: Over");
          self.message("lose"); // You win!
        } else if (metadata.won) {
          console.log("Gamestate: Won");
          self.message("won"); //show menu
        }
      }

    });
  }
};

//setup the game grid
HTMLActuator.prototype.setupGameGrid = function (size) {
  var classesRow    = [ "grid-row" ];
  var classesCell   = [ "grid-cell" ];
  this.clearContainer(this.gridContainer);
  
  //apply size classes
  if (size === 4) {
    this.rootContainer.classList.add("game-size-four");
    this.rootContainer.classList.remove("game-size-five");
    this.rootContainer.classList.remove("game-size-six");
    this.gameContainer.classList.add("game-size-four");
    this.gameContainer.classList.remove("game-size-five");
    this.gameContainer.classList.remove("game-size-six");
  } else if (size === 5) {
    this.rootContainer.classList.remove("game-size-four");
    this.rootContainer.classList.add("game-size-five");
    this.rootContainer.classList.remove("game-size-six");
    this.gameContainer.classList.remove("game-size-four");
    this.gameContainer.classList.add("game-size-five");
    this.gameContainer.classList.remove("game-size-six");
  } else {
    this.rootContainer.classList.remove("game-size-four");
    this.rootContainer.classList.remove("game-size-five");
    this.rootContainer.classList.add("game-size-six");
    this.gameContainer.classList.remove("game-size-four");
    this.gameContainer.classList.remove("game-size-five");
    this.gameContainer.classList.add("game-size-six");
  }

  for (var x = 0 ; x < size; x++) {
    var gridRow   = document.createElement("div");
    for (var y = 0 ; y < size; y++) {
      var gridCell  = document.createElement("div");
      //apply grid-cell
      this.applyClasses(gridCell, classesCell);
      gridRow.appendChild(gridCell);
    };
    //apply grid-row class
    this.applyClasses(gridRow, classesRow);
    // Put the tile on the board
    this.gridContainer.appendChild(gridRow);  
  };
};


// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value === "2") {
    classes.push("tile-2");
  } else if (tile.value > 2048) {
    classes.push("tile-super");
  }
  
  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.updateTimer = function (time) {
  this.timerContainer.textContent = "00:0" + time;
};

HTMLActuator.prototype.activateButton = function(identifier) {
  var buttonSelector = document.querySelector(identifier);
  buttonSelector.classList.add("button-active");
}; 

HTMLActuator.prototype.deactivateButton = function(identifier) {
  var buttonSelector = document.querySelector(identifier);
  buttonSelector.classList.remove("button-active");
}; 

HTMLActuator.prototype.message = function (status) {
  var type = null;
  var message = null;

  if (status === "won") {
    type = "game-won";
    message = "You Win!";
    this.messageContainer.classList.add("menu-hidden");
  } else if (status === "lose") {
    type = "game-over";
    message = "Game over!";
    this.messageContainer.classList.add("menu-hidden");
  } else {
    type = "game-menu";
    message = "Menu";
    this.messageContainer.classList.remove("menu-hidden");
  }

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  if (type !== "game-menu") {
    this.clearContainer(this.sharingContainer);
    this.sharingContainer.appendChild(this.scoreTweetButton());
    twttr.widgets.load();
  } 
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
  this.messageContainer.classList.remove("game-menu");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "tommykent1210");
  tweet.setAttribute("data-url", "http://tommykent1210.github.io/8192");
  tweet.setAttribute("data-counturl", "http://tommykent1210.github.io/8192/");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at 8192, a game where you " +
             "join numbers to score high! #8192game";
  tweet.setAttribute("data-text", text);

  return tweet;
};
