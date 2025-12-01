import { useState, useEffect } from 'react';
import { useGetAllGardens, useCreateGarden, useGetAllCrops } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MapPin } from 'lucide-react';
import GardenMap from '../components/GardenMap';
import GardenGridView from '../components/GardenGridView';
import CreateGardenDialog from '../components/CreateGardenDialog';
import type { Garden } from '../backend';

export default function GardenGrid() {
  const { data: gardens = [], isLoading } = useGetAllGardens();
  const { data: crops = [] } = useGetAllCrops();
  const [selectedGarden, setSelectedGarden] = useState<Garden | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (gardens.length > 0 && !selectedGarden) {
      setSelectedGarden(gardens[0]);
    }
  }, [gardens, selectedGarden]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading gardens...</p>
          </div>
        </div>
      </div>
    );
  }

  if (gardens.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No Gardens Yet</CardTitle>
            <CardDescription>
              Create your first garden by drawing its boundaries on the map
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Garden
            </Button>
          </CardContent>
        </Card>

        <CreateGardenDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    );
  }

  const gardenCrops = crops.filter((crop) => crop.gardenId === selectedGarden?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Garden Grid</h2>
          <p className="text-muted-foreground">Manage your garden layout and crops</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Garden
        </Button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {gardens.map((garden) => (
          <Button
            key={garden.id.toString()}
            variant={selectedGarden?.id === garden.id ? 'default' : 'outline'}
            onClick={() => setSelectedGarden(garden)}
            className="whitespace-nowrap"
          >
            {garden.name}
          </Button>
        ))}
      </div>

      {selectedGarden && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Garden Map</CardTitle>
              <CardDescription>View your garden boundaries</CardDescription>
            </CardHeader>
            <CardContent>
              <GardenMap garden={selectedGarden} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grid View</CardTitle>
              <CardDescription>
                {gardenCrops.length} crops planted in {selectedGarden.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GardenGridView garden={selectedGarden} crops={gardenCrops} />
            </CardContent>
          </Card>
        </div>
      )}

      <CreateGardenDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
