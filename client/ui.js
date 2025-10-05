import { gameState } from './state.js';

const elements = {
    // Screen containers
    screens: {
        home: document.getElementById('home-screen'),
        lobby: document.getElementById('lobby-screen'),
        game: document.getElementById('game-screen'),
        result: document.getElementById('result-screen'),
        gameClear: document.getElementById('game-clear-screen'),
        elimination: document.getElementById('elimination-screen'),
    },
    // Home screen elements
    playerNameInputHome: document.getElementById('player-name-input-home'),
    createRoomBtn: document.getElementById('create-room-btn'),
    roomIdInput: document.getElementById('room-id-input'),
    joinRoomBtn: document.getElementById('join-room-btn'),
    // Lobby screen elements
    lobbyRoomId: document.getElementById('lobby-room-id'),
    lobbyPlayerCount: document.getElementById('lobby-player-count'),
    lobbyPlayerList: document.getElementById('lobby-player-list'),
    startGameBtnLobby: document.getElementById('start-game-btn-lobby'),
    // Game screen elements
    roundTitle: document.getElementById('round-title'),
    currentRule: document.getElementById('current-rule'),
    scoreboard: document.getElementById('scoreboard'),
    inputArea: document.getElementById('input-area'),
    submitNumbersBtn: document.getElementById('submit-numbers-btn'),
    // Result screen elements
    resultRoundTitle: document.getElementById('result-round-title'),
    chosenNumbers: document.getElementById('chosen-numbers'),
    averageValue: document.getElementById('average-value'),
    targetCalculationText: document.getElementById('target-calculation-text'),
    roundWinner: document.getElementById('round-winner'),
    resultScoreboard: document.getElementById('result-scoreboard'),
    nextRoundBtn: document.getElementById('next-round-btn'),
    // Other elements
    finalWinner: document.getElementById('final-winner'),
    eliminatedPlayerName: document.getElementById('eliminated-player-name'),
    playAgainBtnClear: document.getElementById('play-again-btn-clear'),
    spectateBtn: document.getElementById('spectate-btn'),
};

export function showScreen(screenName) {
    Object.values(elements.screens).forEach(screen => {
        if (screen && !screen.classList.contains('overlay')) {
            screen.classList.remove('active');
        }
    });
    if (elements.screens[screenName]) {
        elements.screens[screenName].classList.add('active');
    }
}

export function showOverlay(screenName) {
    const screen = elements.screens[screenName];
    if (screen && screen.classList.contains('overlay')) {
        screen.classList.add('active');
    }
}

export function hideOverlay(screenName) {
    const screen = elements.screens[screenName];
    if (screen && screen.classList.contains('overlay')) {
        screen.classList.remove('active');
    }
}

export function updateLobbyView(room) {
    elements.lobbyRoomId.textContent = room.id;
    elements.lobbyPlayerCount.textContent = room.players.length;
    elements.lobbyPlayerList.innerHTML = '';
    room.players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.name;
        elements.lobbyPlayerList.appendChild(li);
    });
    const amIHost = gameState.playerId === room.players[0].id;
    elements.startGameBtnLobby.style.display = amIHost ? 'block' : 'none';
    elements.startGameBtnLobby.disabled = room.players.length < 2;
}

export function renderScoreboard(players) {
    elements.scoreboard.innerHTML = '';
    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'score-card';
        if (!player.isAlive) card.classList.add('eliminated');
        card.innerHTML = `<div class="name">${player.name}</div><div class="score">${player.score}</div>`;
        elements.scoreboard.appendChild(card);
    });
}

export function renderInputArea(onJokerClick) {
    elements.inputArea.innerHTML = '';
    const me = gameState.players.find(p => p.id === gameState.playerId);
    if (!me || !me.isAlive) {
        elements.inputArea.innerHTML = '<p class="spectator-message">観戦中です...</p>';
        elements.submitNumbersBtn.style.display = 'none';
        return;
    };

    elements.submitNumbersBtn.style.display = 'block';

    const container = document.createElement('div');
    container.className = 'player-input-container is-controllable';

    const group = document.createElement('div');
    group.className = 'player-input-group';
    
    group.innerHTML = `
        <label for="player-input">${me.name}:</label>
        <input type="password" id="player-input" required placeholder="0-100" autocomplete="off" inputmode="numeric" pattern="[0-9]*">
        <button id="joker-btn" class="joker-btn" ${me.hasUsedJoker ? 'disabled' : ''}>
            ${me.hasUsedJoker ? '使用済み' : 'JOKER'}
        </button>
    `;
    container.appendChild(group);
    elements.inputArea.appendChild(container);
    
    const jokerBtn = document.getElementById('joker-btn');
    if (jokerBtn && !jokerBtn.disabled) {
        jokerBtn.addEventListener('click', onJokerClick);
    }
}

export function updateRuleDisplay(aliveCount, currentRound) {
    elements.currentRule.textContent = 'ルール読み込み中...'; // Default text
    if (aliveCount === 4 && currentRound >= 5) {
        elements.currentRule.textContent = 'ルール追加：ターゲットが素数だった場合、その数字を提出した者は無条件で勝利。他は-2点。';
    } else if (aliveCount === 2) {
        elements.currentRule.textContent = 'ルール追加：0と100が選択された場合、100の勝利。';
    } else if (aliveCount <= 3) {
        elements.currentRule.textContent = 'ルール追加】：同数投票は全員減点。ターゲット完全一致で他全員-2点。';
    } else {
        elements.currentRule.textContent = '基本ルール：ターゲット倍率は 0.8';
    }
}

export function showResultScreenUI(result) {
    showScreen('result');
    elements.resultRoundTitle.textContent = `ラウンド ${result.currentRound} 結果`;
    
    elements.chosenNumbers.textContent = result.inputs.map(p => {
        const numberDisplay = p.number === 'JOKER' ? 'JOKER' : (isNaN(p.number) ? '未入力' : p.number);
        return `${p.name}: ${numberDisplay}`;
    }).join(' / ');
    
    if (result.specialRuleMessage) {
        elements.averageValue.textContent = '---';
        elements.targetCalculationText.innerHTML = `<strong>${result.specialRuleMessage}</strong>`;
    } else if (isNaN(result.average)) {
        elements.averageValue.textContent = '計算不能';
        elements.targetCalculationText.innerHTML = `ターゲット: ---`;
    } else {
        elements.averageValue.textContent = result.average.toFixed(3);
        elements.targetCalculationText.innerHTML = `ターゲット (平均値 × ${result.multiplier}): <strong>${result.target.toFixed(3)}</strong>`;
    }
    
    elements.roundWinner.textContent = result.winners.length > 0 ? `勝者: ${result.winners.join(', ')}` : '勝者なし';
    
    // Create scoreboard in the result screen context
    const resultScoreboardContainer = document.getElementById('result-scoreboard');
    resultScoreboardContainer.innerHTML = '';
     result.players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'score-card';
        if (!player.isAlive) card.classList.add('eliminated');
        card.innerHTML = `<div class="name">${player.name}</div><div class="score">${player.score}</div>`;
        resultScoreboardContainer.appendChild(card);
    });
    
    if (result.winners.length > 0) {
        const cards = resultScoreboardContainer.querySelectorAll('.score-card');
        cards.forEach(card => {
            const nameEl = card.querySelector('.name');
            if (nameEl && result.winners.includes(nameEl.textContent)) {
                card.classList.add('winner');
            }
        });
    }
}

export function showGameClearScreen(winnerPlayer) {
    showScreen('gameClear');
    elements.finalWinner.textContent = winnerPlayer ? `最終勝者: ${winnerPlayer.name}` : "生存者なし";
}

export function showEliminationScreenUI(eliminatedNames) {
    elements.eliminatedPlayerName.textContent = eliminatedNames.join(', ');
    showOverlay('elimination');
}

export default elements;