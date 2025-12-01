import { useState } from 'react';
import { useCreateListing } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { Crop } from '../backend';

interface CreateListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop: Crop;
}

export default function CreateListingDialog({ open, onOpenChange, crop }: CreateListingDialogProps) {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const createListing = useCreateListing();

  const isHarvestReady = crop.stage.toLowerCase().includes('harvest') || crop.stage.toLowerCase().includes('ready');

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      // Convert price to cents
      const priceInCents = Math.round(priceNum * 100);

      await createListing.mutateAsync({
        cropId: crop.id,
        price: BigInt(priceInCents),
        quantity: BigInt(quantityNum),
        status: 'Available',
      });

      toast.success('Listing created successfully!');
      setPrice('');
      setQuantity('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>List Crop for Sale</DialogTitle>
          <DialogDescription>Set the price and quantity for {crop.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{crop.name}</p>
                <p className="text-sm text-muted-foreground">{crop.species}</p>
              </div>
              <Badge variant={isHarvestReady ? 'default' : 'secondary'}>
                {crop.stage}
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Harvest Date: {formatDate(crop.harvestDate)}</span>
            </div>
          </div>

          {!isHarvestReady && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This crop is not yet harvest-ready. Buyers will see it as "Available Soon" and won't be able to purchase until it's ready.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Price per Unit ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="5.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Available</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Number of units available for sale</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createListing.isPending}>
              {createListing.isPending ? 'Creating...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
