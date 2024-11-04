import { Server, Socket } from 'socket.io';
import { Game } from '../models/Game';
import { User } from '../models/User';

interface LobbyState {
  players: {
    id: string;
    username: string;
    avatar: string;
    isHost: boolean;
  }[];
}

const lobbies = new Map<string, LobbyState>();

export const setupLobbySocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    socket.on('joinLobby', async ({ gameCode, userId }) => {
      try {
        const game = await Game.findOne({ gameCode }).populate('host');
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const user = await User.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        socket.join(gameCode);

        if (!lobbies.has(gameCode)) {
          lobbies.set(gameCode, {
            players: [{
              id: game.host._id.toString(),
              username: game.host.username,
              avatar: game.host.avatar,
              isHost: true
            }]
          });
        }

        const lobby = lobbies.get(gameCode)!;
        if (!lobby.players.find(p => p.id === userId)) {
          lobby.players.push({
            id: userId,
            username: user.username,
            avatar: user.avatar,
            isHost: game.host._id.toString() === userId
          });
        }

        io.to(gameCode).emit('lobbyUpdate', lobby.players);
      } catch (error) {
        socket.emit('error', { message: 'Error joining lobby' });
      }
    });

    socket.on('startGame', async ({ gameCode }) => {
      try {
        const game = await Game.findOne({ gameCode });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        game.status = 'IN_PROGRESS';
        game.startTime = new Date();
        await game.save();

        io.to(gameCode).emit('gameStart', { gameId: game._id });
        lobbies.delete(gameCode);
      } catch (error) {
        socket.emit('error', { message: 'Error starting game' });
      }
    });

    socket.on('leaveLobby', async ({ gameCode, userId }) => {
      try {
        const lobby = lobbies.get(gameCode);
        if (lobby) {
          lobby.players = lobby.players.filter(p => p.id !== userId);
          if (lobby.players.length === 0) {
            lobbies.delete(gameCode);
          } else {
            io.to(gameCode).emit('lobbyUpdate', lobby.players);
          }
        }
        socket.leave(gameCode);
      } catch (error) {
        socket.emit('error', { message: 'Error leaving lobby' });
      }
    });
  });
};