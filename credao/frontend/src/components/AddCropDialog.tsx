import { useState, useEffect } from 'react';
import { useAddCrop, useGetAllGardens } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Garden } from '../backend';

interface AddCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedGarden?: bigint;
  preselectedPositions?: Array<[number, number]>;
  onPositionSelect?: (positions: Array<[number, number]>) => void;
}

export default function AddCropDialog({
  open,
  onOpenChange,
  preselectedGarden,
  preselectedPositions = [],
  onPositionSelect,
}: AddCropDialogProps) {
  const [gardenId, setGardenId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [stage, setStage] = useState('Planted');
  const [plantingDate, setPlantingDate] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<Array<[number, number]>>(preselectedPositions);
  const [sensorLink, setSensorLink] = useState('');
  const [showGridSelector, setShowGridSelector] = useState(false);

  const { data: gardens = [] } = useGetAllGardens();
  const addCrop = useAddCrop();

  const selectedGarden = gardens.find((g) => g.id.toString() === gardenId);

  useEffect(() => {
    if (preselectedGarden) {
      setGardenId(preselectedGarden.toString());
    }
  }, [preselectedGarden]);

  useEffect(() => {
    if (preselectedPositions.length > 0) {
      setSelectedPositions(preselectedPositions);
    }
  }, [preselectedPositions]);

  useEffect(() => {
    if (onPositionSelect) {
      onPositionSelect(selectedPositions);
    }
  }, [selectedPositions, onPositionSelect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gardenId || !name.trim() || !species.trim() || !plantingDate || !harvestDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedPositions.length === 0) {
      toast.error('Please select at least one grid position');
      return;
    }

    try {
      const plantDate = new Date(plantingDate).getTime() * 1000000;
      const hrvstDate = new Date(harvestDate).getTime() * 1000000;

      const gridPositions: Array<[bigint, bigint]> = selectedPositions.map(([x, y]) => [BigInt(x), BigInt(y)]);

      await addCrop.mutateAsync({
        gardenId: BigInt(gardenId),
        name: name.trim(),
        species: species.trim(),
        stage,
        plantingDate: BigInt(plantDate),
        harvestDate: BigInt(hrvstDate),
        gridPositions,
        sensorLink: sensorLink.trim() || null,
      });

      toast.success('Crop added successfully!');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding crop:', error);
      toast.error('Failed to add crop. Please try again.');
    }
  };

  const resetForm = () => {
    setGardenId('');
    setName('');
    setSpecies('');
    setStage('Planted');
    setPlantingDate('');
    setHarvestDate('');
    setSelectedPositions([]);
    setSensorLink('');
    setShowGridSelector(false);
  };

  const removePosition = (index: number) => {
    setSelectedPositions((prev) => prev.filter((_, i) => i !== index));
  };

  const addPosition = (x: number, y: number) => {
    const exists = selectedPositions.some(([px, py]) => px === x && py === y);
    if (!exists) {
      setSelectedPositions((prev) => [...prev, [x, y]]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Crop</DialogTitle>
          <DialogDescription>Add a crop to your garden grid. Select multiple grid squares for larger crops.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="garden">Garden *</Label>
              <Select value={gardenId} onValueChange={setGardenId} required>
                <SelectTrigger id="garden">
                  <SelectValue placeholder="Select garden" />
                </SelectTrigger>
                <SelectContent>
                  {gardens.map((garden) => (
                    <SelectItem key={garden.id.toString()} value={garden.id.toString()}>
                      {garden.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Crop Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Cherry Tomatoes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Input
                id="species"
                placeholder="e.g., Tomato"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Growth Stage *</Label>
              <Select value={stage} onValueChange={setStage} required>
                <SelectTrigger id="stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planted">Planted</SelectItem>
                  <SelectItem value="Germinating">Germinating</SelectItem>
                  <SelectItem value="Growing">Growing</SelectItem>
                  <SelectItem value="Vegetative">Vegetative</SelectItem>
                  <SelectItem value="Flowering">Flowering</SelectItem>
                  <SelectItem value="Fruiting">Fruiting</SelectItem>
                  <SelectItem value="Ready to Harvest">Ready to Harvest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plantingDate">Planting Date *</Label>
              <Input
                id="plantingDate"
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="harvestDate">Expected Harvest Date *</Label>
              <Input
                id="harvestDate"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grid Positions * ({selectedPositions.length} selected)</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
              {selectedPositions.length === 0 ? (
                <span className="text-sm text-muted-foreground">No positions selected</span>
              ) : (
                selectedPositions.map(([x, y], index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    ({x}, {y})
                    <button
                      type="button"
                      onClick={() => removePosition(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGridSelector(!showGridSelector)}
              disabled={!gardenId}
            >
              {showGridSelector ? 'Hide Grid Selector' : 'Show Grid Selector'}
            </Button>
          </div>

          {showGridSelector && selectedGarden && (
            <GridSelector
              garden={selectedGarden}
              selectedPositions={selectedPositions}
              onPositionToggle={(x, y) => {
                const exists = selectedPositions.some(([px, py]) => px === x && py === y);
                if (exists) {
                  setSelectedPositions((prev) => prev.filter(([px, py]) => !(px === x && py === y)));
                } else {
                  addPosition(x, y);
                }
              }}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="sensorLink">Sensor Link (Optional)</Label>
            <Input
              id="sensorLink"
              placeholder="e.g., http://sensor.example.com/device123"
              value={sensorLink}
              onChange={(e) => setSensorLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Link to Arduino or IoT sensor data</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addCrop.isPending}>
              {addCrop.isPending ? 'Adding...' : 'Add Crop'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface GridSelectorProps {
  garden: Garden;
  selectedPositions: Array<[number, number]>;
  onPositionToggle: (x: number, y: number) => void;
}

function GridSelector({ garden, selectedPositions, onPositionToggle }: GridSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);
  const [dragCurrent, setDragCurrent] = useState<[number, number] | null>(null);

  const width = Number(garden.width);
  const height = Number(garden.height);
  const maxDisplay = 15;
  const displayWidth = Math.min(width, maxDisplay);
  const displayHeight = Math.min(height, maxDisplay);

  const isSelected = (x: number, y: number) => {
    return selectedPositions.some(([px, py]) => px === x && py === y);
  };

  const isInDragArea = (x: number, y: number) => {
    if (!isDragging || !dragStart || !dragCurrent) return false;
    const minX = Math.min(dragStart[0], dragCurrent[0]);
    const maxX = Math.max(dragStart[0], dragCurrent[0]);
    const minY = Math.min(dragStart[1], dragCurrent[1]);
    const maxY = Math.max(dragStart[1], dragCurrent[1]);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  };

  const handleMouseDown = (x: number, y: number) => {
    setIsDragging(true);
    setDragStart([x, y]);
    setDragCurrent([x, y]);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isDragging) {
      setDragCurrent([x, y]);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragCurrent) {
      const minX = Math.min(dragStart[0], dragCurrent[0]);
      const maxX = Math.max(dragStart[0], dragCurrent[0]);
      const minY = Math.min(dragStart[1], dragCurrent[1]);
      const maxY = Math.max(dragStart[1], dragCurrent[1]);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          onPositionToggle(x, y);
        }
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <div className="space-y-2 border rounded-lg p-4 bg-card">
      <p className="text-sm text-muted-foreground">
        Click to select individual cells, or click and drag to select multiple cells at once.
      </p>
      <div
        className="grid gap-1 select-none"
        style={{
          gridTemplateColumns: `repeat(${displayWidth}, minmax(0, 1fr))`,
        }}
        onMouseLeave={handleMouseUp}
      >
        {Array.from({ length: displayHeight * displayWidth }).map((_, index) => {
          const y = Math.floor(index / displayWidth);
          const x = index % displayWidth;
          const selected = isSelected(x, y);
          const inDragArea = isInDragArea(x, y);

          return (
            <button
              key={`${x}-${y}`}
              type="button"
              onMouseDown={() => handleMouseDown(x, y)}
              onMouseEnter={() => handleMouseEnter(x, y)}
              onMouseUp={handleMouseUp}
              className="aspect-square rounded border-2 transition-all hover:scale-105"
              style={{
                backgroundColor: selected
                  ? 'oklch(0.6 0.18 145)'
                  : inDragArea
                    ? 'oklch(0.7 0.12 145)'
                    : 'oklch(var(--muted))',
                borderColor: selected || inDragArea ? 'oklch(0.5 0.2 145)' : 'oklch(var(--border))',
              }}
              title={`Position (${x}, ${y})`}
            >
              <div className="flex h-full items-center justify-center text-xs font-medium">
                {selected && '✓'}
              </div>
            </button>
          );
        })}
      </div>
      {(width > maxDisplay || height > maxDisplay) && (
        <p className="text-xs text-muted-foreground">
          Showing {displayWidth}×{displayHeight} of {width}×{height} grid
        </p>
      )}
    </div>
  );
}
