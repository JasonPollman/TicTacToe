/**
 * Jason Pollman
 * ITCS 4230-091
 * 9/11/14
 */

// Immediately Run Anonymous Function
// Runs when the script is loaded:
(function ($) {

  // Shorthand for $(document).ready()
  $(function () {

    // Insert the game HTML wrappers into the HTML file at element "#tic-tac-toe":
    $("#tic-tac-toe").append('<div id="header"></div><div id="times-won"></div><div id="push-messages"><div id="message"></div></div><div id="playable"><div id="board"></div></div>');
    
    // When the user clicks the "#play" element,
    // If will start a new game using the options from the
    // HTML input fields.
    $("#play").unbind('click').click(function () {

      var p1 = $("#player1-name").val();
      p1 = p1.charAt(0).toUpperCase() + p1.slice(1);

      var p2 = $("#player2-name").val();
      p2 = p2.charAt(0).toUpperCase() + p2.slice(1);

      var g = new ticTacToe().new({
        player1Name: p1,
        player2Name: p2,
        boardSize: $("#board-size").val()
      });

      // Show the game board and animate the title screen out:
      $("#tic-tac-toe").show();
      $("#title-page").animate({ left: "-100%" }, { duration: 1000, easing: 'easeInOutExpo' });
    
    }); // End .click() handler

  }); // End document.ready()

})(jQuery);


// <------------------------------------ ticTacToe CLASS ------------------------------------> //
var ticTacToe = function () {

  // For scoping, in the event of callbacks
  var self = this;

  // The default options, what these values will be if the
  // user doesn't pass any:
  var options = {

    // How big the board will be...
    boardSize : 3,

    // Duration of a move before a random move (ms)...
    moveTimeout : 3000, // 3.0 Sec

    // Default Player Names
    player1Name : "Player 1",
    player2Name : "Player 2",

    player1Mark : "x",
    player2Mark : "o",

    fadeDuration: 0800, // 0.8 Sec
    pushDuration: 8000, // 5.0 Sec

    nextGameTimeout: 5, // In seconds, 5.0 Sec

  } // End options Object

  // The amount of time before a push message dissapears (if not "sticky")
  var pushTimeout;

  // The message object:
  // Push, append or clear messages to the "#message" element.
  var message = {

    // Push a new message to the "#message" element.
    push: function (msg, strClasses, sticky) {

      $("#tic-tac-toe #push-messages #message").stop().fadeOut(options.fadeDuration, function (e) {
        $(this).html(msg).removeClass().addClass('push-' + (strClasses || 'notice')).fadeIn(options.fadeDuration);
      });

      if(!sticky) {
        pushTimeout = setTimeout(function () {
          $("#tic-tac-toe #push-messages #message").fadeOut(options.fadeDuration);
          clearTimeout(pushTimeout);
        }, options.pushDuration);
      }

    }, // End push()

    // Append a message to the current "#message" message.
    append: function (msg, strClasses, sticky) {

      $("#tic-tac-toe #push-messages #message").hide(function (e) {
        $(this).html($(this).html() + '<br />' + msg).removeClass().addClass('push-' + (strClasses || 'notice')).fadeIn(options.fadeDuration);
      });

      clearTimeout(pushTimeout);
      if(!sticky) {
        pushTimeout = setTimeout(function () {
          $("#tic-tac-toe #push-messages #message").fadeOut(options.fadeDuration);
          clearTimeout(pushTimeout);
        }, options.pushDuration);
      }

    }, // End append()

    // Clear the "#message" element.
    clear: function () {
      $("#tic-tac-toe #push-messages #message").html("");

    } // End clear()

  } // End message Object


  // <----------------------- PRIVATE PROPERTIES -----------------------> //

  // The moves currently made in the format: { player1: [array of moves], player2: [array of moves] }
  var moves     = { 1: [], 2: [] };
  // The moves currently made in the format: [[row, col, player], [row, col, player]...]
  var movesRaw  = [];
  // The total number of moves made so far.
  var moveCount = 0;
  // 1 || 2.. depending on which player's turn it is.
  var turn      = undefined;
  // True is the game is over (won or tied)
  var gameOver  = false;
  // The last move made in the format: [row, col]
  var lastMove  = [];
  // The number of times each player has won a game in the format: [stalemates, player 1, player 2]
  var timesWon  = [0, 0, 0];

  // Getters for public access:
  // @see: self.game()
  var game = {

    get turn          () { return turn         },
    get moves         () { return moves        }, 
    get totalMoves    () { return moves.length },
    get gameOver      () { return isGameOver() },
    get winner        () { return winner()     },
    get lastMove      () { return lastMove()   },

    get currentMove   () { return (turn == 1) ? options.player1Name : options.player2Name },
    get currentPlayer () { return (turn == 1) ? options.player1Name : options.player2Name }

  } // End game Object


  // <------------------------- PUBLIC METHODS -------------------------> //
  /**
   * Create a new instance of the game
   */
  self.new = function (userOpts) {

    // Replace defaults with the user's settings:
    setOptions(userOpts || {});

    // Build the game board:
    buildBoard();

    // Start gameplay:
    gameplay();


  } // End new() method


  /**
   * Retrieve the game object, for info about this game:
   */
  self.game = function () { return game; }


  /**
   * Stop the nextGameTimeout from starting a new game automatically.
   */
  self.stop = function () {
    clearInterval(nextGameTimeout);
  }


  // <------------------------- PRIVATE METHODS ------------------------> //

  /**
   * Mitigates the gameplay logic, including resetting all variables,
   * and calling the methods to determine which player's turn it is,
   * showing moves on the board, etc.
   */
  function gameplay() {

    // Bind the "quit" buttons to their actions.
    $('#tic-tac-toe #quit, #quit-2').unbind('click').click(function () {
      // Show the title screen
      $("#title-page").animate({ left: 0 }, { duration: 1000, easing: 'easeInOutExpo' });
      // Clear the Push Messages
      $("#push-messages #message").html("");
    });

    // Reset game values
    moves     = { 1: [], 2: [] };
    movesRaw  = [];
    moveCount = 0;
    turn      = undefined;
    gameOver  = false;

    // Remove the score chart
    $('#tic-tac-toe #times-won *').remove();

    // Append the score chart
    $('#tic-tac-toe #times-won').append('<strong>Winning Stats:</strong><hr><div>' + options.player1Name + ': <span id="wp-' + 1 + '">' + timesWon[1] + '</span></div>');
    $('#tic-tac-toe #times-won').append('<div>' + options.player2Name + ': <span id="wp-' + 2 + '">' + timesWon[2] + '</span></div>');
    $('#tic-tac-toe #times-won').append('<div>' + 'Stale Mate: ' + '<span id="wp-0">' + timesWon[0] + '</span></div><hr>');

    // Remove any "winning" moves remaning on the board from a previous game
    $('.board-col').html("").removeClass("winning-move");

    // Determine if Player 1 or Player 2 goes first
    turn = Math.floor(Math.random() * (3 - 1)) + 1;
    message.push(game.currentPlayer + " has been randomly chosen to go first!", "notice", true);

    // The click handler for when a player clicks on a game square to make their move
    $('#tic-tac-toe #board #board-table div.block').unbind('click').click(function () {

      // If the block is empty, make the move
      if($(this).html() == '') {


        $(this).html('<div class="player-' + turn + '-mark player-mark" style="line-height: ' + $(this).height() + 'px; ">' + ((turn == 1) ? options.player1Mark : options.player2Mark + "</div>"));
        
        // Grab the row and column from the block which was clicked on
        var row = $(this).attr('class').match(/row-(\d+)/)[1];
        var col = $(this).attr('class').match(/col-(\d+)/)[1];

        // Add the move to the moves array
        moves[turn].push({ row: row, col: col });
        movesRaw.push('r:' + row + 'c:' + col + 'p:' + turn);

        lastMove = [row, col];
        moveCount++;

        // Determine if the user has won the game, if not, proceed to the next player's turn
        gameOver = winner();
        if(!gameOver) nextTurn();
      }
      else { // Otherwise, the block is taken, display a message & allow the player to choose again.
        message.push("That spot's taken!", 'notice');
      }

    }) // End click handler

  } // End gameplay()


  /**
   * Overwrite the default game options with properties from the 'userOpts' object.
   */
  function setOptions (userOpts) {
    if(userOpts) for(var i in options) if(options.hasOwnProperty(i) && userOpts[i]) options[i] = userOpts[i];

  } // End setOptions()


  /**
   * Set the next turn and notify the players.
   */
  function nextTurn () {
    var lastPlayer = game.currentPlayer;
    turn = (turn == 1) ? 2 : 1;
    message.push(lastPlayer + " has made their mark in row " + (parseInt(lastMove[0]) + 1) + ", column " + (parseInt(lastMove[1]) + 1) + ". <span class=\"emphasis\">Now, it's " + ((turn == 1) ? options.player1Name : options.player2Name) + "'s turn.</span>", "notice", true);
  }


  /**
   * Determine if the game has a winner in its current state.
   */
  function winner () {

    var winningPlayer = undefined;
    var loosingPlayer = undefined;

    // The number of moves == the maxiumum that can be made.
    // It must be a stale mate.
    if(moveCount == Math.pow(options.boardSize, 2)) {
      message.push("Stale Mate! There's no spots left. Game Over.", 'notice', true);
      gameOver = true;
      wp = 0;
      loosingPlayer = null;
    }
    else {

      // Determine if there is a winning combination:
      gameOver = (turn == 1) ? determineWinner(1) : determineWinner(2);

      if(gameOver) {
        wp = (turn == 1) ? 1 : 2;

        winningPlayer = (turn == 1) ? options.player1Name : options.player2Name;
        loosingPlayer = (turn == 1) ? options.player2Name : options.player1Name;
        message.push(winningPlayer + " has defeated " + loosingPlayer + "!", 'notice', true);
      }

    }

    if(gameOver) { // If the game is over, and a winner has been determined:

      // Increment the scoreboard for the winning player (or stalemate)
      timesWon[wp] = parseInt($('#tic-tac-toe #times-won #wp-' + wp).html());
      $('#tic-tac-toe #times-won #wp-' + wp).html(++timesWon[wp]);

      // Set interval to start the next game
      message.append('<span id="play-again">Next game in <span id="timer">' + options.nextGameTimeout + '</span>.<span id="quit"> Tired of playing? Quit.</span></span>', 'notice', true);
      var timeToNextGame = options.nextGameTimeout;
      var nextGameTimeout = setInterval(function () {

        $("#tic-tac-toe #timer").html(timeToNextGame);

        // Provide the options to quit.
        $('#tic-tac-toe #quit, #quit-2').unbind('click').click(function () {
          $("#title-page").animate({ left: 0 }, { duration: 1000, easing: 'easeInOutExpo' });
          clearInterval(nextGameTimeout);
          $("#push-messages #message").html("");
        });

        // Animate the countdown to the next game
        timeToNextGame--;
        if(timeToNextGame <= -1) {
          clearInterval(nextGameTimeout);
          gameplay();
          message.clear();
        }
      }, 1000);
      $('#tic-tac-toe #board #board-table div.block').unbind('click');
      
    }

    return gameOver;

  } // End winner()


  /**
   * Winning logic for winner() moved here...
   */
  function determineWinner (player) {

    // Can't win without at least 5 moves
    if(movesRaw.length < 5) return false;

    var cols = {};
    var rows = {};

    for(var i in moves[player]) {
      cols[moves[player][i].col] = !cols[moves[player][i].col] ? 1 : ++cols[moves[player][i].col];
      rows[moves[player][i].row] = !rows[moves[player][i].row] ? 1 : ++rows[moves[player][i].row];
    }

    var diagDown = 0;
    var diagUp = 0;
    var diagDownWinners = [];
    var diagUpWinners = [];

    var l = options.boardSize - 1;

    for(var i = 0; i < options.boardSize; i++) {

      // Vertical & Horizontal wins determined in O(n).

      // If the count of cols for column i == the board size,
      // there is a horizonal win.
      if((cols[i] && cols[i] >= options.boardSize)) {
        $('#tic-tac-toe #board .col-' + i).addClass('winning-move');
        return true;
      }

      // If the number of rows for rows i == the board size,
      // there is a vertical win.
      if(rows[i] && rows[i] >= options.boardSize) {
        $('#tic-tac-toe #board .row-' + i).addClass('winning-move');
        return true;
      }

      // Diagonal wins determined in O(n*m).
      for(var k in movesRaw) {
        if(movesRaw[k] == 'r:' + i + 'c:' + i + 'p:' + turn) {
          diagDown++;
          diagDownWinners.push([i, i]);
        }

        if(movesRaw[k] == 'r:' + i + 'c:' + l + 'p:' + turn) {
          diagUp++;
          diagUpWinners.push([i, l]);
        }

      } // End inner for loop

      l--;

    } // End outer for loop

    // Colorize diagonal win moves.
    if(diagDown >= options.boardSize) {
      for(var i in diagDownWinners) $('#tic-tac-toe #board .row-' + diagDownWinners[i][0] + '.col-' + diagDownWinners[i][1]).addClass('winning-move');
      return true;
    }
    else if(diagUp >= options.boardSize) {
      for(var i in diagUpWinners) $('#tic-tac-toe #board .row-' + diagUpWinners[i][0] + '.col-' + diagUpWinners[i][1]).addClass('winning-move');
      return true;
    }

    return false;

  } // End determineWinner()


  /**
   * "Builds" the game board by inserting HTML into the "#board" element.
   */
  function buildBoard () {

    var board = ['<div id="board-table">'];

    // Rows
    for(var i = 0; i < options.boardSize; i++) {

      board.push('<tr class="board-row row-' + i + '">');
      
      // Columns
      for(var n = 0; n < options.boardSize; n++) {

        var classes = ['block', 'board-col'];

        // So we can "knock out" some border sides so that the game board looks like a traditional
        // tic-tac-toe board.
        if(i % options.boardSize == 0) { classes.push('top'); }
        if(i % options.boardSize == options.boardSize - 1) { classes.push('bottom'); }

        if(n % options.boardSize == 0) { classes.push('left'); }
        if(n % options.boardSize == options.boardSize - 1) { classes.push('right'); }

        board.push('<div class="row-' + i + ' col-' + n + " " + classes.join(' ') + '"></div>');
      
      } // End inner for loop

      board.push("</tr>");

    } // End for loop

    board.push("</div>");

    $("#tic-tac-toe #board").html(board.join(''));
    $("#tic-tac-toe #board #board-table div.block").attr('style', 'width:' + 90/options.boardSize + '%;' + 'height:' + 90/options.boardSize + '%;' + 'min-width:' + 90/options.boardSize + '%;');

  } // End buildBoard()

} // End ticTacToe Object Function
