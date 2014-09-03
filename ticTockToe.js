(function ($) {

  $(function () {

    var game = new ticTockToe();
    game.new();

  }); // End document.ready()

})(jQuery);


// <------------------------------------ ticTockToe CLASS ------------------------------------> //

var ticTockToe = function () {

  // For scoping, in the event of callbacks
  var self = this;

  // The default options
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

    fadeDuration:  800, // 0.8 Sec
    pushDuration: 5000, // 5.0 Sec

    nextGameTimeout: 5, // In seconds, 5.0 Sec
    nextMoveTimeout: 3  // 3.0 Sec

  } // End options Object

  var pushTimeout;
  var message = {

    push: function (msg, strClasses, sticky) {

      $("#push-messages #message").stop().fadeOut(options.fadeDuration, function (e) {
        $(this).html(msg).removeClass().addClass('push-' + (strClasses || 'notice')).fadeIn(options.fadeDuration);
      });

      if(!sticky) {
        pushTimeout = setTimeout(function () {
          $("#push-messages #message").fadeOut(options.fadeDuration);
          clearTimeout(pushTimeout);
        }, options.pushDuration);
      }

    }, // End push()

    append: function (msg, strClasses, sticky) {

      $("#push-messages #message").hide(function (e) {
        $(this).html($(this).html() + '<br />' + msg).removeClass().addClass('push-' + (strClasses || 'notice')).fadeIn(options.fadeDuration);
      });

      clearTimeout(pushTimeout);
      if(!sticky) {
        pushTimeout = setTimeout(function () {
          $("#push-messages #message").fadeOut(options.fadeDuration);
          clearTimeout(pushTimeout);
        }, options.pushDuration);
      }

    }, // End append()

    clear: function () {
      $("#push-messages #message").html("");
    } // End clear()

  } // End message Object



  // <----------------------- PRIVATE PROPERTIES -----------------------> //

  var moves     = { 1: [], 2: [] };
  var movesRaw  = [];
  var moveCount = 0;
  var turn      = undefined;
  var gameOver  = false;
  var lastMove    = [];


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

  self.new = function (userOpts) {

    // Replace defaults with the user's settings:
    setOptions(userOpts || {});

    // Build the game board:
    buildBoard();

    // Start gameplay:
    reset();



  } // End new() method


  self.game = function () { return game; }


  self.restart = function () {
    reset();
    self.new();
  }


  // <------------------------- PRIVATE METHODS ------------------------> //

  function setMoveTimer() {
    var moveTimer = options.nextMoveTimeout;
    moveInterval = setInterval(function () {
      $("#move-timer").html(moveTimer + "<br />Seconds left Until Random Choice!");
      
      if(moveTimer <= 0) {
        clearInterval(moveInterval);
        makeRandomMove();
      }
      moveTimer--;
    }, 1000);
  }

  function makeRandomMove() {
    
    var row = Math.floor(Math.random() * (options.boardSize));
    var col = Math.floor(Math.random() * (options.boardSize));
    console.log(movesRaw.indexOf([row, col, 1]));

    while(movesRaw.indexOf([row, col, 1]) == -1) {
      row = Math.floor(Math.random() * (options.boardSize));
      col = Math.floor(Math.random() * (options.boardSize));
      console.log(row, col, turn, movesRaw, movesRaw.indexOf([row, col, 1]));
      if(movesRaw.indexOf([row, col, 1]) == -1) break;
    }

    moves[turn].push({ row: row, col: col });
    movesRaw.push([row, col, turn]);

    gameOver = winner();
    if(!gameOver) {
      nextTurn();
      setMoveTimer();
    }
  }

  function reset() {

    moves     = { 1: [], 2: [] };
    movesRaw  = [];
    moveCount = 0;
    turn      = undefined;
    gameOver  = false;

    $('.board-col').html("").removeClass("winning-move");

    // Determine if Player 1 || 2 goes first:
    turn = Math.floor(Math.random() * (3 - 1)) + 1;
    message.push(game.currentPlayer + " has been randomly choosen to go first!", "notice");

    
    setMoveTimer();

    $('#game-page #board table tr td').click(function () {
      if($(this).html() == '') {
        $(this).html('<div class="player' + turn + '-mark">' + ((turn == 1) ? options.player1Mark : options.player2Mark + "</div>"));
        
        var row = $(this).attr('class').match(/row-(\d+)/)[1];
        var col = $(this).attr('class').match(/col-(\d+)/)[1];

        moves[turn].push({ row: row, col: col });
        movesRaw.push([row, col, turn]);
        lastMove = [row, col];
        moveCount++;
        gameOver = winner();
        if(!gameOver) {
          nextTurn();
          setMoveTimer();
        }
      }
      else {
        message.push("That spot's taken!", 'notice');
      }

    }) // End click handler

  } // End reset()


  function setOptions (userOpts) {
    if(userOpts) for(var i in options) if(options.hasOwnProperty(i) && userOpts[i]) options[i] = userOpts[i];

  } // End setOptions()


  function nextTurn () {
    turn = (turn == 1) ? 2 : 1;
    message.push("You made your mark in row " + (parseInt(lastMove[0]) + 1) + ", column " + (parseInt(lastMove[1]) + 1) + ". Now, it's " + ((turn == 1) ? options.player1Name : options.player2Name) + "'s turn.", "notice", true);
  }


  function winner () {

    if(moveCount == Math.pow(options.boardSize, 2)) {
      message.push("Stale Mate! There's no spots left. Game Over.", 'notice', true);
      gameOver = true;
    }
    else {

      var winningPlayer = undefined;
      var loosingPlayer = undefined;

      console.log(moves);

      // Determine if there is a winning combination:
      gameOver = (turn == 1) ? determineWinner(1) : determineWinner(2);
      winningPlayer = (turn == 1) ? options.player1Name : options.player2Name;
      loosingPlayer = (turn == 1) ? options.player2Name : options.player1Name;

      if(gameOver) message.push(winningPlayer + " has defeated Player " + loosingPlayer + "!", 'notice', true);

    }

    if(gameOver) {
      message.append('<span id="play-again">Next game in <span id="timer">' + options.nextGameTimeout + '</span></span>', 'notice', true);
      var timeToNextGame = options.nextGameTimeout;
      var nextGameTimeout = setInterval(function () {
        timeToNextGame--;
        if(timeToNextGame <= 0) {
          clearInterval(nextGameTimeout);
          reset();
          message.clear();
        }
        $("#timer").html(timeToNextGame);
      }, 1000);
      $('#game-page #board table tr td').unbind('click');
      
    }

    return gameOver;

  } // End winner()


  function determineWinner (player) {

    var cols = {};
    var rows = {};

    for(var i in moves[player]) {
      cols[moves[player][i].col] = !cols[moves[player][i].col] ? 1 : ++cols[moves[player][i].col];
      rows[moves[player][i].row] = !rows[moves[player][i].row] ? 1 : ++rows[moves[player][i].row];

      console.log(cols, rows);
    }

    var diags = 0;
    for(var i = 0; i < options.boardSize; i++) {
      if((cols[i] && cols[i] >= options.boardSize)) {
        $('#board .col-' + i).addClass('winning-move');
        return true;
      }
      if(rows[i] && rows[i] >= options.boardSize) {
        $('#board .row-' + i).addClass('winning-move');
        return true;
      }

      // WORK ON THIS
      if(cols[i] && cols[i] >= 1 && rows[i] && rows[i] >= 1) {

        diags++;
        if(diags >= options.boardSize) {
          
          for(var n = options.boardSize; n >= 0; n--) {
            $('#board .row-' + n + '.col-' + n).addClass('winning-move');
          }
          return true;
        }
      }

    }

    return false;
   // console.log(cols, rows);

  } // End determineWinner()


  function buildBoard () {

    var board = ['<table id="board-table"><tbody>'];

    for(var i = 0; i < options.boardSize; i++) {

      board.push('<tr class="board-row row-' + i + '">');
      for(var n = 0; n < options.boardSize; n++) board.push('<td class="board-col row-' + i + ' col-' + n + '"></td>');
      board.push("</tr>");

    } // End for loop

    board.push("</tbody></table>");
    $("#game-page #board").html(board.join(''));

  } // End buildBoard()

} // End ticTockToe Object Function
