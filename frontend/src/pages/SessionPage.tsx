import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSessionStore } from '@/store/sessionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDuration, calculateSessionCost } from '@/lib/utils';
import { Gamepad2, Clock, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { ApiResponse, Session } from '@/types';

export default function SessionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeSession, setActiveSession } = useSessionStore();
  const [currentCost, setCurrentCost] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);

  // Fetch active session
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['activeSession'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Session>>('/sessions/active');
      return response.data.data;
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (sessionData) {
      setActiveSession(sessionData);
    }
  }, [sessionData, setActiveSession]);

  // Update session cost every second
  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        const { duration, cost } = calculateSessionCost(
          activeSession.startTime,
          activeSession.costPerMinute
        );
        setCurrentDuration(duration);
        setCurrentCost(cost);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession]);

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error('No active session');
      const response = await api.post<ApiResponse<Session>>(
        `/sessions/${activeSession.id}/end`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setActiveSession(null);
      toast({
        title: 'Session Ended',
        description: `Total cost: ${formatCurrency(data.data.totalCost)}`,
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to end session',
        description: error.response?.data?.error || 'Please try again',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Session</CardTitle>
          <CardDescription>You don't have any active gaming session</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/rooms')}>Browse Rooms</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Active Gaming Session</h1>
        <p className="text-muted-foreground mt-1">
          Room: {activeSession.room?.name} ({activeSession.room?.roomNumber})
        </p>
      </div>

      {/* Session Timer Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">
              {formatDuration(currentDuration)}
            </div>
            <div className="text-2xl font-semibold text-gray-700">
              Current Cost: {formatCurrency(currentCost)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(activeSession.costPerMinute)} per minute
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Details */}
      <Card>
        <CardHeader>
          <CardTitle>Room Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Room Number</p>
              <p className="font-semibold">{activeSession.room?.roomNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Room Name</p>
              <p className="font-semibold">{activeSession.room?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Console</p>
              <p className="font-semibold">{activeSession.room?.consoleType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="font-semibold">Up to {activeSession.room?.capacity}</p>
            </div>
          </div>

          {activeSession.room?.amenities && activeSession.room.amenities.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {activeSession.room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            End Session
          </CardTitle>
          <CardDescription>
            You will be charged for the duration of your session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>Current Duration: <strong>{formatDuration(currentDuration)}</strong></p>
            <p>Current Cost: <strong>{formatCurrency(currentCost)}</strong></p>
            <p className="text-muted-foreground">
              This amount will be deducted from your wallet
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => endSessionMutation.mutate()}
            disabled={endSessionMutation.isPending}
            className="w-full"
            size="lg"
          >
            {endSessionMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            End Session & Pay
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/menu')}
          className="w-full"
        >
          Order Food & Drinks
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/orders')}
          className="w-full"
        >
          View My Orders
        </Button>
      </div>
    </div>
  );
}
