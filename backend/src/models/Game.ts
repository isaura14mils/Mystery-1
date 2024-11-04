import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  gameCode: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  wordCount: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  image: {
    url: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  },
  gameMode: {
    type: String,
    enum: ['SOLO', 'MULTIPLAYER', 'PRIVATE', 'COMPETITIVE_POT'],
    required: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'WAITING'
  },
  currentPhase: {
    type: Number,
    default: 1
  },
  imageRevealPercentage: {
    type: Number,
    default: 0
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      default: 0
    },
    guesses: [{
      guess: String,
      phase: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  potAmount: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: Date,
  endTime: Date
}, {
  timestamps: true
});

export const Game = mongoose.model('Game', gameSchema);