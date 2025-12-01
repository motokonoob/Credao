import { useState, useMemo } from 'react';
import { useGetUserAlerts, useGetAllCrops, useGetAllGardens } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Bell, Sprout, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Crop, Garden } from '../backend';

interface CropEvent {
  crop: Crop;
  garden: Garden | null;
  isHarvestReady: boolean;
}

export default function Calendar() {
  const { data: alerts = [], isLoading: alertsLoading } = useGetUserAlerts();
  const { data: crops = [], isLoading: cropsLoading } = useGetAllCrops();
  const { data: gardens = [] } = useGetAllGardens();

  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const upcomingHarvests = crops
    .map((crop) => ({
      ...crop,
      daysUntil: getDaysUntil(crop.harvestDate),
    }))
    .filter((crop) => crop.daysUntil >= 0 && crop.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Group crops by harvest date
  const cropsByDate = useMemo(() => {
    const map = new Map<string, CropEvent[]>();
    
    crops.forEach((crop) => {
      const harvestDate = new Date(Number(crop.harvestDate) / 1000000);
      const dateKey = `${harvestDate.getFullYear()}-${harvestDate.getMonth()}-${harvestDate.getDate()}`;
      
      const garden = gardens.find((g) => g.id === crop.gardenId) || null;
      const isHarvestReady = crop.stage === 'harvest-ready';
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push({ crop, garden, isHarvestReady });
    });
    
    return map;
  }, [crops, gardens]);

  const getCropsForDay = (day: number): CropEvent[] => {
    const dateKey = `${year}-${month}-${day}`;
    return cropsByDate.get(dateKey) || [];
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  if (alertsLoading || cropsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Calendar & Reminders</h2>
        <p className="text-muted-foreground">Track upcoming harvests and care reminders</p>
      </div>

      {/* Interactive Visual Calendar */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle>Harvest Schedule</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[180px] text-center font-medium">{monthName}</span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            <span className="inline-flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                Ready Now
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-orange-500" />
                Available Soon
              </span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square p-1" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const cropsForDay = getCropsForDay(day);
              const hasEvents = cropsForDay.length > 0;
              const today = isToday(day);

              return (
                <Popover key={day}>
                  <PopoverTrigger asChild>
                    <button
                      className={`aspect-square rounded-lg border p-1 text-left transition-colors hover:bg-accent ${
                        today ? 'border-primary bg-primary/5' : 'border-border'
                      } ${hasEvents ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex h-full flex-col">
                        <span
                          className={`text-sm font-medium ${
                            today ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {day}
                        </span>
                        {hasEvents && (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {cropsForDay.slice(0, 3).map((event, idx) => (
                              <div
                                key={idx}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  event.isHarvestReady ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                              />
                            ))}
                            {cropsForDay.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{cropsForDay.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  {hasEvents && (
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-2">
                        <h4 className="font-semibold">
                          Harvests on {month + 1}/{day}/{year}
                        </h4>
                        <div className="space-y-2">
                          {cropsForDay.map((event, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 rounded-md border p-2"
                            >
                              <div
                                className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                                  event.isHarvestReady ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{event.crop.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {event.crop.species}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Stage: <span className="capitalize">{event.crop.stage}</span>
                                </p>
                                {event.garden && (
                                  <p className="text-xs text-muted-foreground">
                                    Garden: {event.garden.name}
                                  </p>
                                )}
                                <Badge
                                  variant={event.isHarvestReady ? 'default' : 'secondary'}
                                  className="mt-1"
                                >
                                  {event.isHarvestReady ? 'Ready Now' : 'Available Soon'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Harvests */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Harvests</CardTitle>
            </div>
            <CardDescription>Crops ready for harvest in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHarvests.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Sprout className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No upcoming harvests in the next 30 days</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingHarvests.map((crop) => (
                  <div
                    key={crop.id.toString()}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{crop.name}</p>
                      <p className="text-sm text-muted-foreground">{crop.species}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(crop.harvestDate)}
                      </p>
                    </div>
                    <Badge variant={crop.daysUntil <= 7 ? 'default' : 'secondary'}>
                      {crop.daysUntil === 0
                        ? 'Today'
                        : crop.daysUntil === 1
                        ? '1 day'
                        : `${crop.daysUntil} days`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Alerts & Reminders</CardTitle>
            </div>
            <CardDescription>Important notifications and care reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No alerts at this time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Alert key={alert.id.toString()}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="capitalize">{alert.alertType}</AlertTitle>
                    <AlertDescription>
                      {alert.message}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(alert.createdAt)}
                      </span>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Growth Overview</CardTitle>
          <CardDescription>Track your crops' progress throughout the season</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Total Crops</p>
              <p className="mt-2 text-3xl font-bold">{crops.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Ready to Harvest</p>
              <p className="mt-2 text-3xl font-bold">
                {crops.filter((c) => getDaysUntil(c.harvestDate) <= 0).length}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Growing</p>
              <p className="mt-2 text-3xl font-bold">
                {crops.filter((c) => c.stage.toLowerCase().includes('growing')).length}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Upcoming (30d)</p>
              <p className="mt-2 text-3xl font-bold">{upcomingHarvests.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
