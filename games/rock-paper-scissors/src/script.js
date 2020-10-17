var gameModule = (function () {

    $(function() {

        // General variables
        var playerChoice,
            computerChoice,
            winner,
            round = 1,
            playerScore = 0,
            computerScore = 0,
            bestOf,
            overallResultClass,
            overallResultText,
            character,
            choices = ['rock', 'paper', "scissors"];

        // Text Variables
        var playerWinsText = "You win the round!",
            computerWinsText = "Computer wins the round!",
            tieText = "It's a Tie!",
            overallPlayerWinText = "<h2>Well Done!</h2> <p>You won against the computer.</p>",
            overallComputerWinText = "<h2>You Lose...</h2> <p>The computer has defeated you</p>",
            overallTieText = "<h2>It's a draw!</h2> <p>Good effort.</p>";

        // Set Characters
        function setCharacter(div, className) {
            character = $(div).data('character');
            $(className).addClass(character);
        }

        function nextScreen(div) {
            div.parents('.starter-screen').hide().next().addClass('animate-in');
        }

        // Decides on whether the computer is playing rock, paper or scissors
        function computerDecision() {

            var randomChoice = Math.floor(Math.random() * choices.length);
            return choices[randomChoice];

        }

        // Plays the game
        function playGame(playerChoice) {

            computerChoice = computerDecision();
            round++;

            // Set Choices
            $('.player-choice-icon').attr('class', 'player-choice-icon ' + playerChoice);
            $('.computer-choice-icon').attr('class', 'computer-choice-icon ' + computerChoice);

            winner = decideWinner(playerChoice, computerChoice);

            // Set the values on the screen
            setValues(playerChoice, computerChoice, winner);

        }

        // Sets all the values on the board
        function setValues(playerChoice, computerChoice, winnerText) {

            $('.player-choice').text(playerChoice); // If the player has chosen rock, paper or scissors
            $('.computer-choice').text(computerChoice); // If the computer has chosen rock, paper or scissors
            $('.winner').text(winnerText); // Who won the round

            // If the game has been reset set the score immediately
            if(round !== 1) {

                // Set the values once the animation has finished
                setTimeout(function(){
                    setScore();
                }, 4000);

            } else {

                // Set the values immediately
                setScore();
                $('.round').text(round);

            }

        }

        // Set the scores
        function setScore() {

            $('.player-score').text(playerScore); // The running score for the player
            $('.computer-score').text(computerScore); // The running score for the computer

        }

        // Decide who wins based on the player & computer choice
        function decideWinner(playerChoice, computerChoice) {

            var resultClass;

            // Who wins, What text is shown & What class is applied to the result screen
            if (playerChoice === computerChoice) {

                // If there is a tie
                winner = tieText;
                resultClass = "tie";

            } else if (playerChoice === "rock") {

                // If the player chooses "Rock"
                switch (computerChoice) {
                    case "scissors":
                        winner = playerWinsText;
                        playerScore++;
                        resultClass = "win";
                    break;
                    case "paper":
                        winner = computerWinsText;
                        computerScore++;
                        resultClass = "lose";
                    break;
                }

            }  else if (playerChoice === "paper") {

                // If the player chooses "Paper"
                switch (computerChoice) {
                    case "rock":
                        winner = playerWinsText;
                        playerScore++;
                        resultClass = "win";
                    break;
                    case "scissors":
                        winner = computerWinsText;
                        computerScore++;
                        resultClass = "lose";
                    break;

                }

            } else {

                // If the player chooses "Scissors"
                switch (computerChoice) {
                    case "rock":
                        winner = computerWinsText;
                        computerScore++;
                        resultClass = "lose";
                    break;
                    case "paper":
                        winner = playerWinsText;
                        playerScore++;
                        resultClass = "win";
                    break;
                }

            }

            // Set the class of the result screen
            $('.result').attr('class', 'result ' + resultClass);

            return winner;

        }

        // Set all variables to their base values
        function resetGame () {

            playerChoice = "";
            computerChoice = "";
            winner = "";
            round = 1;
            playerScore = 0;
            computerScore = 0;

            setValues();

            $('body').removeClass('end-game weapon-chosen');
            $('.play-again').show();

        }

        // Decide on who is the winner of the whole game
        function overallWinner() {

            if (playerScore > computerScore) {

                // Player wins
                overallResultText = overallPlayerWinText;
                overallResultClass = "win";

            } else if (playerScore < computerScore) {

                // Computer wins
                overallResultText = overallComputerWinText;
                overallResultClass = "lose";

            } else {

                // Tie
                overallResultText = overallTieText;
                overallResultClass = "tie";

            }

            $('.end-result').html(overallResultText);
            $('.end-screen').attr('class', 'end-screen ' + overallResultClass);

        }

        // Show the end screen and final result
        function endGame() {

            $('body').addClass('end-game');
            $('.play-again').hide();

            overallWinner();

        }

        // Set the total number of rounds
        function setBestOf(selectedRounds) {
          
            var endScreenRounds;

            bestOf = selectedRounds.data('rounds');
            $('.best-of').text(bestOf);

            // Set the active class on the number of rounds on the end screen
            endScreenRounds = ".rounds-" + bestOf;
            $(endScreenRounds).addClass('active').siblings().removeClass('active');

        }

        // Start
        $('.start').on('click', function(e) {

            e.preventDefault();
            nextScreen($(this));

        });

        // Set what character is chosen and start the game
        $('.choose-rounds li').on('click', function(e) {

            e.preventDefault();
            setBestOf($(this));
            nextScreen($(this));

        });

        // Set what character is chosen and start the game
        $('.choose-character li').on('click', function(e) {

            e.preventDefault();
            setCharacter($(this), '.player-character');
            nextScreen($(this));

        });

        // Set what character is chosen and start the game
        $('.choose-rival li').on('click', function(e) {

            e.preventDefault();
            setCharacter($(this), '.computer-character');
            $('body').addClass('game-started');

        });

        // Play the game
        $('.weapon li').on('click', function(e) {

            e.preventDefault();
            playerChoice = $(this).data('weapon');

            $('body').addClass('weapon-chosen');

            playGame(playerChoice);

            if (round > bestOf) {

                endGame();

            }

        });

        // Play the next round
        $('.play-again').on('click', function(e) {

            e.preventDefault();
            $('body').removeClass('weapon-chosen');
            $('.round').text(round); // How many rounds there have been

        });

        // Reset the game from the beginning
        $('.reset').on('click', function(e) {

            e.preventDefault();
            resetGame();

        });

        // Reset the game from the beginning
        $('.rounds-end-screen li').on('click', function(e) {

            e.preventDefault();
            setBestOf($(this));

        });

    });

}());
