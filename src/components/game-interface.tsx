"use client"

import { useState, useEffect, useCallback } from 'react'
import { Socket, io } from 'socket.io-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getGameState } from '@/lib/api'

interface GameInterfaceProps {
  gameId: string;
  gameMode: 'SOLO' | 'MULTIPLAYER' | 'PRIVATE' | 'COMPETITIVE_POT';
}

export default function GameInterface({ gameId, gameMode }: GameInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [guess, setGuess] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('joinGame', { gameId, userId: localStorage.getItem('userId') });

    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    newSocket.on('correctGuess', ({ userId, score }) => {
      // Handle correct guess
    });

    newSocket.on('gameEnd', ({ winner, finalScores }) => {
      // Handle game end
    });

    return () => {
      newSocket.close();
    };
  }, [gameId]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && guess.trim()) {
      socket.emit('submitGuess', {
        gameId,
        userId: localStorage.getItem('userId'),
        guess
      });
      setGuess("");
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && chatInput.trim()) {
      socket.emit('chat', {
        gameId,
        userId: localStorage.getItem('userId'),
        message: chatInput
      });
      setChatInput("");
    }
  };

  if (!gameState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Topic: {gameState.topic}</CardTitle>
                <div className="text-lg font-bold">Time Left: {gameState.timeLeft}s</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-200 mb-4 relative">
                <img
                  src={`data:image/jpeg;base64,${gameState.image}`}
                  alt="Mystery Image"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                  Phase {gameState.phase} - {gameState.imageReveal}% Revealed
                </div>
              </div>
              <Progress value={gameState.imageReveal} className="mb-4" />
              <form onSubmit={handleGuessSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your guess"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                />
                <Button type="submit">Guess</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {gameMode === 'COMPETITIVE_POT' && (
            <Card>
              <CardHeader>
                <CardTitle>Pot Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${gameState.potAmount?.toFixed(2)}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Scoreboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {gameState.players.map((player: any) => (
                  <li key={player.user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={player.user.avatar} alt={player.user.username} />
                        <AvatarFallback>{player.user.username[0]}</AvatarFallback>
                      </Avatar>
                      <span>{player.user.username}</span>
                    </div>
                    <span>{player.score} pts</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                {chatMessages.map((msg: any, index) => (
                  <div key={index} className="text-sm mb-2">
                    <strong>{msg.player}:</strong> {msg.message}
                  </div>
                ))}
              </ScrollArea>
              <form onSubmit={handleChatSubmit} className="flex gap-2 mt-4">
                <Input
                  type="text"
                  placeholder="Type a message"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button type="submit">Send</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}