(function ($) {

  $(function () {

    $("#tic-tac-toe").append('<div id="header"></div><div id="times-won"></div><div id="push-messages"><div id="message"></div></div><div id="playable"><div id="board"></div></div>');
    $("#play").click(function () {

      var p1 = $("#player1-name").val();
      p1 = p1.charAt(0).toUpperCase() + p1.slice(1);

      var p2 = $("#player2-name").val();
      p2 = p2.charAt(0).toUpperCase() + p2.slice(1);

      new ticTacToe().new({
        player1Name: p1,
        player2Name: p2,
        boardSize: $("#board-size").val()
      });

      $("#tic-tac-toe").show();
      $("#title-page").animate({ left: "-100%" }, { duration: 1000, easing: 'easeInOutExpo' });
    })

  }); // End document.ready()

})(jQuery);


// <------------------------------------ ticTacToe CLASS ------------------------------------> //

var ticTacToe = function () {

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

    fadeDuration: 0800, // 0.8 Sec
    pushDuration: 8000, // 5.0 Sec

    nextGameTimeout: 5, // In seconds, 5.0 Sec

  } // End options Object

  var pushTimeout;
  var message = {

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

    clear: function () {
      $("#tic-tac-toe #push-messages #message").html("");
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

  function gameplay() {

    $('#tic-tac-toe #quit, #quit-2').click(function () {
      $("#title-page").animate({ left: 0 }, { duration: 1000, easing: 'easeInOutExpo' });
      $("#push-messages #message").html("");
    });

    moves     = { 1: [], 2: [] };
    movesRaw  = [];
    moveCount = 0;
    turn      = undefined;
    gameOver  = false;

    $('#tic-tac-toe #times-won *').remove();

    $('#tic-tac-toe #times-won').append('<strong>Winning Stats:</strong><hr><div>' + options.player1Name + ': <span id="wp-' + 1 + '">' + timesWon[1] + '</span></div>');
    $('#tic-tac-toe #times-won').append('<div>' + options.player2Name + ': <span id="wp-' + 2 + '">' + timesWon[2] + '</span></div>');
    $('#tic-tac-toe #times-won').append('<div>' + 'Stale Mate: ' + '<span id="wp-0">' + timesWon[0] + '</span></div><hr>');


    $('.board-col').html("").removeClass("winning-move");

    // Determine if Player 1 || 2 goes first:
    turn = Math.floor(Math.random() * (3 - 1)) + 1;
    message.push(game.currentPlayer + " has been randomly choosen to go first!", "notice", true);


    $('#tic-tac-toe #board #board-table div.block').click(function () {

      if($(this).html() == '') {
        $(this).html('<div class="player-' + turn + '-mark player-mark" style="line-height: ' + $(this).height() + 'px; ">' + ((turn == 1) ? options.player1Mark : options.player2Mark + "</div>"));
        
        var row = $(this).attr('class').match(/row-(\d+)/)[1];
        var col = $(this).attr('class').match(/col-(\d+)/)[1];

        moves[turn].push({ row: row, col: col });
        movesRaw.push('r:' + row + 'c:' + col + 'p:' + turn);
        lastMove = [row, col];
        moveCount++;
        gameOver = winner();
        if(!gameOver) {
          nextTurn();
        }
      }
      else {
        message.push("That spot's taken!", 'notice');
      }

    }) // End click handler

  } // End gameplay()


  function setOptions (userOpts) {
    if(userOpts) for(var i in options) if(options.hasOwnProperty(i) && userOpts[i]) options[i] = userOpts[i];

  } // End setOptions()


  function nextTurn () {
    var lastPlayer = game.currentPlayer;
    turn = (turn == 1) ? 2 : 1;
    message.push(lastPlayer + " has made their mark in row " + (parseInt(lastMove[0]) + 1) + ", column " + (parseInt(lastMove[1]) + 1) + ". <span class=\"emphasis\">Now, it's " + ((turn == 1) ? options.player1Name : options.player2Name) + "'s turn.</span>", "notice", true);
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
        message.push(winningPlayer + " has defeated " + loosingPlayer + "!", 'notice', true);
      }

    }

    if(gameOver) {
      $('#tic-tac-toe #move-timer').fadeOut(options.fadeDuration);
      timesWon[wp] = parseInt($('#tic-tac-toe #times-won #wp-' + wp).html());
      $('#tic-tac-toe #times-won #wp-' + wp).html(++timesWon[wp]);
      message.append('<span id="play-again">Next game in <span id="timer">' + options.nextGameTimeout + '</span>.<span id="quit"> Tired of playing? Quit.</span></span>', 'notice', true);
      var timeToNextGame = options.nextGameTimeout;
      var nextGameTimeout = setInterval(function () {

        $("#tic-tac-toe #timer").html(timeToNextGame);

        $('#tic-tac-toe #quit, #quit-2').click(function () {
          $("#title-page").animate({ left: 0 }, { duration: 1000, easing: 'easeInOutExpo' });
          clearInterval(nextGameTimeout);
          $("#push-messages #message").html("");
        });

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
        $('#tic-tac-toe #board .col-' + i).addClass('winning-move');
        return true;
      }
      if(rows[i] && rows[i] >= options.boardSize) {
        $('#tic-tac-toe #board .row-' + i).addClass('winning-move');
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
        $('#tic-tac-toe #board .row-' + diagDownWinners[i][0] + '.col-' + diagDownWinners[i][1]).addClass('winning-move');
      }
      return true;
    }
    else if(diagUp >= options.boardSize) {
      for(var i in diagUpWinners) {
        console.log(diagUpWinners);
        $('#tic-tac-toe #board .row-' + diagUpWinners[i][0] + '.col-' + diagUpWinners[i][1]).addClass('winning-move');
      }
      return true;
    }

    return false;

  } // End determineWinner()


  function buildBoard () {

    var board = ['<div id="board-table">'];

    for(var i = 0; i < options.boardSize; i++) {

      board.push('<tr class="board-row row-' + i + '">');
      
      for(var n = 0; n < options.boardSize; n++) {

        var classes = ['block', 'board-col'];

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
