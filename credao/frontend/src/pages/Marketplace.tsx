import { useState } from 'react';
import { useGetAllListings, useGetAllCrops } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBasket, Search, Calendar, Clock } from 'lucide-react';
import PurchaseDialog from '../components/PurchaseDialog';
import type { MarketplaceListing, Crop } from '../backend';
import { toast } from 'sonner';

export default function Marketplace() {
  const { data: listings = [], isLoading } = useGetAllListings();
  const { data: crops = [] } = useGetAllCrops();
  const { identity } = useInternetIdentity();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedListing, setSelectedListing] = useState<{ listing: MarketplaceListing; crop: Crop } | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const getCropForListing = (listing: MarketplaceListing) => {
    return crops.find((c) => c.id === listing.cropId);
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

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredListings = listings.filter((listing) => {
    const crop = getCropForListing(listing);
    if (!crop) return false;

    const matchesSearch =
      crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crop.species.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || listing.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handlePurchase = (listing: MarketplaceListing) => {
    const crop = getCropForListing(listing);
    if (!crop) {
      toast.error('Crop information not found');
      return;
    }

    if (!identity) {
      toast.error('Please login to make a purchase');
      return;
    }

    if (!listing.isHarvestReady) {
      toast.error('This crop is not yet ready for harvest');
      return;
    }

    setSelectedListing({ listing, crop });
    setShowPurchaseDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading marketplace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="mb-8 overflow-hidden rounded-lg">
        <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5">
          <img
            src="/assets/generated/marketplace-scene.dim_800x400.jpg"
            alt="Fresh produce marketplace"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-3xl font-bold text-foreground">Fresh Local Produce</h2>
              <p className="text-muted-foreground">Directly from farmers and gardeners in your area</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search crops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBasket className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No Listings Found</CardTitle>
            <CardDescription>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Check back soon for fresh produce'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredListings.map((listing) => {
            const crop = getCropForListing(listing);
            if (!crop) return null;

            const isAvailable = listing.status.toLowerCase() === 'available';
            const isAvailableNow = listing.isHarvestReady && isAvailable;
            const isAvailableSoon = !listing.isHarvestReady && isAvailable;

            return (
              <Card 
                key={listing.id.toString()} 
                className={`overflow-hidden transition-shadow hover:shadow-lg ${
                  isAvailableSoon ? 'border-amber-300 dark:border-amber-800' : ''
                } ${
                  isAvailableNow ? 'border-green-300 dark:border-green-800' : ''
                }`}
              >
                <div className="aspect-square overflow-hidden bg-muted relative">
                  <img
                    src={getCropImage(crop.species)}
                    alt={crop.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                  {isAvailableNow && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                        Available Now
                      </Badge>
                    </div>
                  )}
                  {isAvailableSoon && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-md">
                        Available Soon
                      </Badge>
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="shadow-md">
                        {listing.status}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{crop.name}</CardTitle>
                      <CardDescription>{crop.species}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      ${(Number(listing.price) / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">per unit</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available: {listing.quantity.toString()} units
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">Stage:</span>
                      <span className="text-muted-foreground">{listing.stage}</span>
                    </div>
                    {isAvailableNow && (
                      <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-sm">
                        <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-700 dark:text-green-300">
                          Harvest ready
                        </span>
                      </div>
                    )}
                    {isAvailableSoon && (
                      <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 text-sm">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-amber-700 dark:text-amber-300">
                          Ready by {formatDate(listing.harvestDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  {isAvailableNow ? (
                    <Button 
                      onClick={() => handlePurchase(listing)} 
                      className="w-full bg-green-600 hover:bg-green-700 text-white" 
                      size="sm"
                    >
                      <ShoppingBasket className="mr-2 h-4 w-4" />
                      Order Now
                    </Button>
                  ) : isAvailableSoon ? (
                    <Button 
                      variant="outline" 
                      className="w-full border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" 
                      size="sm" 
                      disabled
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Available Soon
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" size="sm" disabled>
                      Sold Out
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedListing && (
        <PurchaseDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          listing={selectedListing.listing}
          crop={selectedListing.crop}
        />
      )}
    </div>
  );
}
