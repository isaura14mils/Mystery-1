import { Server, Socket } from 'socket.io';
import { Game } from '../models/Game';
import { User } from '../models/User';

interface GameState {
  gameId: string;
  phase: number;
  imageReveal: number;
  timeLeft: number;
  players: any[];
}

const games = new Map<string, GameState>();

export const setupGameSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinGame', async ({ gameId, userId }) => {
      try {
        const game = await Game.findById(gameId).populate('players.user');
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        socket.join(gameId);
        
        if (!games.has(gameId)) {
          games.set(gameId, {
            gameId,
            phase: 1,
            imageReveal: 0,
            timeLeft: 15,
            players: game.players
          });

          startGameTimer(io, gameId);
        }

        socket.emit('gameState', games.get(gameId));
      } catch (error) {
        socket.emit('error', { message: 'Error joining game' });
      }
    });

    socket.on('submitGuess', async ({ gameId, userId, guess }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return;

        const gameState = games.get(gameId);
        if (!gameState) return;

        // Validate guess and update scores
        const isCorrect = validateGuess(guess, game.image.answer);
        if (isCorrect) {
          const score = calculateScore(gameState.phase);
          await updatePlayerScore(game, userId, score);
          
          io.to(gameId).emit('correctGuess', {
            userId,
            score
          });

          if (game.gameMode === 'COMPETITIVE_POT') {
            await handlePotWin(game, userId);
          }
        }

        await game.save();
      } catch (error) {
        socket.emit('error', { message: 'Error processing guess' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

const startGameTimer = (io: Server, gameId: string) => {
  const interval = setInterval(async () => {
    const gameState = games.get(gameId);
    if (!gameState) {
      clearInterval(interval);
      return;
    }

    gameState.timeLeft--;

    if (gameState.timeLeft === 0) {
      gameState.phase++;
      gameState.imageReveal = Math.min((gameState.phase - 1) * 10, 90);
      gameState.timeLeft = gameState.phase === 1 ? 10 : 15;

      if (gameState.phase > 10) {
        clearInterval(interval);
        await endGame(io, gameId);
        return;
      }
    }

    io.to(gameId).emit('gameState', gameState);
  }, 1000);
};

const validateGuess = (guess: string, answer: string): boolean => {
  return guess.toLowerCase().trim() === answer.toLowerCase().trim();
};

const calculateScore = (phase: number): number => {
  return Math.max(0, 100 - (phase - 1) * 10);
};

const updatePlayerScore = async (game: any, userId: string, score: number) => {
  const playerIndex = game.players.findIndex(
    (p: any) => p.user.toString() === userId
  );
  if (playerIndex !== -1) {
    game.players[playerIndex].score += score;
  }
};

const handlePotWin = async (game: any, userId: string) => {
  game.winner = userId;
  game.status = 'COMPLETED';
  
  const winner = await User.findById(userId);
  if (winner) {
    winner.wallet.balance += game.potAmount * 0.95; // 5% fee
    winner.wallet.transactions.push({
      type: 'POT_WIN',
      amount: game.potAmount * 0.95
    });
    await winner.save();
  }
};

const endGame = async (io: Server, gameId: string) => {
  const game = await Game.findById(gameId);
  if (!game) return;

  game.status = 'COMPLETED';
  game.endTime = new Date();
  await game.save();

  io.to(gameId).emit('gameEnd', {
    winner: game.winner,
    finalScores: game.players
  });

  games.delete(gameId);
};