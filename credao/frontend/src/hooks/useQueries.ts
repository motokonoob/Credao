import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Garden, Crop, MarketplaceListing, Order, Alert, Coordinate, GardenType } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Garden Queries
export function useGetAllGardens() {
  const { actor, isFetching } = useActor();

  return useQuery<Garden[]>({
    queryKey: ['gardens'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGardens();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGarden() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      name, 
      boundary, 
      gridSize, 
      gardenType, 
      width, 
      height 
    }: { 
      name: string; 
      boundary: Coordinate[]; 
      gridSize: bigint;
      gardenType: GardenType;
      width: bigint;
      height: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createGarden(name, boundary, gridSize, gardenType, width, height);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
    },
  });
}

// Crop Queries
export function useGetAllCrops() {
  const { actor, isFetching } = useActor();

  return useQuery<Crop[]>({
    queryKey: ['crops'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCrops();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCrop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      gardenId: bigint;
      name: string;
      species: string;
      stage: string;
      plantingDate: bigint;
      harvestDate: bigint;
      gridPositions: Array<[bigint, bigint]>;
      sensorLink: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCrop(
        params.gardenId,
        params.name,
        params.species,
        params.stage,
        params.plantingDate,
        params.harvestDate,
        params.gridPositions,
        params.sensorLink
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}

export function useUpdateGrowthStage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { cropId: bigint; newStage: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGrowthStage(params.cropId, params.newStage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// Marketplace Queries
export function useGetAllListings() {
  const { actor, isFetching } = useActor();

  return useQuery<MarketplaceListing[]>({
    queryKey: ['listings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      cropId: bigint;
      price: bigint;
      quantity: bigint;
      status: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createListing(params.cropId, params.price, params.quantity, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// Order Queries
export function useGetAllOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      listingId: bigint;
      quantity: bigint;
      totalPrice: bigint;
      status: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrder(params.listingId, params.quantity, params.totalPrice, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// Alert Queries
export function useGetUserAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserAlerts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { message: string; alertType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createAlert(params.message, params.alertType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
