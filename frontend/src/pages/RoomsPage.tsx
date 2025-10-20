import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { QrScanner } from '@yudiel/react-qr-scanner';
import { Gamepad2, Users, Tv, QrCode, Loader2 } from 'lucide-react';
import { ApiListResponse, Room, ApiResponse, Session } from '@/types';

export default function RoomsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch rooms
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get<ApiListResponse<Room>>('/rooms');
      return response.data.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await api.post<ApiResponse<Session>>('/sessions/start', { roomId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: 'Session Started!',
        description: 'Enjoy your gaming session',
      });
      navigate('/session');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to start session',
        description: error.response?.data?.error || 'Please try again',
      });
    },
  });

  const handleQRCodeScan = async (result: string) => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    setShowScanner(false);

    try {
      const response = await api.post<ApiResponse<{ room: Room }>>('/rooms/verify-qr', {
        qrCode: result,
      });
      
      const room = response.data.data.room;
      startSessionMutation.mutate(room.id);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Invalid QR Code',
        description: error.response?.data?.error || 'Please scan a valid room QR code',
      });
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'OCCUPIED':
        return <Badge className="bg-red-500">Occupied</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-yellow-500">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gaming Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Choose your room and scan the QR code to start
          </p>
        </div>
        <Button onClick={() => setShowScanner(true)} size="lg">
          <QrCode className="mr-2 h-5 w-5" />
          Scan QR Code
        </Button>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomsData?.map((room) => (
          <Card
            key={room.id}
            className={`card-hover ${
              room.status === 'AVAILABLE'
                ? 'border-green-200'
                : 'opacity-75'
            }`}
          >
            {/* Room Image */}
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              <img
                src={room.imageUrl || 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8'}
                alt={room.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                {getStatusBadge(room.status)}
              </div>
              <div className="absolute top-4 left-4">
                <Badge variant="secondary">{room.roomNumber}</Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                {room.name}
              </CardTitle>
              <CardDescription>{room.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Room Details */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tv className="h-4 w-4" />
                  {room.consoleType}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Up to {room.capacity}
                </div>
              </div>

              {/* Amenities */}
              {room.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {room.amenities.slice(0, 3).map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {room.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{room.amenities.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(room.pricePerMinute)}/min
              </div>

              {/* Action Button */}
              <Button
                className="w-full"
                onClick={() => setSelectedRoom(room)}
                disabled={room.status !== 'AVAILABLE'}
              >
                {room.status === 'AVAILABLE' ? 'View Details' : 'Not Available'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Details Dialog */}
      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              {selectedRoom?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedRoom?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-4">
              <img
                src={selectedRoom.imageUrl || 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8'}
                alt={selectedRoom.name}
                className="w-full h-64 object-cover rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Console</p>
                  <p className="font-semibold">{selectedRoom.consoleType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-semibold">Up to {selectedRoom.capacity} people</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-semibold">{formatCurrency(selectedRoom.pricePerMinute)}/min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRoom.status)}
                </div>
              </div>

              {selectedRoom.amenities.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setSelectedRoom(null);
                  setShowScanner(true);
                }}
                disabled={selectedRoom.status !== 'AVAILABLE'}
              >
                <QrCode className="mr-2 h-5 w-5" />
                Scan QR Code to Start
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Room QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at the QR code next to the room door
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            {showScanner && (
              <QrScanner
                onDecode={handleQRCodeScan}
                onError={(error) => console.error(error)}
              />
            )}
          </div>
          {isVerifying && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
