import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/utils';
import { User, Mail, Phone, Calendar, Wallet, Gamepad2 } from 'lucide-react';
import { ApiListResponse, Session } from '@/types';

export default function ProfilePage() {
  const { user } = useAuthStore();

  // Fetch session history
  const { data: sessionsData } = useQuery({
    queryKey: ['sessionHistory'],
    queryFn: async () => {
      const response = await api.get<ApiListResponse<Session>>('/sessions/history?limit=10');
      return response.data.data;
    },
  });

  const totalSpent = sessionsData?.reduce((sum, session) => sum + session.totalCost, 0) || 0;
  const totalTime = sessionsData?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          View your account information and gaming history
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-semibold text-lg">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {user?.createdAt && formatDateTime(user.createdAt).split(',')[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user?.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(user?.wallet?.balance || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Gamepad2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Play Time</p>
                <p className="text-2xl font-bold mt-2">
                  {formatDuration(totalTime)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Gamepad2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Gaming Sessions</CardTitle>
          <CardDescription>Your recent gaming activity</CardDescription>
        </CardHeader>
        <CardContent>
          {!sessionsData || sessionsData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sessions yet
            </p>
          ) : (
            <div className="space-y-3">
              {sessionsData.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-accent rounded-full">
                      <Gamepad2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{session.room?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(session.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(session.totalCost)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(session.duration || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
