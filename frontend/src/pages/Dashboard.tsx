import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDuration, calculateSessionCost } from '@/lib/utils';
import { Wallet, Gamepad2, ShoppingBag, Clock, DollarSign } from 'lucide-react';
import { ApiResponse, Session } from '@/types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { activeSession, setActiveSession, updateSessionCost } = useSessionStore();
  const [currentCost, setCurrentCost] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);

  // Fetch active session
  const { data: sessionData } = useQuery({
    queryKey: ['activeSession'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Session>>('/sessions/active');
      return response.data.data;
    },
    refetchInterval: activeSession ? 10000 : false, // Refetch every 10 seconds if there's an active session
  });

  useEffect(() => {
    if (sessionData) {
      setActiveSession(sessionData);
    } else {
      setActiveSession(null);
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
        updateSessionCost(duration, cost);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession, updateSessionCost]);

  const stats = [
    {
      title: 'Wallet Balance',
      value: formatCurrency(user?.wallet?.balance || 0),
      icon: Wallet,
      link: '/wallet',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Active Session',
      value: activeSession ? 'In Progress' : 'None',
      icon: Gamepad2,
      link: activeSession ? '/session' : '/rooms',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Session Time',
      value: activeSession ? formatDuration(currentDuration) : '-',
      icon: Clock,
      link: '/session',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Current Cost',
      value: activeSession ? formatCurrency(currentCost) : '-',
      icon: DollarSign,
      link: '/session',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {activeSession
            ? 'You have an active gaming session'
            : 'Ready to start gaming?'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.link}>
              <Card className="card-hover cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.bg} ${stat.color} p-3 rounded-full`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Active Session Card */}
      {activeSession && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Active Gaming Session
            </CardTitle>
            <CardDescription>
              Room: {activeSession.room?.name} ({activeSession.room?.roomNumber})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">{formatDuration(currentDuration)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Cost</p>
                <p className="text-lg font-semibold">{formatCurrency(currentCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rate</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(activeSession.costPerMinute)}/min
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Console</p>
                <p className="text-lg font-semibold">{activeSession.room?.consoleType}</p>
              </div>
            </div>
            <Link to="/session">
              <Button className="w-full">View Session Details</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Browse Rooms
            </CardTitle>
            <CardDescription>
              Find and book your perfect gaming room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/rooms">
              <Button className="w-full">View Rooms</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Food & Drinks
            </CardTitle>
            <CardDescription>
              Browse our menu and order to your room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/menu">
              <Button className="w-full">View Menu</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Manage Wallet
            </CardTitle>
            <CardDescription>
              Add funds and view transaction history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/wallet">
              <Button className="w-full">Open Wallet</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Low Balance Warning */}
      {user?.wallet && user.wallet.balance < 1000 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Low Balance</CardTitle>
            <CardDescription className="text-orange-700">
              Your wallet balance is low. Add funds to continue gaming.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/wallet">
              <Button variant="outline">Add Funds</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
