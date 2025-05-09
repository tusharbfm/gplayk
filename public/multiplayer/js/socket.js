////////////////////////////////////////////////////////////
// SOCKET
////////////////////////////////////////////////////////////

//multiplayer settings
var multiplayerSettings = {
	enable:true, //enable multiplayer
	localPlay:true, //enable local and online play
	roomLists:true, //enable room lists, false to enter without joining room (auto random connect)
	enterName:true, //quick play with or without enter name
	forceQuit:true, //everyone quit game if one player is leaved
	findPlayerTimer:true, //show quick match time
	rejoinRoom:true, //button replay at result screen to rejoin current rooms (select public rooms only)
}

//multiplayer text display
var textMultiplayerDisplay = {
	findingPlayer:'Waiting for players',
	findingPlayerTimer:'\n([TIMER])',
	connectionTimeout:'No players found...',
	enterNameTitle:"ENTER YOUR NAME",
	enterNameError:'Enter your name to proceed.',
	selectRoomTitle:"SELECT ROOMS",
	privateRoomTitle:"Private Room",
	playing:"PLAYING",
	host:"HOST",
	playerNotification:"You connected as [USER]",
	selectRoom:"Select a room to join.",
	enterCode:"Please enter room code to join",
	waitingHost:'Waiting host to begin',
	youStart:"You start first",
	playerStart:"[USER] start first",
	yourTurn:"Your turn.",
	playerTurn:"[USER] turn.",
	playerIndicator:"YOU",
	hostLeave:"HOST has leave the game.",
};

var socketData = {online:false, username:'', index:0, gameIndex:0, room:'', public:true, host:false, move:0, turn:false, loaded:0, socketlogs:[], socketGamelogs:[], timer:0, showTimer:false};

function initSocket(game){
	multiplayerSettings.game = game;

	$.get('multiplayer/room.html', function(data){
		$('#mainHolder').addClass(multiplayerSettings.game);
		$('#mainHolder').append(data);
		$('#enterNameTitle').html(textMultiplayerDisplay.enterNameTitle);

		$('#enterName').click(function(){
			addSocketUser();
		});
		
		$('#joinRoom').click(function(){
			joinSocketRoom();
		});
		
		$('#exitRoom').click(function(){
			exitSocketRoom();
		});
		
		$('#createRoom').click(function(){
			createSocketRoom();
		});
		
		$('#joinFriend').click(function(){
			switchSocketRoomContent('joinfriend');
		});

		$('#cancelJoinFriend').click(function(){
			switchSocketRoomContent('lists');
			//joinSocketPrivateRoom();
		});

		$('#enterPrivateRoom').click(function(){
			joinSocketPrivateRoom();
		});
		
		$('#startGame').click(function(){
			startSocketGame();
		});

		window.addEventListener('blur', function() {
			TweenMax.ticker.useRAF(false);
		}, false);
		
		
		window.addEventListener('focus', function() {
			TweenMax.ticker.useRAF(true);
		}, false);

		if ( typeof changeCanvasViewport == 'function') {
			changeCanvasViewport();
		}
		resizeGameFunc();
	});

	socket = io();
	socket.on('connect', function(){
		socket.emit('updateGameType', multiplayerSettings.game);
	});
	
	socket.on('updateSocketUser', function (status, data) {
		if(status == 'success'){
			socketData.socketlogs.length = 0;
			$('#roomLogs').val('');
			socketData.username = data.username;
			socketData.index = data.index;
			socketData.host = false;

			if(!multiplayerSettings.roomLists){
				toggleSocketLoader(true, textMultiplayerDisplay.findingPlayer, true);
				$('#enterName').hide();
				joinSocketRandomRoom();
			}else{
				goPage('room');
			}
		}
	});

	socket.on('updateSocketRooms', function(status, data) {
		if(status == 'matched'){
			startSocketGame();
		}else if(status == 'timeout'){
			toggleSocketLoader(false);
			updateGameLog(textMultiplayerDisplay.connectionTimeout);
			setTimeout(function(){ goPage("main"); }, 3000);
		}else if(status == 'roomlist'){
			updateSocketRooms(data);
		}else if(status == 'namelist'){
			updateSocketNames(data);
		}else if(status == 'join'){
			socketData.room = data.room;
			socketData.public = data.public;
			switchSocketRoomContent('room');
		}else if(status == 'exit'){
			socketData.room = '';
			socketData.public = true;
			switchSocketRoomContent('lists');
		}else if(status == 'leave'){
			exitSocketRoom();
			stopGame();
			goPage('main');
			showSocketNotification(textMultiplayerDisplay.hostLeave);
		}
	});
	
	socket.on('updateSocketGame', function (status, data, time) {
		updateSocketGame(status, data, time);
	});
	
	socket.on('updateSocketLog', function(data) {
		updateSocketLog(data);
	});
	
	socket.on('updateGameSocketLog', function(data) {
		if(data.noti){
			if(multiplayerSettings.forceQuit){
				exitSocketRoom();
				stopGame();
				goPage('main');
			}
			showSocketNotification(data.message);
		}
		if(typeof curPage != 'undefined'){
			if(curPage == 'game'){
				updateGameSocketLog(data.time + data.message);
			}
		}else{
			if(gameData.page == 'game'){
				updateGameSocketLog(data.time + data.message);
			}
		}
	});
}

function addSocketUser(){
	if($('#userName').val() != ''){
		$('#roomWrapper .fontNameError').html('');
		socket.emit('adduser', $('#userName').val());
	}else{
		$('#roomWrapper .fontNameError').html(textMultiplayerDisplay.enterNameError);
	}
}

function addSocketRandomUser(){
	toggleSocketLoader(true, textMultiplayerDisplay.findingPlayer, true);
	socket.emit('adduser');
}

function updateSocketRooms(rooms){
	$('#roomlists').empty();
	for(var n=0; n<rooms.length; n++){
		var totalUsers = rooms[n].users.length > 0 ? ' ('+rooms[n].users.length+')' : '';
		var playing = rooms[n].play == true ? '('+textMultiplayerDisplay.playing+')' : totalUsers;
		var roomName = rooms[n].name + playing;
		$('#roomlists').append(new Option(roomName, rooms[n].name));
	}
	$("#roomlists").prop("selectedIndex", 0);
}

function updateSocketNames(names){
	$('#namelists').empty();
	for(var n=0; n<names.length; n++){
		var isHost = n == 0 ? ' ('+textMultiplayerDisplay.host+')' : '';
		var userName = (n+1)+'. '+names[n].username + isHost;
		$('#namelists').append(new Option(userName, n));
		
		if(names[n].index == socketData.index && n == 0){
			$('#startGame').show();
		}
	}
	$("#namelists").prop("selectedIndex", 0);
}

function switchSocketRoomContent(con){
	$('#actionPrivateRoom').hide();
	$('#actionPublicRoom').hide();
	$('#actionJoinFriend').hide();
	$('#startGame').hide();

	$('#roomlists').hide();
	$('#namelists').hide();
	
	if(con == 'lists'){
		$('#actionPublicRoom').show();
		$('#roomlists').show();

		$('#enterRoomTitle').html(textMultiplayerDisplay.selectRoomTitle + ' :');
	}else if(con == 'room'){
		$('#actionPrivateRoom').show();
		$('#namelists').show();
		
		if(socketData.public){
			$('#enterRoomTitle').html(socketData.room+' :');
		}else{
			$('#enterRoomTitle').html(textMultiplayerDisplay.privateRoomTitle + ' ('+socketData.room+') :');
		}
	}else if(con == 'joinfriend'){
		$('#actionJoinFriend').show();
		$('#roomlists').show();

		$('#privateRoomName').val('');
	}
}

function createSocketRoom(){
	socket.emit('createroom');
}

function joinSocketRoom(){
	if($('#roomlists').val() != null){
		socketData.lastRoom = $('#roomlists').val();
		socket.emit('joinroom', $('#roomlists').val());
	}else{
		updateSocketLog(textMultiplayerDisplay.selectRoom);
	}
}

function joinSocketPrivateRoom(){
	/*var roomCode = prompt(textMultiplayerDisplay.enterCode);
	if (roomCode != null) {
		socket.emit('joinroom', roomCode);
	}*/
	if($('#privateRoomName').val().length > 0){
		socket.emit('joinroom', $('#privateRoomName').val());
	}else{
		updateSocketLog(textMultiplayerDisplay.enterCode);
	}
}

function joinSocketRandomRoom(){
	socket.emit('joinrandomroom');
}

function exitSocketRoom(){
	toggleSocketLoader(false);
	socket.emit('exitroom');
}

function postSocketCloseRoom(){
	socket.emit('closeroom');
}

//games
function postSocketUpdate(status, data, others){
	socket.emit('game', status, data, others);
}

//logs
function updateSocketLog(data){
	socketData.socketlogs.push(data+'\n');
	if(socketData.socketlogs.length > 8){
		socketData.socketlogs.shift();
	}

	var outputLogs = '';
	for(var n=0;n<socketData.socketlogs.length; n++){
		outputLogs += socketData.socketlogs[n];
	}
	$('#roomLogs').val(outputLogs);

	var roomLogs = $('#roomLogs');
    if(roomLogs.length)
	roomLogs.scrollTop(roomLogs[0].scrollHeight - roomLogs.height());
}

function updateGameSocketLog(data){
	socketData.socketGamelogs.push(data+'\n');
	if(socketData.socketGamelogs.length > 3){
		socketData.socketGamelogs.shift();
	}

	var outputLogs = '';
	for(var n=0;n<socketData.socketGamelogs.length; n++){
		outputLogs += socketData.socketGamelogs[n];
	}
	
	if(typeof gameLogsTxt != 'undefined'){
		gameLogsTxt.text = outputLogs;
	}
}

function showSocketNotification(message){
	$('.fontNotification').html(message);

	$('#notificationHolder').show();
	$('.notificationBg').stop(true, true);
	$('.notificationBg').animate({opacity: 1}, 250, 'linear')
						.animate({opacity: 1}, 3000, 'linear')
						.animate({opacity:0}, 250, 'linear', function() {
							$('#notificationHolder').hide();
						});
}

function toggleSocketLoader(con, text, timer){
	if(socketData.interval != undefined){
		clearInterval(socketData.interval);
	}

	if(con){
		socketData.loaderText = text;
		socketData.interval = setInterval(updateSocketFindPlayer, 500);
		socketData.loaderIndex = 1;
		socketData.timer = 1000;
		socketData.showTimer = timer;
		updateSocketFindPlayer();

	}
}

function updateSocketFindPlayer(){
	var loadingDot = '';
	for(var n=1; n<=socketData.loaderIndex; n++){
		loadingDot += '.';
	}

	var loadingText = socketData.loaderText + loadingDot;
	if(multiplayerSettings.findPlayerTimer && socketData.showTimer){
		socketData.timer += 500;
		var seconds = Math.floor((socketData.timer / 1000) % 60);
		if(seconds<10){
			seconds = '0'+seconds;  
		}
		loadingText += textMultiplayerDisplay.findingPlayerTimer.replace("[TIMER]",seconds);
	}
	updateGameLog(loadingText);

	socketData.loaderIndex++;
	socketData.loaderIndex = socketData.loaderIndex > 3 ? 1 : socketData.loaderIndex;
}

function updateGameLog(text){
	if(typeof gameLogsTxt != 'undefined'){
		gameLogsTxt.text = text;
	}
	
	if(multiplayerSettings.game == 'quizgamevs'){
		if(gameData.page == 'main'){
			$('.preloadText').html(text).show();
		}else if(gameData.page == 'mode' || gameData.page == 'category'){
			$('.fontLogText').html(text).show();
		}
	}

	$('#roomWrapper .fontNameError').html(text);
}