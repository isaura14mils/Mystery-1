"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserProfile } from '@/lib/api'

export default function GameMenu() {
  const router = useRouter();
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [gameCode, setGameCode] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)

  const handleHostGame = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/game/private/host')
  }

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/game/private/join?code=${gameCode}`)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userProfile?.avatar} alt={userProfile?.username} />
            <AvatarFallback>{userProfile?.username?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{userProfile?.username}</h2>
            <p className="text-gray-600">
              Level {userProfile?.level} | {userProfile?.points} Points
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Solo Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Practice your skills in single-player mode.</p>
            <Button className="w-full" onClick={() => router.push('/game/solo')}>
              Play Solo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multiplayer Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Join a game with random players online.</p>
            <Button className="w-full" onClick={() => router.push('/game/multiplayer')}>
              Quick Play
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Private Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Host or join a private game with friends.</p>
            <div className="space-y-2">
              <Dialog open={isHostDialogOpen} onOpenChange={setIsHostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Host Game</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Host a Private Game</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleHostGame} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input id="topic" placeholder="Enter a topic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wordCount">Word Count for Guesses</Label>
                      <Input id="wordCount" type="number" placeholder="Enter word count" />
                    </div>
                    <Button type="submit">Create Game</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">Join Game</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a Private Game</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleJoinGame} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gameCode">Game Code</Label>
                      <Input
                        id="gameCode"
                        placeholder="Enter game code"
                        value={gameCode}
                        onChange={(e) => setGameCode(e.target.value)}
                      />
                    </div>
                    <Button type="submit">Join Game</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competitive Pot Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Play for real stakes in our competitive mode.</p>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => router.push('/game/competitive-pot')}
            >
              Enter Pot Game
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}