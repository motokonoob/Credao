import { useState } from 'react';
import { useGetAllCrops, useGetAllGardens, useUpdateGrowthStage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, MapPin, Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AddCropDialog from '../components/AddCropDialog';
import CreateListingDialog from '../components/CreateListingDialog';
import type { Crop } from '../backend';

const GROWTH_STAGES = [
  { value: 'germination', label: 'Germination' },
  { value: 'seedling', label: 'Seedling' },
  { value: 'vegetative', label: 'Vegetative' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'harvest-ready', label: 'Harvest-ready' },
];

export default function MyAssets() {
  const { data: crops = [], isLoading } = useGetAllCrops();
  const { data: gardens = [] } = useGetAllGardens();
  const updateGrowthStage = useUpdateGrowthStage();
  const [showAddCropDialog, setShowAddCropDialog] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showListingDialog, setShowListingDialog] = useState(false);
  const [updatingCropId, setUpdatingCropId] = useState<bigint | null>(null);

  const getGardenName = (gardenId: bigint) => {
    const garden = gardens.find((g) => g.id === gardenId);
    return garden?.name || 'Unknown Garden';
  };

  const getCropImage = (species: string) => {
    const speciesLower = species.toLowerCase();
    if (speciesLower.includes('tomato')) return '/assets/generated/tomato-crop.dim_200x200.png';
    if (speciesLower.includes('lettuce')) return '/assets/generated/lettuce-crop.dim_200x200.png';
    if (speciesLower.includes('carrot')) return '/assets/generated/carrot-crop.dim_200x200.png';
    if (speciesLower.includes('corn')) return '/assets/generated/corn-crop.dim_200x200.png';
    if (speciesLower.includes('pepper')) return '/assets/generated/pepper-crop.dim_200x200.png';
    if (speciesLower.includes('herb')) return '/assets/generated/herbs-crop.dim_200x200.png';
    return '/assets/generated/tomato-crop.dim_200x200.png';
  };

  const getStageColor = (stage: string) => {
    const stageLower = stage.toLowerCase();
    if (stageLower.includes('germination')) return 'default';
    if (stageLower.includes('seedling')) return 'secondary';
    if (stageLower.includes('vegetative')) return 'outline';
    if (stageLower.includes('flowering')) return 'secondary';
    if (stageLower.includes('harvest') || stageLower.includes('ready')) return 'default';
    return 'secondary';
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatGridPositions = (positions: Array<[bigint, bigint]>) => {
    if (positions.length === 1) {
      return `(${positions[0][0].toString()}, ${positions[0][1].toString()})`;
    }
    return `${positions.length} cells`;
  };

  const handleListCrop = (crop: Crop) => {
    setSelectedCrop(crop);
    setShowListingDialog(true);
  };

  const handleStageChange = async (cropId: bigint, newStage: string) => {
    setUpdatingCropId(cropId);
    try {
      await updateGrowthStage.mutateAsync({ cropId, newStage });
      toast.success('Growth stage updated successfully', {
        description: newStage === 'harvest-ready' 
          ? 'Crop is now available for immediate purchase in the marketplace'
          : `Stage changed to ${newStage}`,
      });
    } catch (error: any) {
      console.error('Failed to update growth stage:', error);
      toast.error('Failed to update growth stage', {
        description: error.message || 'Please try again',
      });
    } finally {
      setUpdatingCropId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading crops...</p>
          </div>
        </div>
      </div>
    );
  }

  if (crops.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No Crops Yet</CardTitle>
            <CardDescription>
              Start by adding crops to your garden grid
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setShowAddCropDialog(true)} size="lg" className="gap-2" disabled={gardens.length === 0}>
              <Plus className="h-5 w-5" />
              Add Crop
            </Button>
          </CardContent>
        </Card>

        {gardens.length === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Create a garden first before adding crops
          </p>
        )}

        <AddCropDialog open={showAddCropDialog} onOpenChange={setShowAddCropDialog} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Crops</h2>
          <p className="text-muted-foreground">Manage and track your planted crops</p>
        </div>
        <Button onClick={() => setShowAddCropDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Crop
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {crops.map((crop) => (
          <Card key={crop.id.toString()} className="overflow-hidden">
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={getCropImage(crop.species)}
                alt={crop.name}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{crop.name}</CardTitle>
                  <CardDescription>{crop.species}</CardDescription>
                </div>
                <Badge variant={getStageColor(crop.stage)}>{crop.stage}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{getGardenName(crop.gardenId)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Harvest: {formatDate(crop.harvestDate)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Grid Position: {formatGridPositions(crop.gridPositions)}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor={`stage-${crop.id}`} className="text-sm font-medium">
                  Growth Stage
                </Label>
                <Select
                  value={crop.stage.toLowerCase()}
                  onValueChange={(value) => handleStageChange(crop.id, value)}
                  disabled={updatingCropId === crop.id}
                >
                  <SelectTrigger id={`stage-${crop.id}`} className="w-full">
                    {updatingCropId === crop.id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {GROWTH_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => handleListCrop(crop)} 
                className="w-full" 
                size="sm"
                disabled={updatingCropId === crop.id}
              >
                List for Sale
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddCropDialog open={showAddCropDialog} onOpenChange={setShowAddCropDialog} />
      {selectedCrop && (
        <CreateListingDialog
          open={showListingDialog}
          onOpenChange={setShowListingDialog}
          crop={selectedCrop}
        />
      )}
    </div>
  );
}
