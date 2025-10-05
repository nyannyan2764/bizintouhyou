export const gameState = {
    players: [],
    currentRound: 1,
    jokerSelections: {},
    totalPlayers: 3,

    /**
     * 現在デバイスを操作しているプレイヤーの名前を保持する
     * ラウンド開始時にnullにリセットされ、プレイヤー選択時に設定される
     */
    currentUser: null, 
};