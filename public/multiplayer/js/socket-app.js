///////////////////////////////////////////////////////////
// SOCKET CUSTOM
////////////////////////////////////////////////////////////
function startSocketGame(){
	postSocketUpdate('init');
}

function updateSocketGame(status, data, time){
	if(multiplayerSettings.game == 'guessthesketch'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
	
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
			}

			gameData.totalplayers = data.length;
			if(socketData.host){
				if(gameSettings.randomAnswer){
					shuffle(gameData.seq);
				}
				postSocketUpdate('prepare', gameData.seq, true);
				postSocketUpdate('start');
			}
		}else if(status == 'prepare'){
			gameData.seq = data;
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			
			socketData.turn = false;
			if(socketData.gameIndex == 0){
				socketData.turn = true;
			}

			gameData.player = 0;
			displayPlayerTurn();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateTimer();
		}else if(status == 'startdrawingline'){
			startDrawingLine(data.x, data.y);
		}else if(status == 'updatedrawingline'){
			updateDrawingLine(data.x, data.y);
		}else if(status == 'updateplayeranswer'){
			if(socketData.gameIndex != data.index){
				fillPlayerAnswer(data.index, data.answers, false);
			}

			if(socketData.turn){
				if(data.answers == gameData.sketchAnswer && !gameData.complete){
					endRound();
					postSocketUpdate('updatecomplete', {index:data.index, turnIndex:socketData.gameIndex, answers:gameData.sketchAnswer, complete:true});
				}
			}
		}else if(status == 'updatecomplete'){
			gameData.complete = true;
			if(data.complete){
				if(socketData.gameIndex == data.index){
					showGameStatus('correct');
					for(var n=0; n<gameData.blanks.length; n++){
						gameData.blanks[n].oriY = gameData.blanks[n].y;
						gameData.blanks[n].bgH.visible = true;
						gameData.blanks[n].text.color = gameSettings.correctColor;
						animateBounce(gameData.blanks[n], n*.2);
					}
				}else{
					fillPlayerAnswer(data.index, data.answers, true);
					showGameStatus('playerCorrect', data.index);
				}
				roundComplete(data.index, data.turnIndex);
			}

			var nextDraw = false;
			gameData.player++;
			if(gameData.player >= gameData.totalplayers){
				gameData.round++;
				gameData.player = 0;
				if(gameData.round < gameSettings.totalRound){
					nextDraw = true;
				}
			}else{
				nextDraw = true;
			}

			if(nextDraw){
				socketData.turn = false;
				gameData.seqNum++;
				if(gameData.seqNum > gameData.seq.length){
					gameData.seqNum = 0;
					if(gameSettings.randomAnswer){
						shuffle(gameData.seq);
					}
				}

				if(gameData.player == socketData.gameIndex){
					socketData.turn = true;
				}

				TweenMax.to(gameData, 3, {overwrite:true, onComplete:function(){
					loadSketchAnswer();
					displayPlayerTurn();
				}});
			}else{
				endGame();
			}
		}
	}
	
	if(multiplayerSettings.game == 'bingobash'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			socketData.players = [];
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				socketData.players.push({index:data[n].index, data:[], username:data[n].username});
			}
			
			gameData.totalplayers = data.length;
			if(socketData.host){
				postSocketUpdate('start');
			}
		}else if(status == 'start'){
			socketData.loaded = [];
			createPlayerCard();
			goPage('game');
		}else if(status == 'playercards'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
				socketData.players[data.index].data = data.numbers;
			}

			if(socketData.loaded.length == gameData.totalplayers && socketData.host){
				startGame();
			}
		}else if(status == 'revealnumbers'){
			gameData.numbers_arr = data;
			startGame();
		}else if(status == 'dropballs'){
			dropBalls();
		}else if(status == 'revealballs'){
			revealBall();
		}else if(status == 'updateusernumbers'){
			socketData.players[data.index].data = data.numbers;
			checkOtherPlayersNumber();
		}else if(status == 'bingo'){
			socketData.winners = data;
			checkOtherPlayersBingo();
		}else if(status == 'nowinner'){
			endGame();
		}
	}

	if(multiplayerSettings.game == 'spotthedifferences'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
			}

			gameData.totalplayers = data.length;
			postSocketUpdate('type');
		}else if(status == 'type'){
			if(socketData.host){
				if(gameMode.status){
					toggleMainButton("select");
				}else{
					if(gameMode.mode){
						gameData.mode = "quick";
						shufflePuzzle();
						postSocketUpdate('start', {mode:gameData.mode, seq:gameData.seq});
					}else{
						gameData.mode = "select";
						postSocketUpdate('level', gameData.mode);
					}
				}
			}else{
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'level'){
			goPage("level");
			selectPage(1);
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatelevel'){
			selectPage(data);
		}else if(status == 'updatethumb'){
			selectBoardThumbs(data);
			playSound('soundSelect');
		}else if(status == 'start'){
			toggleSocketLoader(false);
			gameData.mode = data.mode;
			gameData.seq = data.seq;
			goPage('game');
			
			$.players['gamePlayer'+ socketData.gameIndex].text = textMultiplayerDisplay.playerIndicator;
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateStats();
		}else if(status == 'wrong'){
			playerData.wrong = data.wrong;
			playerData.opponentWrong = data.opponentWrong;
			updateStats();
		}else if(status == 'timerup'){
			displayGameStatus('timer');
		}else if(status == 'spot'){
			updateHiddenSpot(data.spot, data.index);
			if(data.index == 0){
				playerData.found++;
			}else{
				playerData.opponentFound++;
			}
			updateStats();
		}
	}

	if(multiplayerSettings.game == 'snakesandladders'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
	
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalplayers = data.length;
			if(socketData.host){
				postSocketUpdate('level');
			}
		}else if(status == 'level'){
			goPage('level');
			selectBoardThumbs(0);
			selectPage(1);
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatelevel'){
			selectPage(data);
		}else if(status == 'updatethumb'){
			selectBoardThumbs(data);
		}else if(status == 'start'){
			toggleSocketLoader(false);
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.youStart);
				playerTurnTxt.text = textMultiplayerDisplay.youStart;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerStart.replace('[USER]',data.username));
				playerTurnTxt.text = textMultiplayerDisplay.playerStart.replace('[USER]',data.username);
			}
			goPage('game');
			gameData.player = data.turn;
			prepareArrow();
		}else if(status == 'dice'){
			gameData.diceNum = data;
			diceAnimate.gotoAndStop(gameData.diceNum);
		}else if(status == 'roll'){
			animateDice(data);
		}else if(status == 'rollcomplete'){
			socketData.loaded = [];
			updateAnimateDiceComplete();
		}else if(status == 'extraturn'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers && socketData.host){
				if(socketData.turn){
					animateDice();
				}
			}
		}else if(status == 'movecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers && socketData.host){
				postSocketUpdate('nextplayer');
			}
		}else if(status == 'nextplayer'){
			socketData.turn = false;
			socketData.winner = data.username;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				playerTurnTxt.text = textMultiplayerDisplay.yourTurn;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				playerTurnTxt.text = textMultiplayerDisplay.playerTurn.replace('[USER]',data.username);
			}
			gameData.player = data.turn;
			prepareArrow();
		}
	}

	if(multiplayerSettings.game == 'quizgamevs'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$('#player'+(n+1)).val(data[n].username);
			}
			totalPlayerData.total = data.length;
			buildGamePlayers();
			postSocketUpdate('mode');
		}else if(status == 'mode'){
			goPage('mode');
			$('.fontLogText').html('');
			if(!socketData.host){
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'grid'){
			toggleSocketLoader(false);
			gameData.type = 'grid';
			goPage('game');
		}else if(status == 'buildGridStyle'){
			playerData.gridCategory_arr = data.category;
			playerData.gridPoints_arr = data.points;
			buildGridStyle();
			toggleGridStyle(true);
		}else if(status == 'focusGridStyle'){
			focusGridStyle($('#'+data));
		}else if(status == 'updateCounter'){
			playerData.chance = data.chance;
			playerData.updateChance = data.updateChance;
			playerData.index = data.index;
			updateCounter();
		}else if(status == 'selectrandomplayer'){
			socketData.loaded = [];
			playerData.index = data.index;
			selectRandomGamePlayer();
		}else if(status == 'updateCounterReady'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}
			if(socketData.loaded.length == totalPlayerData.total && socketData.host){
				postSocketUpdate('updateCounterComplete');
			}
		}else if(status == 'updateCounterComplete'){
			$('#gridStyleHolder .fontGridStatus').html(gameTextDisplay.selectCategory);
			highlightPlayer();
		}else if(status == 'category'){
			toggleSocketLoader(false);
			gameData.type = data.type;
			categoryData.page = 1;
			goPage('category');

			$('.fontLogText').html('');
			if(!socketData.host){
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecategorylevel'){
			categoryData.page = data.page;
			categoryData.level = data.level;
			categoryData.breadcrumb = data.breadcrumb;

			buildCategory();
			resizeGameDetail();
		}else if(status == 'updatecategory'){
			categoryData.page = data.page;
			categoryData.level = data.level;
			categoryData.breadcrumb = data.breadcrumb;

			displayCategory();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
		}else if(status == 'sequence'){
			gameData.sequence_arr = data;
		}else if(status == 'loadquestion'){
			socketData.loaded = [];
			loadQuestion();
		}else if(status == 'loadQuestionReady'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == totalPlayerData.total && socketData.host){
				if(fileFest.length > 0){
					socketData.loaded = [];
					postSocketUpdate('loadQuestionAssets', {quesLandscapeSequence_arr:quesLandscapeSequence_arr, audioLandscape_arr:audioLandscape_arr});
				}else{
					postSocketUpdate('buildQuestion', {quesLandscapeSequence_arr:quesLandscapeSequence_arr, audioLandscape_arr:audioLandscape_arr});
				}
			}
		}else if(status == 'loadQuestionAssets'){
			quesLandscapeSequence_arr = data.quesLandscapeSequence_arr;
			quesPortraitSequence_arr = data.quesLandscapeSequence_arr;
			audioLandscape_arr = data.audioLandscape_arr;
			audioPortrait_arr = data.audioLandscape_arr;
			loadQuestionAssets();
		}else if(status == 'loadQuestionAssetsComplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == totalPlayerData.total && socketData.host){
				postSocketUpdate('buildQuestion', {quesLandscapeSequence_arr:quesLandscapeSequence_arr, audioLandscape_arr:audioLandscape_arr});
			}
		}else if(status == 'buildQuestion'){
			quesLandscapeSequence_arr = data.quesLandscapeSequence_arr;
			quesPortraitSequence_arr = data.quesLandscapeSequence_arr;
			audioLandscape_arr = data.audioLandscape_arr;
			audioPortrait_arr = data.audioLandscape_arr;
			buildQuestion();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			$('.gameTimer').show();
			updateTimerDisplay();
		}else if(status == 'actionGamePlayer'){
			actionGamePlayer(data);
		}else if(status == 'focusTapAnswer'){
			focusTapAnswer(data.id, data.type, data.submit, data.hide);
		}else if(status == 'updateGroupID'){
			updateGroupID($('#'+data.groupDrop), $('#'+data.groupDrag), data.con);
			setGroupPosition();
		}else if(status == 'groupDragStop'){
			setGroupPosition();
			revertPosition($('#'+data));
		}else if(status == 'groupDragDrop'){
			updateGroupID($(data.groupDrop), $('#'+data.groupDrag), data.con);
			revertPosition($('#'+data.groupDrag));
		}else if(status == 'dragStart'){
			if($('#'+data.drag).hasClass('occupied')){
				if(dragDropSettings.droppedAnswerAgain){
					$('#'+data.drag).removeClass('occupied');
					playerData.correctAnswer.splice(1,0);
					
					var currentID = $('#'+data.drag).attr('id');
					$('.drop').each(function(index, element) {
						if($('#'+data.drag).attr('data-drag-id') == currentID){
							$('#'+data.drag).attr('data-drag-id', '');	
						}
					});
				}else{
					return false;
				}
			}else{
				setDragIndex($('#'+data.drag));	
			}
			setDragIndex($('#'+data.drag));
		}else if(status == 'dragStop'){
			revertPosition($('#'+data.drag));
		}else if(status == 'dropDrop'){
			if($('#'+data.drop).hasClass('occupied')){
				if($('#'+data.drop).attr('data-drag-id') != ''){
					var lastDrag = $('#'+$('#'+data.drop).attr('data-drag-id'));
					lastDrag.removeClass('occupied');
					revertPosition(lastDrag);
				}
			}else{
				playerData.correctAnswer.push(0);
			}
			
			$('#'+data.drag).addClass('occupied');
			$('#'+data.drag).attr('data-top-drop', $('#'+data.drop).attr('data-top'));
			$('#'+data.drag).attr('data-left-drop', $('#'+data.drop).attr('data-left'));
			
			$('#'+data.drop).attr('data-drag-id', data.drag);
			$('#'+data.drop).addClass('occupied');
		}else if(status == 'checkInputAnswer'){
			$('#inputHolder input').each(function(index, element) {
				$(this).val(data[index]);
			});
			checkInputAnswer();
		}else if(status == 'prepareNextQuestion'){
			TweenMax.killAll();
			stopVideoPlayer(true);
			$('#questionHolder').hide();
			$('#questionResultHolder').show();
			$('#questionResultHolder').css('opacity',0);
			
			prepareNextQuestion();
		}
	}

	if(multiplayerSettings.game == 'tictactoe'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
	
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('custom');
		}else if(status == 'custom'){
			gameData.custom.size = customSettings.sizeMin;
			gameData.custom.win = customSettings.winMin;
			goPage('custom');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecustom'){
			gameData.custom.size = data.size;
			gameData.custom.win = data.win;
			checkCustomSettings();
		}else if(status == 'players'){
			goPage('players');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateplayers'){
			gameData.icon = data.icon;
			gameData.switch = data.switch;
			gameData.icons = data.icons;
			displayPlayerIcon();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.youStart);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerStart.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			
			displayPlayerTurn();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateTimer();
		}else if(status == 'updateicon'){
			placeIcon(data.row, data.column, data.player);
		}else if(status == 'updatemovecomplete'){
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			gameData.moving = false;
			displayPlayerTurn();
		}else if(status == 'updateroundcomplete'){
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			gameData.moving = false;
			displayPlayerTurn();
		}
	}

	if(multiplayerSettings.game == 'connectfour'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('custom');
		}else if(status == 'custom'){
			gameData.custom.column = customSettings.columnMin;
			gameData.custom.row = customSettings.rowMin;
			gameData.custom.connect = customSettings.connectMin;
			checkCustomSettings();
			goPage('custom');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecustom'){
			gameData.custom.row = data.row;
			gameData.custom.column = data.column;
			gameData.custom.connect = data.connect;
			checkCustomSettings();
		}else if(status == 'players'){
			goPage('players');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateplayers'){
			gameData.icon = data.icon;
			gameData.switch = data.switch;
			gameData.icons = data.icons;
			displayPlayerIcon();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.youStart);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerStart.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			
			displayPlayerTurn();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateTimer();
		}else if(status == 'updatemove'){
			placeMove(data.column);
		}else if(status == 'updatemovecomplete'){
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}

			gameData.moving = false;
			displayPlayerTurn();
		}else if(status == 'updateroundcomplete'){
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}

			gameData.moving = false;
			displayPlayerTurn();
		}
	}

	if(multiplayerSettings.game == 'wordsearch'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
		
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('category');
		}else if(status == 'category'){
			categoryData.page = 1;
			goPage('category');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecategory'){
			selectCategoryPage(data);
		}else if(status == 'custom'){
			gameData.custom.column = customSettings.columnMin;
			gameData.custom.row = customSettings.rowMin;
			gameData.custom.words = customSettings.wordsMin;
			checkCustomSettings();
			goPage('custom');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecustom'){
			gameData.custom.row = data.row;
			gameData.custom.column = data.column;
			gameData.custom.words = data.words;
			checkCustomSettings();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.youStart);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerStart.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			
			checkPlayerTurn();
		}else if(status == 'updatetimer'){
			timeData.timer = data.timer;
			timeData.playerTimer = data.playerTimer;
			updateTimer();
		}else if(status == 'updatepuzzle'){
			gameData.puzzle = data.puzzle;
			gameData.solve = data.solve;
			gameData.words = data.words;
			drawPuzzle();
			drawPuzzleWords();
		}else if(status == 'updatemovecomplete'){
			togglePlayer();
			stopStroke();
		
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
		
			checkPlayerTurn();
		}else if(status == 'startstroke'){
			gameData.strokeObj = $.puzzle[data.row+'_'+data.column];
			gameData.strokeColor = data.strokeColor;
			gameData.strokeDrawing = true;
			gameData.strokeStart = $.puzzle[data.row+'_'+data.column].pos;

			if(puzzleSettings.multiplayerStrokeColor){
				gameData.strokeColor = puzzleSettings.multiplayerStrokeColors[gameData.player];
			}
			createNewStroke();
			playSound('soundHover');
		}else if(status == 'updatestroke'){
			drawStroke(data.strokeIndex, data.strokeColor, data.sx, data.sy, data.ex, data.ey);
			loopStrokeLetter(data.ex, data.ey);
		}else if(status == 'removestroke'){
			playSound('soundError');
			stopStroke();
		}else if(status == 'completestroke'){
			completeStroke(data.wordIndex, data.row, data.column);
			updateCurWord('');
		}else if(status == 'updateroundcomplete'){
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			checkPlayerTurn();
		}
	}

	if(multiplayerSettings.game == 'feedmonster'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			socketData.players = [];
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					gameData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}

				socketData.players.push({index:data[n].index, username:data[n].username, gameIndex:n, score:0, lives:mapSettings.lives, nextStage:false});
			}
			gameData.totalplayers = data.length;
			gameData.mapLoopSide = randomBoolean();
			postSocketUpdate('select', gameData.mapLoopSide);
		}else if(status == 'select'){
			gameData.mapNum = 0;
			gameData.themeNum = 0;
			gameData.mapLoopSide = data;
			goPage('select');
			prepareGame();

			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'preparegame'){
			gameData.mapNum = data.map;
			gameData.themeNum = data.theme;
			prepareGame();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage("game");
		}else if(status == 'countdown'){
			startCountdown(data);
		}else if(status == "loopcountdowncomplete"){
			for(var p=0; p<socketData.players.length; p++){
				var thisPlayer = gameData.users[p];
				if(gameData.gameIndex != p){
					thisPlayer.active = false;
				}
			}

			gameData.countdown = data;
			loopCountdownComplete();
		}else if(status == "updateplayer"){
			var updateIcons = true;
			var updatePos = true;
			var disX = 0;
			var disY = 0;
			if(gameData.mapLoop){
				disX += data.mapX;
				disY += data.mapY;
				updateIcons = false;
			}

			if(updateIcons){
				if(socketData.players[data.index].lives > 0){
					multiData.players[data.index].map = data.map;
					drawIcons();
				}
			}

			if(updatePos){
				for(var n=0; n<multiData.players[data.index].ghosts.length; n++){
					var thisGhost = multiData.players[data.index].ghosts[n];
					thisGhost.alpha = multiData.alpha;
					thisGhost.x = data.ghosts[n].x + disX;
					thisGhost.y = data.ghosts[n].y + disY;
					thisGhost.gotoAndStop(data.ghosts[n].frame);
				}
				
				var thisPlayer = gameData.users[data.index];
				thisPlayer.active = false;
				thisPlayer.x = data.player.x + disX;
				thisPlayer.y = data.player.y + disY;
				thisPlayer.scaleX = data.player.scaleX;
				thisPlayer.rotation = data.player.rotation;
				thisPlayer.alpha = multiData.alpha;
				thisPlayer.nameLabel.x = data.player.labelX + disX;
				thisPlayer.nameLabel.y = data.player.labelY + disY;
				thisPlayer.gotoAndStop(data.player.frame);
			}

			if(socketData.players[gameData.gameIndex].lives == 0 && gameData.mapLoop && multiData.map == data.index){
				mapWrapContainer.x = data.mapX;
				mapWrapContainer.y = data.mapY;
				
				gameData.map = data.map;
				drawWalls();
				drawIcons();
			}
		}else if(status == "updatestats"){
			socketData.players[data.index].score = data.score;
			socketData.players[data.index].lives = data.lives;

			if(socketData.players[data.index].lives == 0){
				gameData.users[data.index].nameLabel.visible = false;
				for(var n=0; n<multiData.players[data.index].ghosts.length; n++){
					var thisGhost = multiData.players[data.index].ghosts[n];
					thisGhost.alpha = 0;
				}
			}
			
			multiData.map = -1;
			for(var p=0; p<socketData.players.length; p++){
				if(socketData.players[p].lives > 0 && multiData.map == -1){
					multiData.map = p;
				}
			}
			updateGameDisplay();
		}else if(status == "endgame"){
			var endGameCon = true;
			for(var n=0; n<socketData.players.length; n++){
				if(socketData.players[n].lives > 0){
					endGameCon = false;
				}
			}

			if(endGameCon){
				endGame();
			}
		}
	}

	if(multiplayerSettings.game == 'slotcarchallenge'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			
			socketData.players = [];
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					gameData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}

				socketData.players.push({index:data[n].index, gameIndex:n, username:data[n].username, complete:false, overalltime:0, besttime:0});
			}
			gameData.totalplayers = data.length;
			if(socketData.host){
				postSocketUpdate('track');
			}
		}else if(status == 'track'){
			goPage('track');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatetrack'){
			selectPage(data);
		}else if(status == 'updatetrackselect'){
			selectTrackThumbs(data);
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					gameData.players[n].label.text = textMultiplayerDisplay.playerIndicator;
				}else{
					gameData.players[n].label.text = data[n].username;
				}
			}
		}else if(status == 'updatecountdown'){
			gameData.countNum = data;
			updateCountdown();
		}else if(status == 'updatecar'){
			var thisPlayer = gameData.players[data.index];
			thisPlayer.bestLapTime = data.bestLapTime;
			thisPlayer.timeScale = data.timeScale;
			thisPlayer.progress = data.progress;
			thisPlayer.touchCon = data.touchCon;
			thisPlayer.car.visible = data.visible;
			thisPlayer.volume = data.volume;
			thisPlayer.speed = data.speed;

			thisPlayer.carDrift.x = data.carDriftX;
			thisPlayer.carDrift.y = data.carDriftY;
			thisPlayer.carDrift.rotation = data.carDriftRotation;
			thisPlayer.carDrift.visible = data.carDriftVisible;

			thisPlayer.sparks.x = data.sparkX;
			thisPlayer.sparks.y = data.sparkY;
			thisPlayer.sparks.scaleX = data.sparkScaleX;
			thisPlayer.sparks.scaleY = data.sparkScaleY;
			thisPlayer.sparks.rotation = data.sparkRotation;
			thisPlayer.sparks.visible = data.sparkVisible;

			if(thisPlayer.carDrift.visible){
				TweenMax.to(thisPlayer.carTween, 0, {timeScale:thisPlayer.timeScale, overwrite:true});
			}

			if(thisPlayer.touchCon){
				thisPlayer.carTween.progress(thisPlayer.progress);
				TweenMax.to(thisPlayer.carTween, 1, {timeScale:thisPlayer.timeScale});
			}

			setSoundVolume('soundRaceAI', thisPlayer.volume);

			if(gameData.mode == "timer"){
				thisPlayer.car.alpha = thisPlayer.carDrift.alpha = .2;
			}
		}else if(status == "updatelap"){
			gameData.players[data.index].lap = data.lap;
		}else if(status == "completelap"){
			if(socketData.host){
				var socketPosIndex = socketData.players.findIndex(x => x.gameIndex === data);
				socketData.players[socketPosIndex].complete = true;
				gameData.players[data].complete = true;
				gameData.players[data].slowdown = true;

				var totalRacerComplete = 0;
				var totalRacer = 0;
				for(var n=0; n<socketData.players.length; n++){
					totalRacer++;

					if(socketData.players[n].complete){
						totalRacerComplete++;
					}
				}
				if(totalRacerComplete == totalRacer){
					postSocketUpdate('complete');
				}
			}
		}else if(status == "complete"){
			endGame();
		}
	}

	if(multiplayerSettings.game == 'playreversi'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			
			socketData.players = [];
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
				socketData.players.push({index:data[n].index, flipComplete:false})
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('custom');
		}else if(status == 'custom'){
			gameData.custom.size = customSettings.sizeMin;
			goPage('custom');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecustom'){
			gameData.custom.size = data.size;
			checkCustomSettings();
		}else if(status == 'players'){
			goPage('players');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateplayers'){
			gameData.icon = data.icon;
			gameData.switch = data.switch;
			gameData.icons = data.icons;
			displayPlayerIcon();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.youStart);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerStart.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			displayPlayerTurn();
		}else if(status == 'updatetimer'){
			timeData.playerTimer = data.playerTimer;
			timeData.opponentTimer = data.opponentTimer;
			updateTimer();
		}else if(status == 'makemove'){
			makeMove(data.row, data.column, data.player, data.animate);
		}else if(status == 'checkboardresult'){
			socketData.players[data].flipComplete = true;
			var completeCount = 0;
			for(var n=0; n<socketData.players.length; n++){
				if(socketData.players[n].flipComplete){
					completeCount++;
				}
			}
			if(completeCount == socketData.players.length){
				checkBoardResult();
			}
		}else if(status == 'updatemovecomplete'){
			for(var n=0; n<socketData.players.length; n++){
				socketData.players[n].flipComplete = false;
			}

			socketData.turn = false;
			if(data.index == socketData.gameIndex){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			gameData.moving = false;
			displayPlayerTurn();
		}
	}

	if(multiplayerSettings.game == 'playcheckers'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			
			socketData.players = [];
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
				socketData.players.push({index:data[n].index, flipComplete:false})
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('custom');
		}else if(status == 'custom'){
			gameData.custom.size = customSettings.sizeMin;
			goPage('custom');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecustom'){
			gameData.custom.size = data.size;
			checkCustomSettings();
		}else if(status == 'players'){
			goPage('players');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateplayers'){
			gameData.icon = data.icon;
			gameData.switch = data.switch;
			gameData.icons = data.icons;
			displayPlayerIcon();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			
			socketData.turn = false;
			if(data.index == socketData.index){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.youStart);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerStart.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			displayPlayerTurn();
		}else if(status == 'updatetimer'){
			timeData.playerTimer = data.playerTimer;
			timeData.opponentTimer = data.opponentTimer;
			updateTimer();
		}else if(status == 'moveplayer'){
			gameData.pieceIndex = data.pieceIndex;
			movePlayer(data.row, data.column);
		}else if(status == 'checkboardresult'){
			socketData.players[data].flipComplete = true;
			var completeCount = 0;
			for(var n=0; n<socketData.players.length; n++){
				if(socketData.players[n].flipComplete){
					completeCount++;
				}
			}
			if(completeCount == socketData.players.length){
				if(socketData.turn){
					togglePlayer();
					postSocketUpdate('updatemovecomplete', {index:gameData.player});
				}
			}
		}else if(status == 'updatemovecomplete'){
			for(var n=0; n<socketData.players.length; n++){
				socketData.players[n].flipComplete = false;
			}

			socketData.turn = false;
			if(data.index == socketData.gameIndex){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			gameData.moving = false;
			displayPlayerTurn();
		}
	}

	if(multiplayerSettings.game == 'playchess'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			
			socketData.players = [];
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players['gamePlayer'+ n].text = data[n].username;
				socketData.players.push({index:data[n].index, flipComplete:false})
			}
			gameData.totalPlayers = data.length;
			postSocketUpdate('players');
		}else if(status == 'players'){
			goPage('players');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateplayers'){
			gameData.icon = data.icon;
			gameData.iconSwitch = data.iconSwitch;
			gameData.icons = data.icons;
			displayPlayerIcon();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
			
			socketData.turn = false;
			if(gameData.player == socketData.gameIndex){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.youStart);
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerStart.replace('[USER]',data.username));
			}
			displayPlayerTurn();
		}else if(status == 'updatetimer'){
			timeData.playerTimer = data.playerTimer;
			timeData.opponentTimer = data.opponentTimer;
			updateTimer();
		}else if(status == 'moveplayer'){
			gameData.pieceIndex = data.pieceIndex;
			gameData.drag = data.drag;
			movePlayer(data.row, data.column);
		}else if(status == 'checkboardresult'){
			socketData.players[data].flipComplete = true;
			var completeCount = 0;
			for(var n=0; n<socketData.players.length; n++){
				if(socketData.players[n].flipComplete){
					completeCount++;
				}
			}
			if(completeCount == socketData.players.length){
				if(socketData.turn){
					togglePlayer();
					postSocketUpdate('updatemovecomplete', {index:gameData.player});
				}
			}
		}else if(status == 'updatemovecomplete'){
			for(var n=0; n<socketData.players.length; n++){
				socketData.players[n].flipComplete = false;
			}

			socketData.turn = false;
			if(data.index == socketData.gameIndex){
				socketData.turn = true;
				updateGameSocketLog(time + textMultiplayerDisplay.yourTurn);
				gameData.player = socketData.host == true ? 0 : 1;
			}else{
				updateGameSocketLog(time + textMultiplayerDisplay.playerTurn.replace('[USER]',data.username));
				gameData.player = socketData.host == true ? 1 : 0;
			}
			gameData.moving = false;
			displayPlayerTurn();
		}
	}

	if(multiplayerSettings.game == 'wheeloffortunequiz'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<4; n++){
				$.players[n].visible = false;
			}
			for(var n=0; n<data.length; n++){
				$.players["active"+n].visible = false;
				if(data[n].index == socketData.index){
					$.players["active"+n].visible = true;
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.players[n].visible = true;
				$.players["name"+n].text = data[n].username;
			}
			gameData.player = 0;
			gameData.totalPlayers = data.length;
			postSocketUpdate('category');
		}else if(status == 'category'){
			if(gameSettings.category){
				goPage('category');
				if(!socketData.host){
					gameLogsTxt.visible = true;
					toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
				}
			}else{
				goPage('game');
			}
		}else if(status == 'updatecategory'){
			gameData.categoryNum = data;
			displayCategoryName();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');

			socketData.turn = false;
			if(gameData.player == socketData.gameIndex){
				socketData.turn = true;
			}
		}else if(status == 'sequence'){
			sequence_arr = data;
		}else if(status == 'loadanswer'){
			socketData.loaded = [];
			loadAnswer();
		}else if(status == 'loadanswerready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalPlayers && socketData.host){
				socketData.loaded = [];
				if(fileFest.length > 0){
					postSocketUpdate('loadanswerassets');
				}else{
					postSocketUpdate('prepareanswer');
				}
			}
		}else if(status == 'loadanswerassets'){
			loadAnswerAssets();
		}else if(status == 'loadanswerassetscomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalPlayers && socketData.host){
				socketData.loaded = [];
				postSocketUpdate('prepareanswer');
			}
		}else if(status == 'prepareanswer'){
			prepareAnswer();
		}else if(status == 'prepareanswerready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalPlayers && socketData.host){
				postSocketUpdate('buildanswer', gameData.revealLetters);
			}
		}else if(status == 'buildanswer'){
			gameData.revealLetters = data;
			buildAnswer();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateTimer();
		}else if(status == 'proceednextstep'){
			proceedNextStep();
		}else if(status == 'startwheelspin'){
			startWheelSpin(data.rotateNum, data.randomNum);
		}else if(status == 'presskey'){
			if(data.type == "guessLetter"){
				$.key['guess_'+data.n+'_'+data.k].bgHidden.visible = true;
				$.key['solve_'+data.n+'_'+data.k].bgHidden.visible = true;
				$.key['guess_'+data.n+'_'+data.k].text.color = keyboardSettings.colorDisabled;
				$.key['solve_'+data.n+'_'+data.k].text.color = keyboardSettings.colorDisabled;
				
				toggleGameTimer(false);
				checkGuessLetter(data.letter, true);
			}else if(data.type == "solve"){
				gameData.focusLetterIndex = data.focusLetterIndex;
				gameData.focusLetter[gameData.focusLetterIndex].text.text = data.letter;
				toggleFocusLetter(true);
			}else if(data.type == "vowelSelect"){
				$.key['vowel_'+data.n+'_'+data.k].bgSecret.visible = false;
				toggleGameTimer(false);
				checkGuessLetter(data.letter, false);
			}else if(data.type == "solveenter"){
				checkSolveEnter(true);
			}else if(data.type == "solvedelete"){
				toggleFocusLetter(false);
				checkSolveEnter(false);
			}else if(data.type == "solveletter"){
				checkSolveEnter(false);
			}
		}else if(status == 'updateplayerscore'){
			if(data.con){
				playSound("soundScore");
			}

			TweenMax.to(tweenData, .5, {tweenScore:data.score, overwrite:true, onUpdate:function(){
				$.players[data.index].score = data.score;
				$.players["score"+data.index].text = textDisplay.score.replace('[NUMBER]', addCommas(Math.floor(tweenData.tweenScore)));
				$.players["coin"+data.index].x = -(($.players["score"+data.index].getMeasuredWidth()/2) + 30);
			}});
		}else if(status == 'toggleaction'){
			displayGameStage(data);
			playSound('soundButton');
		}else if(status == 'buildkeyboard'){
			if(data.type == "guess"){
				gameData.keyArr = data.keyArr;
				buildKeyboard("guess", gameData.keyArr, guessKeyMoveContainer);	
			}else if(data.type == "solve"){
				buildKeyboard("solve", data.keyArr, solveKeyMoveContainer);	
			}else if(data.type == "vowel"){
				gameData.vowelCount = data.vowelCount;
				gameData.vowelArr = data.keyArr;

				if(gameData.vowelArr[0].length < 2 || gameData.vowelCount < 0){
					displayGameStage("vowelNoOption");
				}else{
					buildKeyboard("vowel", gameData.vowelArr, vowelKeyMoveContainer);
					displayGameStage("vowelSelect");
				}
			}
		}else if(status == 'nextplayer'){
			gameData.player++;
			gameData.player = gameData.player > gameData.totalPlayers-1 ? 0 : gameData.player;

			socketData.turn = false;
			if(gameData.player == socketData.gameIndex){
				socketData.turn = true;
			}
			displayGameStage("turn");
		}else if(status == 'nextround'){
			gameData.currentRound = data;
			gameData.player = gameData.currentRound;

			socketData.turn = false;
			if(gameData.player == socketData.gameIndex){
				socketData.turn = true;
			}

			loadNextAnswer();
		}else if(status == 'endgame'){
			endGame();
		}
	}

	if(multiplayerSettings.game == 'circlejump'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.stage["player"+n].text = data[n].username;
			}
			gameData.totalPlayers = data.length;
			toggleSocketLoader(false);
			goPage('game');
		}else if(status == 'prepare'){
			gameData.bg = data.bg;
			gameData.themes = data.themes;
			prepareStage();
			prepareCircle();
			resizeGameUI();
			toggleCountdown(true);
		}else if(status == 'countdowncomplete'){
			updateCountdownComplete();
		}else if(status == 'updatestage'){
			var stageIndex = data.index;
			$.stage["cloud"+stageIndex].removeAllChildren();
			$.stage["lines"+stageIndex].removeAllChildren();

			for(var n=0; n<data.lines.length; n++){
				drawStroke(stageIndex, data.lines[n].x, data.lines[n].y, data.lines[n].length, data.lines[n].height);
			}

			for(var n=0; n<data.clouds.length; n++){
				drawCloud(stageIndex, data.clouds[n].x, data.clouds[n].y, data.clouds[n].index);
			}

			gameData.background[stageIndex].front.y = data.y;
			gameData.background[stageIndex].back.y = data.y;
		}else if(status == 'circlestatus'){
			if(socketData.gameIndex != data.index){
				var thisIndex = data.index;
				if(data.status == "jump"){
					var thisFront = gameData.background[thisIndex].front;
					thisFront.gotoAndPlay("rise");
				}else if(data.status == "hit"){
					playSound("soundFail");
					animateBlink(gameData.background[thisIndex].front, .1);
					animateBlink(gameData.background[thisIndex].back, .1);
				}else if(data.status == "reset"){
					resetCircle(thisIndex);
				}else if(data.status == "over"){
					playSound("soundOver");
					animateBlink(gameData.background[thisIndex].front, .1);
					animateBlink(gameData.background[thisIndex].back, .1);
					$.stage["score"+thisIndex].text = textDisplay.gameover;
				}
			}

			if(socketData.host){
				if(data.status == "over"){
					gameData.background[data.index].over = true;
				}

				var totalOver = 0;
				for(var n=0; n<gameData.background.length; n++){			
					if(gameData.background[n].over){
						totalOver++;
					}
				}
			
				if(totalOver == gameData.themes.length){
					postSocketUpdate('over');
				}
			}
		}else if(status == 'over'){
			gameData.over = true;
			endGame();
		}
	}

	if(multiplayerSettings.game == 'findme'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				$.players[n].text = data[n].username;
				$.players[n].player = data[n].username;
				if(data[n].index == socketData.index){
					$.players[n].text = textDisplay.activePlayer + "\n" + data[n].username;
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalPlayers = data.length;
			goPage('game');
		}else if(status == 'prepare'){
			socketData.loaded = [];
			timeData.oldTimer = -1;
			gameData.player = data.players;
			gameData.multi.players = data.multiplayers;
			showMultiPlayers();
		}else if(status == 'updatetimer'){
			timeData.sessionTimer = data;
			updateTimer();
		}else if(status == 'updateplayers'){
			if(socketData.gameIndex != gameData.multi.round){
				for(var n=0; n<gameData.players.length; n++){
					var thisPlayer = gameData.players[n];

					if(!gameData.begin){
						thisPlayer.moveX = data[n].moveX;
						thisPlayer.moveY = data[n].moveY;
						thisPlayer.x = data[n].x;
						thisPlayer.y = data[n].y;
					}else{
						if(thisPlayer.moveX != data[n].moveX && thisPlayer.moveY != data[n].moveY){
							playPlayerAudio();
							thisPlayer.moveX = data[n].moveX;
							thisPlayer.moveY = data[n].moveY;
							var tweenSpeed = getDistance(thisPlayer.x, thisPlayer.y, thisPlayer.moveX, thisPlayer.moveY) * (gameData.stage.speed * 0.01);
							TweenMax.to(thisPlayer, tweenSpeed, {x:thisPlayer.moveX, y:thisPlayer.moveY, ease:Linear.easeNone, overwrite:true});
						}
					}
					
					if(n < gameData.totalPlayers){
						posPlayerName(n, thisPlayer);
					}
				}
			}
		}else if(status == 'directplayer'){
			directPlayers(data.index, data.x, data.y);
		}else if(status == 'caughtplayer'){
			var thisPlayer = gameData.players[data]
			thisPlayer.focus = false;
			thisPlayer.gotoAndPlay("wave");
			playSound("soundClear");

			gameData.multi.found++;
			updateMultiScore();
		}else if(status == 'endround'){
			socketData.loaded = [];
			gameData.complete = true;
			timeData.sessionTimer = data;
			timeData.accumulate = timeData.countdown - timeData.sessionTimer;
			calculateScore();
			allPlayersPointToPlayer();
		}else if(status == 'timesup'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.gameIndex == gameData.multi.round){
				if(socketData.loaded.length == gameData.totalPlayers){
					TweenMax.to(gameContainer, 4, {overwrite:true, onComplete:function(){
						postSocketUpdate('nextround');
					}});
				}
			}else{
				gameData.complete = true;
				allPlayersPointToPlayer();
			}
		}else if(status == 'playersready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.gameIndex == gameData.multi.round){
				if(socketData.loaded.length == gameData.totalPlayers){
					TweenMax.to(gameContainer, 1, {overwrite:true, onComplete:function(){
						postSocketUpdate('nextround');
					}});
				}
			}
		}else if(status == 'nextround'){
			gameData.multi.round++;
			if(gameData.multi.round < gameData.totalPlayers){
				setupGameStage();
				showMultiPlayers();
			}else{
				showGameStatus("roundcomplete");
				TweenMax.to(gameContainer, 2, {overwrite:true, onComplete:function(){
					goPage('result');
				}});
			}
		}
	}

	if(multiplayerSettings.game == 'findobjects'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				$.players["score"+n].score = 0;
				$.players["score"+n].text = $.players["name"+n].score;
				$.players["name"+n].text = data[n].username;
				if(data[n].index == socketData.index){
					$.players["name"+n].text = data[n].username + " " + textDisplay.activePlayer;
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('select');
		}else if(status == 'select'){
			gameData.puzzleNum = 0;
			selectThumb();

			goPage('select');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateselect'){
			socketData.loaded = [];
			gameData.puzzleNum = data;
			selectThumb();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateTimer();
		}else if(status == 'checkpreload'){
			socketData.loaded = [];
			if(puzzles_arr[gameData.puzzleNum].preload){
				postSocketUpdate('preloadcomplete', socketData.gameIndex);
			}
		}else if(status == 'preloadcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				toggleSocketLoader(false);
				goPage('game');
				playersContainer.visible = true;
			}
		}else if(status == 'showobjecticon'){
			pictureData.objectIndex = data.index;
			pictureData.objects = data.objects;
			showObjectIcon();

			for(var n=0; n<gameData.totalplayers; n++){
				$.players["score"+n].text = $.players["score"+n].score;
			}
		}else if(status == 'checkcorrectobject'){
			checkCorrectObject(data.objIndex, data.index);
		}else if(status == 'timesup'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				endGame();
			}
		}else if(status == 'complete'){
			gameData.complete = true;
			endGame();
		}
	}

	if(multiplayerSettings.game == 'cardattack'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				$.status["playerNameTxt"+n].text = data[n].username.toUpperCase();
				$.status["playerNameTxt"+n].player = data[n].username.toUpperCase();
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('size');
		}else if(status == 'size'){
			toggleSocketLoader(false);
			goPage('size');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatesize'){
			gameData.layoutIndex = data.index;
			displayPlaySize();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
		}else if(status == 'updatecard'){
			gameData.playArr = data.playArr;
			gameData.enemyRevealArr = data.enemyRevealArr;
			gameData.chestRevealArr = data.chestRevealArr;
			gameData.barrelRevealArr = data.barrelRevealArr;
			gameData.castleRevealArr = data.castleRevealArr; 
			gameData.chestArr = data.chestArr;
			gameData.keyArr = data.keyArr;
			gameData.chestCountArr = data.chestCountArr;
			gameData.player = data.player;
			gameData.moveCount = data.moveCount;
			gameData.stage = data.stage;

			if(data.dealCard){
				createCards();
				shuffleCards();
			}else{
				socketData.loaded = [];
				postSocketUpdate('updatecardcomplete', socketData.gameIndex);
			}
		}else if(status == 'moveCard'){
			socketData.loaded = [];
			moveCard(data.player, data.direction);
		}else if(status == 'movecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				/*if(!data.con){
					gameData.moveCard = true;
				}else{*/
					var playerHealth1 = findBadgeValue($.card["player"+0], "health");
					var playerHealth2 = findBadgeValue($.card["player"+1], "health");

					if(playerHealth1 <= 0){
						if(!gameData.over){
							if(socketData.gameIndex == gameData.player){
								showGameStatus("youdead", 3);
							}else{
								showGameStatus("playerdead", 3, gameData.player);
							}
							endGame();
						}
					}else if(playerHealth2 <= 0){
						if(!gameData.over){
							if(socketData.gameIndex == gameData.player){
								showGameStatus("youdead", 3);
							}else{
								showGameStatus("playerdead", 3, gameData.player);
							}
							endGame();
						}
					}else if(socketData.host){
						checkNextStage();
					}
				/*}*/
			}
		}else if(status == 'updatecardcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				if(socketData.host){
					gameData.player = gameData.player == 0 ? 1 : 0;
					postSocketUpdate('switchplayer', gameData.player);
				}
			}
		}else if(status == 'switchplayer'){
			gameData.moveCard = true;
			gameData.player = data;
			focusPlayerCard();
		}
	}

	if(multiplayerSettings.game == 'typeracer'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			gameData.names = [];
			for(var n=0; n<data.length; n++){
				gameData.names.push(data[n].username.toUpperCase());
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('select');
		}else if(status == 'select'){
			toggleSocketLoader(false);
			goPage("main");
			toggleMainButton("select");
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updatecat'){
			gameData.wordNum = data.index;
			displayLetterCat();
		}else if(status == 'start'){
			toggleSocketLoader(false);
			socketData.loaded = [];
			gameData.order = data.order;
			gameData.cars = data.cars;
			gameData.carIndex = 0;
			goPage('game');
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				if(socketData.host){
					socketData.loaded = [];
					postSocketUpdate('countdown');
				}
			}
		}else if(status == 'countdown'){
			socketData.loaded = [];
			startCountdown();
		}else if(status == 'countdownend'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				if(socketData.host){
					postSocketUpdate('startrace');
				}
			}
		}else if(status == 'startrace'){
			socketData.loaded = [];
			countdownEnd();
		}else if(status == 'updatecount'){
			playerData.count[data.player] = data.count;
		}else if(status == 'carspin'){
			animateCarSpin(data.player);
		}else if(status == 'readyend'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				if(socketData.host){
					postSocketUpdate('endrace');
				}
			}
		}else if(status == 'endrace'){
			showEndLine();
		}
	}

	if(multiplayerSettings.game == 'playludo'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			gameData.names = [];
			for(var n=0; n<data.length; n++){
				gameData.names.push(data[n].username);
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalPlayers = data.length;
			postSocketUpdate('players');
		}else if(status == 'players'){
			goPage('players');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateplayers'){
			playSound("soundFlip");
			for(var c=0; c<gameData.colorDrag.array.length; c++){
				var thisIcon = gameData.colorDrag.array[c];
				thisIcon.x = thisIcon.oriX = data[c].x;
			}
		}else if(status == 'start'){
			goPage("game");
		}else if(status == 'ready'){
			socketData.loaded = [];
			gameSettings.dicePercent = data;
			buildBoardReady();
		}else if(status == 'animatedice'){
			socketData.loaded = [];
			animateDice();
		}else if(status == 'autoanimatedice'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalPlayers){
				if(gameData.seqIndex == socketData.gameIndex){
					postSocketUpdate('animatedice');
				}
			}
		}else if(status == 'animatedicecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalPlayers){
				if(gameData.seqIndex == socketData.gameIndex){
					postSocketUpdate('updateanimatedicecomplete', gameSettings.dicePercent);
				}
			}
		}else if(status == 'updateanimatedicecomplete'){
			gameSettings.dicePercent = data;
			socketData.loaded = [];
			updateAnimateDiceComplete();
		}else if(status == 'moveicon'){
			moveIcon(gameData.icons[data.playerIndex].array[data.iconIndex]);
		}else if(status == 'movecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalPlayers){
				socketData.loaded = [];
				prepareNextPlayer();
			}
		}
	}

	if(multiplayerSettings.game == 'playdominoes'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			gameData.names = [];
			for(var n=0; n<data.length; n++){
				gameData.names.push(data[n].username);
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.players = data.length;
			postSocketUpdate('options');
		}else if(status == 'options'){
			goPage('options');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateoptions'){
			gameData.pointIndex = data.pointIndex;
			gameData.domino.draw = data.draw;
			gameData.themeIndex = data.themeIndex;
			toggleDominoOptions(data.options);
		}else if(status == 'start'){
			socketData.loaded = [];
			goPage("game");
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					var tilesArr = [];
					for(var n=0; n<gameData.tiles.length; n++){
						tilesArr.push(gameData.tiles[n].tileIndex);
					}
					postSocketUpdate('prepareplayers', tilesArr);
				}
			}
		}else if(status == 'prepareplayers'){
			gameData.tiles = [];
			for(var n=0; n<data.length; n++){
				gameData.tiles.push($.domino[data[n]]);
			}
			preparePlayers();
		}else if(status == 'drawpile'){
			getDrawPile(data);
		}else if(status == 'playermove'){
			socketData.loaded = [];
			placeTitle(data.tileIndex, data.highlightTileIndex, data.dir);
		}else if(status == 'playermove'){
			socketData.loaded = [];
			placeTitle(data.tileIndex, data.highlightTileIndex, data.dir);
		}else if(status == 'movecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('checkend');
				}
			}
		}else if(status == 'checkend'){
			socketData.loaded = [];
			checkGameEnd();
		}else if(status == 'resultcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.players){
				socketData.loaded = [];
				startDomino();
			}
		}
	}

	if(multiplayerSettings.game == 'wartactics'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			gameData.names = [];
			for(var n=0; n<data.length; n++){
				$.bar["barName"+n].playerName = data[n].username.toUpperCase();
				gameData.names.push(data[n].username.toUpperCase());
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalplayers = data.length;
			if(socketData.host){
				postSocketUpdate('start');
			}
		}else if(status == 'start'){
			toggleSocketLoader(false);
			goPage('game');
		}else if(status == 'prepare'){
			gameData.randomStats = data;
			socketData.loaded = [];
			prepareBuild();
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];

				var chaArr = [];
				for(var r=0; r<gameSettings.stage.row; r++){
					for(var c=0; c<gameSettings.stage.column; c++){
						if($.grid[gameData.chaSide+'_'+r+'_'+c].cha != null){
							chaArr.push($.grid[gameData.chaSide+'_'+r+'_'+c].cha.typeIndex);
						}else{
							chaArr.push(-1);
						}
					}
				}

				postSocketUpdate('readycha', {side:gameData.chaSide, cha:chaArr});
			}
		}else if(status == 'readycha'){
			if(gameData.chaSide != data.side){
				if(socketData.host){
					buildCharacters(data.side, data.cha, true);	
				}
				buildCharacters(data.side, data.cha);
			}

			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				if(socketData.host){
					postSocketUpdate('startbattle');
				}
			}
		}else if(status == 'startbattle'){
			gameLogsTxt.visible = false;
			toggleSocketLoader(false);
			startBattleCountdown();
			socketData.loaded = [];
		}else if(status == 'updatesimulate'){
			gameData.actions.push({time:data.time, type:data.type, object:data.object, target:data.target, data:data.data, data2:data.data2, frame:data.frame});
		}else if(status == 'endbattle'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				if(socketData.host){
					TweenMax.to(gridMoveContainer, .5, {overwrite:true, onComplete:function(){
						postSocketUpdate('nextbattle');
					}});
				}
			}
		}else if(status == 'nextbattle'){
			socketData.loaded = [];
			checkNextBattle();
		}
	}

	if(multiplayerSettings.game == 'findanimals'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				$.players["score"+n].score = 0;
				$.players["score"+n].text = $.players["name"+n].score;
				$.players["name"+n].text = data[n].username;
				if(data[n].index == socketData.index){
					$.players["name"+n].text = data[n].username + " " + textDisplay.activePlayer;
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('select');
		}else if(status == 'select'){
			gameData.puzzleNum = 0;
			selectThumb();

			goPage('select');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateselect'){
			socketData.loaded = [];
			gameData.puzzleNum = data;
			selectThumb();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateTimer();
		}else if(status == 'checkpreload'){
			socketData.loaded = [];
			if(puzzles_arr[gameData.puzzleNum].preload){
				postSocketUpdate('preloadcomplete', socketData.gameIndex);
			}
		}else if(status == 'preloadcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				toggleSocketLoader(false);
				goPage('game');
				playersContainer.visible = true;
			}
		}else if(status == 'showobjecticon'){
			pictureData.objectIndex = data.index;
			pictureData.objects = data.objects;
			showObjectIcon();

			for(var n=0; n<gameData.totalplayers; n++){
				$.players["score"+n].text = $.players["score"+n].score;
			}
		}else if(status == 'checkClickObject'){
			checkClickObject(data.objIndex, data.index);
		}else if(status == 'timesup'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				endGame();
			}
		}
	}

	if(multiplayerSettings.game == 'findminime'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				$.players["score"+n].score = 0;
				$.players["score"+n].text = $.players["score"+n].score;
				$.players["name"+n].text = data[n].username;
				if(data[n].index == socketData.index){
					$.players["name"+n].text = data[n].username + " " + textDisplay.activePlayer;
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('select');
		}else if(status == 'select'){
			gameData.puzzleNum = 0;
			selectThumb();

			goPage('select');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateselect'){
			socketData.loaded = [];
			gameData.puzzleNum = data;
			selectThumb();
		}else if(status == 'updatetimer'){
			timeData.timer = data;
			updateTimer();
		}else if(status == 'checkpreload'){
			socketData.loaded = [];
			if(puzzles_arr[gameData.puzzleNum].preload){
				postSocketUpdate('preloadcomplete', socketData.gameIndex);
			}
		}else if(status == 'preloadcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				toggleSocketLoader(false);
				goPage('game');
				playersContainer.visible = true;
			}
		}else if(status == 'preparepuzzle'){
			preparePuzzle();
			gameData.icons = data.icons;
			gameData.randomMoveSeq = data.randomMoveSeq;
			gameData.randomStaticSeq = data.randomStaticSeq;
			loadPuzzle();
		}else if(status == 'checkClickObject'){
			checkClickObject(data.objIndex, data.index);
		}else if(status == 'timesup'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				endGame();
			}
		}
	}

	if(multiplayerSettings.game == 'warship'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.board[n].playerName = data[n].username;
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('select');
		}else if(status == 'select'){
			goPage('select');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateoption'){
			gameData.themeIndex = data.theme;
			gameData.sizeIndex = data.size;
			boardData = data.boardData;
			fillBoardOption('all');
		}else if(status == 'start'){
			socketData.loaded = [];
			gameLogsTxt.visible = false;
			toggleSocketLoader(false);
			goPage('game');
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);

				if(socketData.gameIndex != data.index){
					var targetShipArr = data.index == 0 ? gameData.shipA : gameData.shipB;
					for(var s=0; s<targetShipArr.length; s++){
						var thisShip = targetShipArr[s];
						resetGridShip(data.index, thisShip.data.grids);

						thisShip.rotation = data.ships[s].rotation;
						thisShip.data.grids = data.ships[s].grids;
						positionShip(thisShip);
					}
				}
			}

			if(socketData.loaded.length == gameData.totalplayers){
				if(socketData.host){
					postSocketUpdate('allready');
				}
			}
		}else if(status == 'allready'){
			socketData.loaded = [];
			updateBoardState(1);
		}else if(status == 'attack'){
			gameData.shotsArr = data.shots;
			attackMissile(data.targetBoard);
		}else if(status == 'placecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}
			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				updateBoardState(5);
			}
		}
	}

	if(multiplayerSettings.game == 'warshiproyale'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGameLogs = [];
			gameLogsTxt.text = '';
			if(data[0].index == socketData.index){
				socketData.host = true;
			}
			
			$.board[0].playerName = [];
			for(var n=0; n<data.length; n++){
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
				$.board[0].playerName.push(data[n].username);
			}
			gameData.totalplayers = data.length;
			postSocketUpdate('select');
		}else if(status == 'select'){
			goPage('select');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateoption'){
			gameData.themeIndex = data.theme;
			gameData.sizeIndex = data.size;
			boardData = data.boardData;
			boardData.totalplayers = gameData.totalplayers;
			fillBoardOption('all');
		}else if(status == 'start'){
			socketData.loaded = [];
			gameLogsTxt.visible = false;
			toggleSocketLoader(false);
			goPage('game');
		}else if(status == 'prepare'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				gameInnerContainer.visible = true;
				updateBoardState(0);
			}
		}else if(status == 'ready'){
			var targetShipArr = gameData.ships;
			var targetSubmarineArr = gameData.submarine;

			//sort
			for(var s=0; s<targetShipArr.length; s++){
				for(var r=0; r<targetShipArr.length; r++){
					var replaceShip = targetShipArr[r];
					if(replaceShip.data.arrIndex == data.ships[s].arrIndex){
						var thisShip = targetShipArr[s];
						targetShipArr[s] = targetShipArr[r];
						targetShipArr[r] = thisShip;
						r = targetShipArr.length;
					}
				}
			}

			for(var s=0; s<targetSubmarineArr.length; s++){
				for(var r=0; r<targetSubmarineArr.length; r++){
					var replaceSubmarine = targetSubmarineArr[r];
					if(replaceSubmarine.data.arrIndex == data.submarine[s].arrIndex){
						var thisSubmarine = targetSubmarineArr[s];
						targetSubmarineArr[s] = targetSubmarineArr[r];
						targetSubmarineArr[r] = thisSubmarine;
						r = targetSubmarineArr.length;
					}
				}
			}

			//position
			for(var s=0; s<targetShipArr.length; s++){
				var thisShip = targetShipArr[s];
				resetGridShip(thisShip.data.grids, 0);

				thisShip.rotation = data.ships[s].rotation;
				thisShip.data.grids = data.ships[s].grids;
				positionShip(thisShip, 0);
			}

			for(var s=0; s<targetSubmarineArr.length; s++){
				var thisSubmarine = targetSubmarineArr[s];
				resetGridShip(thisSubmarine.data.grids, 1);

				thisSubmarine.rotation = data.submarine[s].rotation;
				thisSubmarine.data.grids = data.submarine[s].grids;
				positionShip(thisSubmarine, 1);
			}
			updateBoardState(1);
		}else if(status == 'discardcard'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
				if(gameData.playerIndex != data.index){
					for(var n=0; n<$.players[data.index].ships.length; n++){
						var thisShip = $.players[data.index].ships[n];
						if(data.discard.indexOf(n) != -1){
							thisShip.toDiscard = true;
						}else{
							thisShip.toDiscard = false;
						}
					}

					for(var n=0; n<$.players[data.index].ships.length; n++){
						var thisShip = $.players[data.index].ships[n];				
						if(thisShip.toDiscard == true){
							$.players[data.index].ships.splice(n,1);
							n--;
						}
					}
				}
			}

			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				removeDiscardCards();
				updateBoardState(2);
			}
		}else if(status == 'roll'){
			gameData.dieNum = data.dieNum;
			gameData.die = true;
			rollGameDie();
		}else if(status == 'attack'){
			gameData.shotsArr = data.shots;
			attackMissile();
		}else if(status == 'placecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}
			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				updateBoardState(10);
			}
		}else if(status == 'switchplayer'){
			switchPlayer();
		}else if(status == 'bonus'){
			proceedUseBonus(data.index, data.totalBonus, data.bonusIndex);
		}else if(status == 'searchsonar'){
			socketData.loaded = [];
			checkBoardSonar(data.sonar);
		}else if(status == 'sonarcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}
			if(socketData.loaded.length == gameData.totalplayers){
				socketData.loaded = [];
				if(gameData.dieChance){
					//havent roll die
					if(gameData.player == gameData.playerIndex){
						updateBoardState(3);
					}
				}else{
					updateBoardState(10);
				}
			}
		}else if(status == 'endturn'){
			endTurn();
		}
	}

	if(multiplayerSettings.game == 'fourcolors'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			gameData.names = [];
			for(var n=0; n<data.length; n++){
				gameData.names.push(data[n].username);
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.players = data.length;
			postSocketUpdate('options');
		}else if(status == 'options'){
			goPage('options');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateoptions'){
			gameData.pointIndex = data.pointIndex;
			gameData.fourcolors.special = data.special;
			gameData.themeIndex = data.themeIndex;
			toggleCardsOptions(data.option);
		}else if(status == 'start'){
			socketData.loaded = [];
			goPage("game");
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					var cardsArr = [];
					for(var n=0; n<gameData.cards.length; n++){
						cardsArr.push(gameData.cards[n].cardIndex);
					}
					postSocketUpdate('prepareplayers', cardsArr);
				}
			}
		}else if(status == 'prepareplayers'){
			socketData.loaded = [];
			gameData.cards = [];
			for(var n=0; n<data.length; n++){
				gameData.cards.push($.cards[data[n]]);
			}
			preparePlayers();
		}else if(status == 'cardactioncomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('playerreadyaction');
				}
			}
		}else if(status == 'playerreadyaction'){
			socketData.loaded = [];
			playerReadyAction();
		}else if(status == 'choosecolor'){
			gameData.match.value = 0;
			gameData.match.color = data;
			toggleColors(false);
			getMatchDetail();
			checkRoundEnd();
		}else if(status == 'called'){
			playSound('soundCall');
			$.players["called" + data].visible = true;
			animateFocus($.players["called" + data]);
		}else if(status == 'calltimer'){
			checkCallPenalty();
		}else if(status == 'wildaction'){
			if(data.card == 'givecard'){
				giveCardToPlayer(data.cardData);
			}else if(data.card == 'drawplayercard'){
				gameData.turn.drawCount = data.cardData;
				drawPlayerCard(false);
			}else if(data.card == 'discardplayercard'){
				discardPlayerCard(data.cardData, true);
			}
		}else if(status == 'targetaim'){
			toggleTargetIcon(data);
			if(gameData.turn.swap){
				swapPlayerCards(data);
			}else if(gameData.turn.revealCard){
				revealPlayerCards(data);
			}else if(gameData.turn.giveCard){
				choosePlayerCards(data);
			}else if(gameData.turn.removePlayer){
				removePlayers(data);
			}else{
				targetedPlayerDraw(data);
			}
		}else if(status == 'shuffledrawcards'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('readyshuffledrawcards', {draw:gameData.draw});
				}
			}
		}else if(status == 'readyshuffledrawcards'){
			socketData.loaded = [];
			gameData.draw = data.draw;
			showDrawCard(false);
		}else if(status == 'shuffleplayercards'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}

			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('readyshuffleplayercards', {allCards:gameData.turn.playerCards});
				}
			}
		}else if(status == 'readyshuffleplayercards'){
			socketData.loaded = [];
			shufflePlayerCards(data.allCards);
		}else if(status == 'resultcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.players){
				socketData.loaded = [];
				startCards();
			}
		}
	}

	if(multiplayerSettings.game == 'rainbowbead'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			gameData.names = [];
			for(var n=0; n<data.length; n++){
				gameData.names.push(data[n].username);
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.players = data.length;
			postSocketUpdate('options');
		}else if(status == 'options'){
			goPage('options');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateoptions'){
			gameData.sizeIndex = data.sizeIndex;
			gameData.raindowbead.spaceMode = data.spaceMode;
			gameData.themeIndex = data.themeIndex;
			toggleBoardOptions(data.option);
		}else if(status == 'start'){
			socketData.loaded = [];
			gameLogsTxt.visible = false;
			goPage("game");
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('startboard', gameData.fixedBoard);
				}
			}
		}else if(status == 'startboard'){
			socketData.loaded = [];
			gameData.fixedBoard = data;
			startBoard();
		}else if(status == 'trymovebead'){
			socketData.loaded = [];
			tryMoveBead(data.countIndex, data.dir);
		}else if(status == 'movebeadcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('playeractioncomplete', data.next);
				}
			}
		}else if(status == 'playeractioncomplete'){
			socketData.loaded = [];
			gameData.animating = false;
			if(data){
				nextPlayerTurn();
			}
			findPossibleMoves();
		}else if(status == 'resultcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}

			if(socketData.loaded.length == gameData.players){
				socketData.loaded = [];
				startCards();
			}
		}
	}

	if(multiplayerSettings.game == 'playabalone'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			for(var n=0; n<data.length; n++){
				$.players['player'+ n].text = data[n].username;
				$.players['gamePlayer'+ n].text = data[n].username;
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.players = data.length;
			postSocketUpdate('options');
		}else if(status == 'options'){
			goPage('options');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateoptions'){
			gameData.themeIndex = data.themeIndex;
			gameData.layoutIndex = data.layoutIndex;
			gameData.iconSwitch = data.iconSwitch;
			toggleBoardOptions(data.option);
		}else if(status == 'start'){
			socketData.loaded = [];
			gameLogsTxt.visible = false;
			goPage("game");
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('startboard');
				}
			}
		}else if(status == 'startboard'){
			socketData.loaded = [];
			startBoard();
		}else if(status == 'makeballmove'){
			socketData.loaded = [];

			gameData.firstX = data.firstX;
			gameData.firstY = data.firstY;
			gameData.secondX = data.secondX;
			gameData.secondY = data.secondY;
			makeBallMove(data.ii, data.jj, data.ss);

			gameData.firstX = -1;
			gameData.firstY = -1;
			gameData.secondX = -1;
			gameData.secondY = -1;
			updateMovement();
		}else if(status == 'animationcomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('playeractioncomplete', data.next);
				}
			}
		}else if(status == 'playeractioncomplete'){
			socketData.loaded = [];
			gameData.animating = false;
			checkGameEnd();
		}
	}

	if(multiplayerSettings.game == 'memorychess'){
		if(status == 'init'){
			toggleSocketLoader(false);
			socketData.socketGamelogs = [];
			if(typeof gameLogsTxt != 'undefined'){
				gameLogsTxt.text = '';
			}
			if(data[0].index == socketData.index){
				socketData.host = true;
			}

			gameData.names = [];
			for(var n=0; n<data.length; n++){
				gameData.names.push(data[n].username);
				if(data[n].index == socketData.index){
					socketData.gameIndex = n;
					if(!multiplayerSettings.enterName){
						showSocketNotification(textMultiplayerDisplay.playerNotification.replace('[USER]', data[n].username));
					}
				}
			}
			gameData.players = data.length;
			postSocketUpdate('options');
		}else if(status == 'options'){
			goPage('options');
			if(!socketData.host){
				gameLogsTxt.visible = true;
				toggleSocketLoader(true, textMultiplayerDisplay.waitingHost);
			}
		}else if(status == 'updateoptions'){
			gameData.sizeIndex = data.sizeIndex;
			gameData.winMode = data.winMode;
			gameData.themeIndex = data.themeIndex;
			toggleBoardOptions(data.option);
		}else if(status == 'start'){
			socketData.loaded = [];
			gameLogsTxt.visible = false;
			goPage("game");
		}else if(status == 'ready'){
			var loadedIndex = socketData.loaded.indexOf(data);
			if(loadedIndex == -1){
				socketData.loaded.push(data);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('setupchess', gameData.pieceColors);
				}
			}
		}else if(status == 'setupchess'){
			socketData.loaded = [];
			gameData.pieceColors = data;
			setupChess();
		}else if(status == 'proceedrolldice'){
			socketData.loaded = [];
			gameData.diceIndex = data.diceIndex;
			proceedRollDice();
		}else if(status == 'rolldicecomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('rolldicenext', data.next);
				}
			}
		}else if(status == 'rolldicenext'){
			socketData.loaded = [];
			rollDiceNext();
		}else if(status == 'showpiece'){
			socketData.loaded = [];
			showPiece(data.chessIndex, data.pieceIndex);
		}else if(status == 'showpiececomplete'){
			var loadedIndex = socketData.loaded.indexOf(data.index);
			if(loadedIndex == -1){
				socketData.loaded.push(data.index);
			}
			
			if(socketData.loaded.length == gameData.players){
				if(socketData.host){
					postSocketUpdate('nextplayerturn', {check:data.check});
				}
			}
		}else if(status == 'nextplayerturn'){
			socketData.loaded = [];

			if(data.check){
				if(gameSettings.nextPlayer){
					nextPlayerTurn();
				}
			}else{
				nextPlayerTurn();
			}
			displayPlayerTurn();
		}
	}
}