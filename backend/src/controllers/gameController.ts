import { Request, Response } from 'express';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { ImageService } from '../services/imageService';
import { generateGameCode } from '../utils/gameUtils';

export class GameController {
  private imageService: ImageService;

  constructor() {
    this.imageService = new ImageService();
  }

  async createGame(req: Request, res: Response) {
    try {
      const { topic, wordCount, gameMode } = req.body;
      const hostId = req.user.id;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({ message: 'Image is required' });
      }

      const imageUrl = await this.imageService.uploadImage(imageFile);
      const gameCode = generateGameCode();

      const game = new Game({
        gameCode,
        host: hostId,
        topic,
        wordCount,
        gameMode,
        image: {
          url: imageUrl,
          answer: req.body.answer
        },
        players: [{
          user: hostId,
          score: 0
        }]
      });

      if (gameMode === 'COMPETITIVE_POT') {
        const entryFee = 10; // Example entry fee
        const host = await User.findById(hostId);
        
        if (host.wallet.balance < entryFee) {
          return res.status(400).json({ message: 'Insufficient funds' });
        }

        host.wallet.balance -= entryFee;
        host.wallet.transactions.push({
          type: 'POT_ENTRY',
          amount: -entryFee
        });
        await host.save();

        game.potAmount = entryFee;
      }

      await game.save();
      res.status(201).json({ gameCode });
    } catch (error) {
      res.status(500).json({ message: 'Error creating game', error });
    }
  }

  async joinGame(req: Request, res: Response) {
    try {
      const { gameCode } = req.body;
      const userId = req.user.id;

      const game = await Game.findOne({ gameCode });
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      if (game.status !== 'WAITING') {
        return res.status(400).json({ message: 'Game already in progress' });
      }

      if (game.gameMode === 'COMPETITIVE_POT') {
        const entryFee = 10; // Example entry fee
        const user = await User.findById(userId);
        
        if (user.wallet.balance < entryFee) {
          return res.status(400).json({ message: 'Insufficient funds' });
        }

        user.wallet.balance -= entryFee;
        user.wallet.transactions.push({
          type: 'POT_ENTRY',
          amount: -entryFee
        });
        await user.save();

        game.potAmount += entryFee;
      }

      game.players.push({
        user: userId,
        score: 0
      });

      await game.save();
      res.status(200).json({ message: 'Joined game successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error joining game', error });
    }
  }

  async getGameState(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const game = await Game.findById(gameId)
        .populate('players.user', 'username avatar')
        .populate('winner', 'username');

      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const revealedImage = await this.imageService.generateRevealedImage(
        game.image.url,
        game.imageRevealPercentage
      );

      res.status(200).json({
        gameState: {
          topic: game.topic,
          phase: game.currentPhase,
          imageReveal: game.imageRevealPercentage,
          players: game.players,
          potAmount: game.potAmount,
          status: game.status,
          winner: game.winner
        },
        image: revealedImage.toString('base64')
      });
    } catch (error) {
      res.status(500).json({ message: 'Error getting game state', error });
    }
  }
}