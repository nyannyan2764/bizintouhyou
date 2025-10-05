const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
app.use(express.static('client'));

// --- ゲームの心臓部 ---
const rooms = {};

// 4桁のランダムなルームIDを生成する関数
function generateRoomId() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('プレイヤーが接続しました:', socket.id);

    // 【ルーム作成】
    socket.on('create-room', (playerName) => {
        const roomId = generateRoomId();
        socket.join(roomId);
        rooms[roomId] = {
            id: roomId,
            players: [{ 
                id: socket.id, 
                name: playerName, 
                score: 0, 
                isAlive: true, 
                hasUsedJoker: false,
                hasSubmitted: false 
            }],
            gameState: { currentRound: 1, inputs: {} }
        };
        socket.emit('room-created', rooms[roomId]);
    });

    // 【ルーム参加】
    socket.on('join-room', ({ playerName, roomId }) => {
        const room = rooms[roomId];
        if (room) {
            socket.join(roomId);
            room.players.push({ 
                id: socket.id, 
                name: playerName, 
                score: 0, 
                isAlive: true, 
                hasUsedJoker: false,
                hasSubmitted: false 
            });
            io.to(roomId).emit('update-lobby', room);
        } else {
            socket.emit('error', '指定されたルームが見つかりません。');
        }
    });

    // 【ゲーム開始】
    socket.on('start-game', (roomId) => {
        const room = rooms[roomId];
        if (room) {
            if (room.players.length < 2) {
                return socket.emit('error', '2人以上いないとゲームを開始できません。');
            }
            io.to(roomId).emit('game-started', room);
        }
    });

    // 【数字提出】
    socket.on('submit-number', ({ roomId, number }) => {
        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player && !player.hasSubmitted) {
            player.hasSubmitted = true;
            if (number === 'JOKER') player.hasUsedJoker = true;
            room.gameState.inputs[player.id] = number;
        }
        
        const alivePlayers = room.players.filter(p => p.isAlive);
        const allSubmitted = alivePlayers.every(p => p.hasSubmitted);

        if (allSubmitted) {
            const result = calculateResults(room);
            io.to(roomId).emit('round-result', result);
        } else {
            io.to(roomId).emit('update-submission-status', room.players.map(p => ({name: p.name, hasSubmitted: p.hasSubmitted})));
        }
    });
    
    // 【次のラウンドへ】
    socket.on('next-round', (roomId) => {
        const room = rooms[roomId];
        if(room){
            room.gameState.currentRound++;
            room.players.forEach(p => { 
                if(p.isAlive) p.hasSubmitted = false; 
            });
            const alivePlayersCount = room.players.filter(p => p.isAlive).length;
            if (alivePlayersCount <= 1) {
                io.to(roomId).emit('game-over', room.players.find(p => p.isAlive));
            } else {
                io.to(roomId).emit('next-round-started', room);
            }
        }
    });

    // 【切断処理】
    socket.on('disconnect', () => {
        console.log('プレイヤーが切断しました:', socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex > -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit('update-lobby', room);
                }
                break;
            }
        }
    });
});

server.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});


// 【結果計算ロジック】
function calculateResults(room) {
    const alivePlayers = room.players.filter(p => p.isAlive);
    const inputs = alivePlayers.map(p => ({
        name: p.name,
        number: room.gameState.inputs[p.id]
    }));
    const numberInputs = inputs.filter(p => p.number !== 'JOKER' && !isNaN(p.number));
    
    let winners = [];
    let specialRuleMessage = '';
    
    // (ここに詳細なルール判定を追加可能)

    const multiplier = alivePlayers.length <= 3 ? 1.2 : 0.8;
    let average = NaN, target = NaN;
    if (numberInputs.length > 0) {
        const total = numberInputs.reduce((sum, p) => sum + p.number, 0);
        average = total / numberInputs.length;
        target = average * multiplier;
        let minDiff = Infinity;
        numberInputs.forEach(p => {
            const diff = Math.abs(p.number - target);
            if (diff < minDiff) {
                minDiff = diff;
                winners = [p.name];
            } else if (diff === minDiff) {
                winners.push(p.name);
            }
        });
    }

    // 点数更新
    room.players.forEach(p => {
        if (p.isAlive) {
            const playerInput = room.gameState.inputs[p.id];
            if (!winners.includes(p.name) && playerInput !== 'JOKER') {
                p.score -= 1;
            }
            if (p.score <= -10) {
                p.isAlive = false;
            }
        }
    });

    return {
        inputs, average, target, winners, multiplier, specialRuleMessage,
        players: room.players,
        currentRound: room.gameState.currentRound
    };
}