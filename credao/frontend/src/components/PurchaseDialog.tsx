import { useState } from 'react';
import { useCreateOrder } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MarketplaceListing, Crop } from '../backend';

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MarketplaceListing;
  crop: Crop;
}

export default function PurchaseDialog({ open, onOpenChange, listing, crop }: PurchaseDialogProps) {
  const [quantity, setQuantity] = useState('1');
  const createOrder = useCreateOrder();

  const pricePerUnit = Number(listing.price) / 100;
  const quantityNum = parseInt(quantity) || 0;
  const totalPrice = pricePerUnit * quantityNum;

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!listing.isHarvestReady) {
      toast.error('This crop is not yet ready for harvest');
      return;
    }

    const qty = parseInt(quantity);

    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (qty > Number(listing.quantity)) {
      toast.error(`Only ${listing.quantity} units available`);
      return;
    }

    try {
      const totalPriceInCents = Math.round(totalPrice * 100);

      await createOrder.mutateAsync({
        listingId: listing.id,
        quantity: BigInt(qty),
        totalPrice: BigInt(totalPriceInCents),
        status: 'Pending',
      });

      toast.success(
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-semibold">Order placed successfully!</p>
            <p className="text-sm text-muted-foreground">
              Your order for {qty} unit{qty > 1 ? 's' : ''} of {crop.name} has been confirmed.
            </p>
          </div>
        </div>
      );
      setQuantity('1');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase {crop.name}</DialogTitle>
          <DialogDescription>Complete your purchase</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{crop.name}</p>
                <p className="text-sm text-muted-foreground">{crop.species}</p>
              </div>
              <Badge variant={listing.isHarvestReady ? 'default' : 'secondary'}>
                {listing.stage}
              </Badge>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm">
                <span className="font-medium">${pricePerUnit.toFixed(2)}</span> per unit
              </p>
              <p className="text-sm text-muted-foreground">
                {listing.quantity.toString()} units available
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {listing.isHarvestReady 
                    ? 'Harvest ready' 
                    : `Ready by ${formatDate(listing.harvestDate)}`}
                </span>
              </div>
            </div>
          </div>

          {!listing.isHarvestReady && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This crop is not yet ready for harvest. You cannot place an order at this time.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={Number(listing.quantity)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!listing.isHarvestReady}
              required
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-medium">
              <span>Total:</span>
              <span className="text-lg text-primary">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOrder.isPending || !listing.isHarvestReady}>
              {createOrder.isPending ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
