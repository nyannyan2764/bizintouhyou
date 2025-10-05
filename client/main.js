import { gameState } from './state.js';
import * as UI from './ui.js';
import elements from './ui.js';

const socket = io();

// ==============================
// サーバーへのイベント送信
// ==============================
function createRoom() {
    const playerName = elements.playerNameInputHome.value.trim().toUpperCase();
    if (!playerName) { alert('名前を入力してください'); return; }
    socket.emit('create-room', playerName);
}

function joinRoom() {
    const playerName = elements.playerNameInputHome.value.trim().toUpperCase();
    const roomId = elements.roomIdInput.value.trim().toUpperCase();
    if (!playerName || !roomId) { alert('名前とルームIDを入力してください'); return; }
    socket.emit('join-room', { playerName, roomId });
}

function startGame() {
    socket.emit('start-game', gameState.roomId);
}

function submitNumber() {
    const inputEl = document.getElementById('player-input');
    const jokerBtn = document.getElementById('joker-btn');
    const isJoker = jokerBtn ? jokerBtn.classList.contains('selected') : false;

    let number = null;
    if (isJoker) {
        number = 'JOKER';
    } else {
        const value = parseInt(inputEl.value, 10);
        if (isNaN(value) || value < 0 || value > 100) {
            alert('0から100の数字を入力してください');
            return;
        }
        number = value;
    }
    
    elements.submitNumbersBtn.disabled = true;
    socket.emit('submit-number', { roomId: gameState.roomId, number });
}

function handleJokerClick() {
    const inputEl = document.getElementById('player-input');
    const jokerBtn = document.getElementById('joker-btn');
    
    jokerBtn.classList.toggle('selected');

    if (jokerBtn.classList.contains('selected')) {
        inputEl.disabled = true;
        inputEl.value = '';
    } else {
        inputEl.disabled = false;
    }
}

function nextRound() {
    socket.emit('next-round', gameState.roomId);
}

// ==============================
// サーバーからのイベント受信
// ==============================
socket.on('connect', () => {
    gameState.playerId = socket.id;
});

socket.on('room-created', (room) => {
    gameState.roomId = room.id;
    UI.showScreen('lobby');
    UI.updateLobbyView(room);
});

socket.on('update-lobby', (room) => {
    UI.updateLobbyView(room);
});

socket.on('game-started', (room) => {
    gameState.players = room.players;
    elements.roundTitle.textContent = `ラウンド ${room.gameState.currentRound}`;
    UI.showScreen('game');
    UI.renderScoreboard(gameState.players);
    UI.updateRuleDisplay(gameState.players.filter(p=>p.isAlive).length, room.gameState.currentRound);
    UI.renderInputArea(handleJokerClick);
});

socket.on('next-round-started', (room) => {
    gameState.players = room.players;
    elements.roundTitle.textContent = `ラウンド ${room.gameState.currentRound}`;
    elements.submitNumbersBtn.disabled = false;
    UI.showScreen('game');
    UI.renderScoreboard(gameState.players);
    UI.updateRuleDisplay(gameState.players.filter(p=>p.isAlive).length, room.gameState.currentRound);
    UI.renderInputArea(handleJokerClick);
});

socket.on('round-result', (result) => {
    gameState.players = result.players;
    UI.showResultScreenUI(result);
});

socket.on('game-over', (winner) => {
    UI.showGameClearScreen(winner);
});

socket.on('error', (message) => {
    alert(message);
});


// ==============================
// イベントリスナー設定
// ==============================
function init() {
    elements.createRoomBtn.addEventListener('click', createRoom);
    elements.joinRoomBtn.addEventListener('click', joinRoom);
    elements.startGameBtnLobby.addEventListener('click', startGame);
    elements.submitNumbersBtn.addEventListener('click', submitNumber);
    elements.nextRoundBtn.addEventListener('click', nextRound);
    elements.playAgainBtnClear.addEventListener('click', () => location.reload());
    elements.spectateBtn.addEventListener('click', () => UI.hideOverlay('elimination'));
}

init();