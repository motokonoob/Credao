import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AddCropDialog from './AddCropDialog';
import type { Garden, Crop } from '../backend';

interface GardenGridViewProps {
  garden: Garden;
  crops: Crop[];
}

export default function GardenGridView({ garden, crops }: GardenGridViewProps) {
  const [selectedPositions, setSelectedPositions] = useState<Array<[number, number]>>([]);
  const [showAddCropDialog, setShowAddCropDialog] = useState(false);

  const width = Number(garden.width);
  const height = Number(garden.height);
  const maxDisplay = 20;
  const displayWidth = Math.min(width, maxDisplay);
  const displayHeight = Math.min(height, maxDisplay);

  // Create a map of positions to crops for efficient lookup
  const positionToCropMap = useMemo(() => {
    const map = new Map<string, Crop>();
    crops.forEach((crop) => {
      crop.gridPositions.forEach(([x, y]) => {
        map.set(`${Number(x)},${Number(y)}`, crop);
      });
    });
    return map;
  }, [crops]);

  const getCropAtPosition = (x: number, y: number) => {
    return positionToCropMap.get(`${x},${y}`);
  };

  const getCropColor = (stage: string) => {
    const stageLower = stage.toLowerCase();
    if (stageLower.includes('seed') || stageLower.includes('planted')) return 'oklch(0.7 0.1 145)';
    if (stageLower.includes('growing') || stageLower.includes('vegetative')) return 'oklch(0.65 0.15 145)';
    if (stageLower.includes('flowering') || stageLower.includes('fruiting')) return 'oklch(0.6 0.18 145)';
    if (stageLower.includes('harvest') || stageLower.includes('ready')) return 'oklch(0.55 0.2 145)';
    return 'oklch(0.65 0.15 145)';
  };

  const handleCellClick = (x: number, y: number) => {
    const crop = getCropAtPosition(x, y);
    if (!crop) {
      // Toggle selection
      const exists = selectedPositions.some(([px, py]) => px === x && py === y);
      if (exists) {
        setSelectedPositions((prev) => prev.filter(([px, py]) => !(px === x && py === y)));
      } else {
        setSelectedPositions((prev) => [...prev, [x, y]]);
      }
    }
  };

  const handleAddCrop = () => {
    setShowAddCropDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowAddCropDialog(open);
    if (!open) {
      setSelectedPositions([]);
    }
  };

  const isPositionSelected = (x: number, y: number) => {
    return selectedPositions.some(([px, py]) => px === x && py === y);
  };

  // Calculate bounding boxes for multi-cell crops
  const cropBoundingBoxes = useMemo(() => {
    const boxes = new Map<
      bigint,
      { minX: number; maxX: number; minY: number; maxY: number; crop: Crop }
    >();
    crops.forEach((crop) => {
      if (crop.gridPositions.length > 1) {
        const positions = crop.gridPositions.map(([x, y]) => [Number(x), Number(y)]);
        const minX = Math.min(...positions.map(([x]) => x));
        const maxX = Math.max(...positions.map(([x]) => x));
        const minY = Math.min(...positions.map(([, y]) => y));
        const maxY = Math.max(...positions.map(([, y]) => y));
        boxes.set(crop.id, { minX, maxX, minY, maxY, crop });
      }
    });
    return boxes;
  }, [crops]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Grid: {width}×{height} meters
          {(width > maxDisplay || height > maxDisplay) && ` (showing ${displayWidth}×${displayHeight})`}
        </p>
        <Button onClick={handleAddCrop} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Crop
        </Button>
      </div>

      {selectedPositions.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md border border-primary/20">
          <span className="text-sm font-medium">{selectedPositions.length} cell(s) selected</span>
          <Button size="sm" variant="outline" onClick={() => setSelectedPositions([])}>
            Clear Selection
          </Button>
          <Button size="sm" onClick={handleAddCrop}>
            Add Crop to Selection
          </Button>
        </div>
      )}

      <div className="overflow-auto rounded-lg border bg-card p-4">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${displayWidth}, minmax(0, 1fr))`,
            maxWidth: '100%',
          }}
        >
          {Array.from({ length: displayHeight * displayWidth }).map((_, index) => {
            const y = Math.floor(index / displayWidth);
            const x = index % displayWidth;
            const crop = getCropAtPosition(x, y);
            const selected = isPositionSelected(x, y);

            // Check if this is part of a multi-cell crop
            let isMultiCellCrop = false;
            let isTopLeft = false;
            if (crop && crop.gridPositions.length > 1) {
              isMultiCellCrop = true;
              const box = cropBoundingBoxes.get(crop.id);
              if (box && x === box.minX && y === box.minY) {
                isTopLeft = true;
              }
            }

            return (
              <button
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                className="aspect-square rounded border-2 transition-all hover:scale-105 hover:border-primary relative"
                style={{
                  backgroundColor: crop
                    ? getCropColor(crop.stage)
                    : selected
                      ? 'oklch(0.7 0.12 145)'
                      : 'oklch(var(--muted))',
                  borderColor: crop
                    ? getCropColor(crop.stage)
                    : selected
                      ? 'oklch(0.5 0.2 145)'
                      : 'oklch(var(--border))',
                  borderWidth: isMultiCellCrop ? '3px' : '2px',
                }}
                title={
                  crop
                    ? `${crop.name} (${crop.stage})${isMultiCellCrop ? ` - ${crop.gridPositions.length} cells` : ''}`
                    : `Empty cell (${x}, ${y})`
                }
              >
                {crop && (
                  <div className="flex h-full items-center justify-center text-xs font-medium text-white">
                    {isTopLeft && isMultiCellCrop ? crop.name.substring(0, 2).toUpperCase() : crop.name.charAt(0)}
                  </div>
                )}
                {selected && !crop && (
                  <div className="flex h-full items-center justify-center text-xs font-medium">✓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border" style={{ backgroundColor: 'oklch(var(--muted))' }} />
          <span className="text-muted-foreground">Empty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border" style={{ backgroundColor: 'oklch(0.7 0.1 145)' }} />
          <span className="text-muted-foreground">Planted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border" style={{ backgroundColor: 'oklch(0.65 0.15 145)' }} />
          <span className="text-muted-foreground">Growing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border" style={{ backgroundColor: 'oklch(0.6 0.18 145)' }} />
          <span className="text-muted-foreground">Flowering</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border" style={{ backgroundColor: 'oklch(0.55 0.2 145)' }} />
          <span className="text-muted-foreground">Ready</span>
        </div>
      </div>

      <AddCropDialog
        open={showAddCropDialog}
        onOpenChange={handleDialogClose}
        preselectedGarden={garden.id}
        preselectedPositions={selectedPositions}
        onPositionSelect={setSelectedPositions}
      />
    </div>
  );
}
