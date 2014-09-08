(function ($) {

  $(function () {

    $("#tic-toc-toe").append('<div id="header"></div><div id="push-messages"><div id="message"></div><div id="move-timer">3<br />Seconds Left Until Random Choice!</div><div id="times-won"></div></div><div id="playable"><div id="board"></div></div>');

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

    fadeDuration: 1000, // 1.0 Sec
    pushDuration: 5000, // 5.0 Sec

    nextGameTimeout: 5, // In seconds, 5.0 Sec
    nextMoveTimeout: 3  // 3.0 Sec

  } // End options Object

  var pushTimeout;
  var message = {

    push: function (msg, strClasses, sticky) {

      $("#tic-toc-toe #push-messages #message").stop().fadeOut(options.fadeDuration, function (e) {
        $(this).html(msg).removeClass().addClass('push-' + (strClasses || 'notice')).fadeIn(options.fadeDuration);
      });

      if(!sticky) {
        pushTimeout = setTimeout(function () {
          $("#tic-toc-toe #push-messages #message").fadeOut(options.fadeDuration);
          clearTimeout(pushTimeout);
        }, options.pushDuration);
      }

    }, // End push()

    append: function (msg, strClasses, sticky) {

      $("#tic-toc-toe #push-messages #message").hide(function (e) {
        $(this).html($(this).html() + '<br />' + msg).removeClass().addClass('push-' + (strClasses || 'notice')).fadeIn(options.fadeDuration);
      });

      clearTimeout(pushTimeout);
      if(!sticky) {
        pushTimeout = setTimeout(function () {
          $("#tic-toc-toe #push-messages #message").fadeOut(options.fadeDuration);
          clearTimeout(pushTimeout);
        }, options.pushDuration);
      }

    }, // End append()

    clear: function () {
      $("#tic-toc-toe #push-messages #message").html("");
    } // End clear()

  } // End message Object



  // <----------------------- PRIVATE PROPERTIES -----------------------> //

  var moves     = { 1: [], 2: [] };
  var movesRaw  = [];
  var moveCount = 0;
  var turn      = undefined;
  var gameOver  = false;
  var lastMove  = [];
  var timesWon  = [0, 0, 0];


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

  self.stop = function () {
    clearInterval(nextGameTimeout);
  }


  // <------------------------- PRIVATE METHODS ------------------------> //

  function setMoveTimer() {
    var moveTimer = options.nextMoveTimeout;
    moveInterval = setInterval(function () {
      $("#tic-toc-toe #move-timer").html(moveTimer + "<br />Seconds Left Until Random Choice!");
      
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

    while((movesRaw.indexOf('r:' + row + 'c:' + col + 'p:' + 1) > -1) || (movesRaw.indexOf('r:' + row + 'c:' + col + 'p:' + 2) > -1)) {
      row = Math.floor(Math.random() * (options.boardSize));
      col = Math.floor(Math.random() * (options.boardSize));
    }
    $('#tic-toc-toe #board #board-table div.block.row-' + row + '.col-' + col).html('<div class="player-' + turn + '-mark">' + ((turn == 1) ? options.player1Mark : options.player2Mark + "</div>"));

    moves[turn].push({ row: row, col: col });
    movesRaw.push('r:' + row + 'c:' + col + 'p:' + turn);
    lastMove = [row, col];
    moveCount++;
    gameOver = winner();
    if(!gameOver) {
      nextTurn(true);
      setMoveTimer();
    }
  }

  function reset() {

    moves     = { 1: [], 2: [] };
    movesRaw  = [];
    moveCount = 0;
    turn      = undefined;
    gameOver  = false;

    $('#tic-toc-toe #times-won *').remove();

    $('#tic-toc-toe #times-won').append('<div>' + options.player1Name + ': <span id="wp-' + 1 + '">' + timesWon[1] + '</span></div>');
    $('#tic-toc-toe #times-won').append('<div>' + options.player2Name + ': <span id="wp-' + 2 + '">' + timesWon[2] + '</span></div>');
    $('#tic-toc-toe #times-won').append('<div>' + 'Stale Mate: ' + '<span id="wp-0">' + timesWon[0] + '</span></div>');


    $('.board-col').html("").removeClass("winning-move");
    $('#tic-toc-toe #move-timer').show();

    // Determine if Player 1 || 2 goes first:
    turn = Math.floor(Math.random() * (3 - 1)) + 1;
    message.push(game.currentPlayer + " has been randomly choosen to go first!", "notice");

    setMoveTimer();

    $('#tic-toc-toe #board #board-table div.block').click(function () {
      clearInterval(moveInterval);
      if($(this).html() == '') {
        $(this).html('<div class="player-' + turn + '-mark">' + ((turn == 1) ? options.player1Mark : options.player2Mark + "</div>"));
        
        var row = $(this).attr('class').match(/row-(\d+)/)[1];
        var col = $(this).attr('class').match(/col-(\d+)/)[1];

        moves[turn].push({ row: row, col: col });
        movesRaw.push('r:' + row + 'c:' + col + 'p:' + turn);
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


  function nextTurn (compMove) {
    turn = (turn == 1) ? 2 : 1;
    message.push(((compMove) ? "<strong>The Computer</strong>" : "You") + " made your mark in row " + (parseInt(lastMove[0]) + 1) + ", column " + (parseInt(lastMove[1]) + 1) + ". Now, it's " + ((turn == 1) ? options.player1Name : options.player2Name) + "'s turn.", "notice", true);
  }


  function winner () {

    var winningPlayer = undefined;
    var loosingPlayer = undefined;

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
        message.push(winningPlayer + " has defeated Player " + loosingPlayer + "!", 'notice', true);
      }

    }

    if(gameOver) {
      $('#tic-toc-toe #move-timer').fadeOut(options.fadeDuration);
      timesWon[wp] = parseInt($('#tic-toc-toe #times-won #wp-' + wp).html());
      $('#tic-toc-toe #times-won #wp-' + wp).html(++timesWon[wp]);
      message.append('<span id="play-again">Next game in <span id="timer">' + options.nextGameTimeout + '</span><span id="quit">Tired of playing? Quit.</span></span>', 'notice', true);
      var timeToNextGame = options.nextGameTimeout;
      var nextGameTimeout = setInterval(function () {

        $("#tic-toc-toe #timer").html(timeToNextGame);

        $('#tic-toc-toe #quit').click(function () {
          $("#tic-toc-toe #move-timer").hide();
          $("#tic-toc-toe #push-messages *").toggle(1000, function () {
            $(this).remove();
          });
          $("#tic-toc-toe #times-won *").toggle(1000, function () {
            $(this).remove();
          });

          clearInterval(nextGameTimeout);
        });

        timeToNextGame--;
        if(timeToNextGame <= -1) {
          clearInterval(nextGameTimeout);
          reset();
          message.clear();
        }
      }, 1000);
      $('#tic-toc-toe #board #board-table div.block').unbind('click');
      
    }

    return gameOver;

  } // End winner()


  function determineWinner (player) {

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
      if((cols[i] && cols[i] >= options.boardSize)) {
        $('#tic-toc-toe #board .col-' + i).addClass('winning-move');
        return true;
      }
      if(rows[i] && rows[i] >= options.boardSize) {
        $('#tic-toc-toe #board .row-' + i).addClass('winning-move');
        return true;
      }

      
      for(var k in movesRaw) {
        if(movesRaw[k] == 'r:' + i + 'c:' + i + 'p:' + turn) {
          diagDown++;
          diagDownWinners.push([i, i]);
        }
        console.log('r:' + i + 'c:' + l + 'p:' + turn);
        if(movesRaw[k] == 'r:' + i + 'c:' + l + 'p:' + turn) {
          diagUp++;
          diagUpWinners.push([i, l]);
        }
      }
      l--;
    }

    if(diagDown >= options.boardSize) {
      for(var i in diagDownWinners) {
        console.log(diagDownWinners);
        $('#tic-toc-toe #board .row-' + diagDownWinners[i][0] + '.col-' + diagDownWinners[i][1]).addClass('winning-move');
      }
      return true;
    }
    else if(diagUp >= options.boardSize) {
      for(var i in diagUpWinners) {
        console.log(diagUpWinners);
        $('#tic-toc-toe #board .row-' + diagUpWinners[i][0] + '.col-' + diagUpWinners[i][1]).addClass('winning-move');
      }
      return true;
    }

    return false;

  } // End determineWinner()


  function buildBoard () {

    var board = ['<div id="board-table">'];

    for(var i = 0; i < options.boardSize; i++) {

      board.push('<tr class="board-row row-' + i + '">');
      for(var n = 0; n < options.boardSize; n++) board.push('<div class="block board-col row-' + i + ' col-' + n + '"></div>');
      board.push("</tr>");

    } // End for loop
    board.push("</div>");

    $("#tic-toc-toe #board").html(board.join(''));
    $("#tic-toc-toe #board #board-table div.block").attr('style', 'width:' + 90/options.boardSize + '%;' + 'height:' + 90/options.boardSize + '%;' + 'min-width:' + 90/options.boardSize + '%;');


  } // End buildBoard()

} // End ticTockToe Object Function
