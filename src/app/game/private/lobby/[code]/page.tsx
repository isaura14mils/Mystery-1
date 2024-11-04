"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Socket, io } from 'socket.io-client'

interface Player {
  id: string;
  username: string;
  avatar: string;
  isHost: boolean;
}

export default function GameLobby({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('joinLobby', {
      gameCode: params.code,
      userId: localStorage.getItem('userId')
    });

    newSocket.on('lobbyUpdate', (updatedPlayers) => {
      setPlayers(updatedPlayers);
      // Check if current user is host
      const userId = localStorage.getItem('userId');
      setIsHost(updatedPlayers.find(p => p.id === userId)?.isHost || false);
    });

    newSocket.on('gameStart', ({ gameId }) => {
      router.push(`/game/private/${gameId}`);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      newSocket.close();
    };
  }, [params.code, router]);

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame', { gameCode: params.code });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(params.code);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Game Lobby</span>
            <Button variant="outline" onClick={handleCopyCode}>
              Copy Code: {params.code}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Players</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <Avatar>
                      <AvatarImage src={player.avatar} alt={player.username} />
                      <AvatarFallback>{player.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{player.username}</p>
                      {player.isHost && (
                        <span className="text-sm text-gray-500">Host</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/menu')}
              >
                Leave Lobby
              </Button>
              {isHost && (
                <Button
                  className="w-full"
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                >
                  Start Game
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}