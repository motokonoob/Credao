import { useState, useEffect, useRef } from 'react';
import { useCreateGarden } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { MapPin, Trash2, Grid3x3 } from 'lucide-react';
import type { Coordinate, GardenType } from '../backend';

interface CreateGardenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGardenDialog({ open, onOpenChange }: CreateGardenDialogProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'map' | 'grid'>('grid');
  
  // Map mode state
  const [boundary, setBoundary] = useState<Coordinate[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [mapGridSize, setMapGridSize] = useState('10');
  
  // Grid mode state
  const [gridWidth, setGridWidth] = useState('5');
  const [gridHeight, setGridHeight] = useState('5');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createGarden = useCreateGarden();

  // Default center coordinates (San Francisco)
  const centerLat = 37.7749;
  const centerLng = -122.4194;
  const scale = 0.001; // Scale for coordinate conversion

  useEffect(() => {
    if (!open || mode !== 'map') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = 'oklch(0.95 0.02 145)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'oklch(0.9 0.02 145)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width;
      const y = (i / 10) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw instructions if no points
    if (boundary.length === 0) {
      ctx.fillStyle = 'oklch(0.5 0.02 145)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click on the canvas to draw your garden boundary', canvas.width / 2, canvas.height / 2);
    }

    // Draw boundary polygon
    if (boundary.length > 0) {
      ctx.beginPath();
      const firstPoint = boundary[0];
      const firstX = ((firstPoint.lng - (centerLng - scale)) / (scale * 2)) * canvas.width;
      const firstY = (1 - (firstPoint.lat - (centerLat - scale)) / (scale * 2)) * canvas.height;
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < boundary.length; i++) {
        const point = boundary[i];
        const x = ((point.lng - (centerLng - scale)) / (scale * 2)) * canvas.width;
        const y = (1 - (point.lat - (centerLat - scale)) / (scale * 2)) * canvas.height;
        ctx.lineTo(x, y);
      }

      if (boundary.length > 2) {
        ctx.closePath();
        ctx.fillStyle = 'oklch(0.7 0.12 145 / 0.3)';
        ctx.fill();
      }

      ctx.strokeStyle = 'oklch(0.6 0.15 145)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw points
      boundary.forEach((point) => {
        const x = ((point.lng - (centerLng - scale)) / (scale * 2)) * canvas.width;
        const y = (1 - (point.lat - (centerLat - scale)) / (scale * 2)) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'oklch(0.55 0.18 145)';
        ctx.fill();
      });
    }
  }, [boundary, open, mode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert canvas coordinates to lat/lng
    const lng = centerLng - scale + (x / canvas.width) * (scale * 2);
    const lat = centerLat - scale + (1 - y / canvas.height) * (scale * 2);

    setBoundary((prev) => [...prev, { lat, lng }]);
  };

  const clearDrawing = () => {
    setBoundary([]);
  };

  const removeLastPoint = () => {
    setBoundary((prev) => prev.slice(0, -1));
  };

  const generateSquareBoundary = (width: number, height: number): Coordinate[] => {
    // Generate a simple square boundary centered around default coordinates
    const halfWidth = (width / 2) * 0.00001;
    const halfHeight = (height / 2) * 0.00001;
    
    return [
      { lat: centerLat - halfHeight, lng: centerLng - halfWidth },
      { lat: centerLat + halfHeight, lng: centerLng - halfWidth },
      { lat: centerLat + halfHeight, lng: centerLng + halfWidth },
      { lat: centerLat - halfHeight, lng: centerLng + halfWidth },
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a garden name');
      return;
    }

    let finalBoundary: Coordinate[];
    let finalWidth: number;
    let finalHeight: number;
    let gardenType: GardenType;

    if (mode === 'map') {
      if (boundary.length < 3) {
        toast.error('Please draw at least 3 points to create a garden boundary');
        return;
      }

      const size = parseInt(mapGridSize);
      if (isNaN(size) || size < 1 || size > 100) {
        toast.error('Grid size must be between 1 and 100');
        return;
      }

      finalBoundary = boundary;
      finalWidth = size;
      finalHeight = size;
      gardenType = 'mapBased' as GardenType;
    } else {
      // Grid mode
      const width = parseInt(gridWidth);
      const height = parseInt(gridHeight);

      if (isNaN(width) || width < 1 || width > 100) {
        toast.error('Width must be between 1 and 100 meters');
        return;
      }

      if (isNaN(height) || height < 1 || height > 100) {
        toast.error('Height must be between 1 and 100 meters');
        return;
      }

      finalBoundary = generateSquareBoundary(width, height);
      finalWidth = width;
      finalHeight = height;
      gardenType = 'gridBased' as GardenType;
    }

    try {
      await createGarden.mutateAsync({
        name: name.trim(),
        boundary: finalBoundary,
        gridSize: BigInt(finalWidth * finalHeight),
        gardenType,
        width: BigInt(finalWidth),
        height: BigInt(finalHeight),
      });

      toast.success('Garden created successfully!');
      setName('');
      setMapGridSize('10');
      setGridWidth('5');
      setGridHeight('5');
      setBoundary([]);
      setSearchLocation('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating garden:', error);
      toast.error('Failed to create garden. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Garden</DialogTitle>
          <DialogDescription>Choose between map-based or simple grid garden</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Garden Name</Label>
            <Input
              id="name"
              placeholder="e.g., Backyard Garden"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'map' | 'grid')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid" className="gap-2">
                <Grid3x3 className="h-4 w-4" />
                Simple Grid Mode
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <MapPin className="h-4 w-4" />
                Map Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  Create a simple rectangular garden by specifying dimensions in meters
                </p>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gridWidth">Width (meters)</Label>
                    <Input
                      id="gridWidth"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="5"
                      value={gridWidth}
                      onChange={(e) => setGridWidth(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gridHeight">Height (meters)</Label>
                    <Input
                      id="gridHeight"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="5"
                      value={gridHeight}
                      onChange={(e) => setGridHeight(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-primary/10 p-3">
                  <p className="text-sm font-medium text-primary">
                    Grid Preview: {gridWidth || 0} × {gridHeight || 0} meters
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total area: {(parseInt(gridWidth || '0') * parseInt(gridHeight || '0'))} square meters
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mapGridSize">Grid Size (meters)</Label>
                <Input
                  id="mapGridSize"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="10"
                  value={mapGridSize}
                  onChange={(e) => setMapGridSize(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Creates a {mapGridSize}x{mapGridSize} meter grid for crop placement
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Enter address or coordinates"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Search for your location (feature coming soon - use drawing area below)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Garden Boundary</Label>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  onClick={handleCanvasClick}
                  className="h-[400px] w-full cursor-crosshair rounded-lg border bg-muted"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {boundary.length === 0
                      ? 'Click on the canvas to draw your garden boundary'
                      : `${boundary.length} points drawn`}
                  </p>
                  <div className="flex gap-2">
                    {boundary.length > 0 && (
                      <>
                        <Button type="button" onClick={removeLastPoint} variant="outline" size="sm">
                          Remove Last
                        </Button>
                        <Button type="button" onClick={clearDrawing} variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                createGarden.isPending || 
                (mode === 'map' && boundary.length < 3)
              }
            >
              {createGarden.isPending ? 'Creating...' : 'Create Garden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
