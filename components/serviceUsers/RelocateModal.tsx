"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Home, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Location, Room, Branch } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { useLocations } from "@/hooks/useGetLocations";
import { useQuery } from "@tanstack/react-query";

interface RelocateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  guestId: string;
  guestName: string;
  currentBranchId: string;
  currentLocationId?: string;
  currentRoomId?: string;
  onSuccess?: () => void;
}

export function RelocateModal({
  isOpen,
  onOpenChange,
  guestId,
  guestName,
  currentBranchId,
  currentLocationId,
  currentRoomId,
  onSuccess,
}: RelocateModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Room interface from capacity API
  interface CapacityRoom {
    id: string;
    roomNumber: string;
    capacity: number;
    currentOccupancy: number;
    currentKids: number;
    availableAdultSpace: number;
    availableKidSpace: number;
    totalAvailableSpace: number;
    locationId: string;
    location: string;
    branch: string;
    status: string;
    roomType: string;
    amenities: string[];
    maxAdultsCanFit: number;
    maxKidsCanFit: number;
    recommendedFor: string;
    specialNote?: string;
  }

  // Fetch rooms from capacity API when modal opens
  const { data: capacityRoomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["relocate-rooms", currentBranchId],
    queryFn: async (): Promise<CapacityRoom[]> => {
      if (!currentBranchId) return [];
      const response = await api.get("/guest/rooms/capacity", {
        params: {
          capacity: 1,
          kids: 0,
          branchId: currentBranchId,
        },
      });
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    },
    enabled: isOpen && !!currentBranchId,
  });

  // Memoize capacityRooms to prevent infinite loops
  const capacityRooms = useMemo(() => {
    return capacityRoomsData || [];
  }, [capacityRoomsData]);

  // Fetch all locations from API
  const { data: allLocations = [], isLoading: isLoadingLocations } = useLocations();

  // Filter locations by current branch ID - memoized to prevent infinite loops
  const branchLocations = useMemo(() => {
    if (!currentBranchId || !allLocations.length) return [];
    
    return allLocations.filter((location) => {
      // Handle both string branchId and object branchId
      const locBranchId =
        typeof location.branchId === "string"
          ? location.branchId
          : (location.branchId as any)?._id;
      return locBranchId === currentBranchId;
    });
  }, [allLocations, currentBranchId]);

  // Memoize filtered rooms to prevent infinite loops
  const filteredRooms = useMemo(() => {
    if (!selectedLocationId || !capacityRooms.length) return [];
    
    // Filter rooms by selected locationId
    let rooms = capacityRooms.filter((room) => {
      const roomLocationId = String(room.locationId);
      const selectedLocId = String(selectedLocationId);
      return roomLocationId === selectedLocId;
    });

    // Filter out current room by ID
    if (currentRoomId) {
      const currentRoomIdStr = String(
        typeof currentRoomId === 'string'
          ? currentRoomId
          : (currentRoomId as any)?._id || currentRoomId
      );
      
      rooms = rooms.filter((room) => {
        const roomIdStr = String(room.id);
        // Exclude current room by ID match
        return roomIdStr !== currentRoomIdStr;
      });
    }
    
    return rooms;
  }, [selectedLocationId, capacityRooms, currentRoomId]);

  // Reset room selection when location changes
  useEffect(() => {
    if (selectedLocationId) {
      setSelectedRoomId("");
    }
  }, [selectedLocationId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLocationId("");
      setSelectedRoomId("");
    }
  }, [isOpen]);

  const relocateMutation = useMutation({
    mutationFn: async (data: { newLocationId: string; newRoomId: string }) => {
      const response = await api.patch(`/guest/${guestId}/relocate`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${guestName} has been successfully relocated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["service-users"] });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to relocate guest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    if (!selectedLocationId || !selectedRoomId) {
      toast({
        title: "Incomplete Selection",
        description: "Please select both a location and a room.",
        variant: "destructive",
      });
      return;
    }

    // Find the selected room to get its locationId from API response
    const selectedRoom = filteredRooms.find((room) => room.id === selectedRoomId);
    if (!selectedRoom) {
      toast({
        title: "Error",
        description: "Selected room not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    relocateMutation.mutate({
      newLocationId: selectedRoom.locationId,
      newRoomId: selectedRoomId,
    });
  };

  const canComplete = selectedLocationId && selectedRoomId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Relocate Service User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Guest Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Relocating: <span className="font-semibold">{guestName}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Select a new location and room within the current branch
            </p>
          </div>

          {/* Step 1: Select Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Step 1: Select Location
            </label>
            {isLoadingLocations ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading locations...</span>
              </div>
            ) : (
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {branchLocations.length === 0 ? (
                    <SelectItem value="no-locations" disabled>
                      No locations available for this branch
                    </SelectItem>
                  ) : (
                    branchLocations.map((location) => (
                      <SelectItem key={location._id} value={location._id}>
                        {location.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {selectedLocationId && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Location selected
              </p>
            )}
          </div>

          {/* Step 2: Select Room */}
          {selectedLocationId && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Home className="h-4 w-4" />
                Step 2: Select Room
              </label>
              {isLoadingRooms ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading available rooms...</span>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-4 border border-dashed rounded-lg text-center text-sm text-gray-500">
                  No rooms available in this location
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredRooms.map((room: CapacityRoom) => (
                    <Card
                      key={room.id}
                      className={`border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg bg-white cursor-pointer ${
                        selectedRoomId === room.id
                          ? "border-2 border-[#F87D7D] bg-[#F87D7D]/5"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                          <span>Room {room.roomNumber}</span>
                          {selectedRoomId === room.id && (
                            <CheckCircle className="h-5 w-5 text-[#F87D7D]" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Room Type
                              </p>
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-800 border-yellow-200"
                              >
                                {room.roomType || "N/A"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Status
                              </p>
                              <Badge
                                variant="outline"
                                className={`${
                                  room.status === "Fully Available"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                              >
                                {room.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Capacity
                              </p>
                              <p className="text-sm text-gray-800">{room.capacity}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Available Space
                              </p>
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800 border-blue-200"
                              >
                                {room.totalAvailableSpace} spots
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Current Occupancy
                              </p>
                              <p className="text-sm text-gray-800">{room.currentOccupancy}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Location
                              </p>
                              <p className="text-sm text-gray-800">{room.location}</p>
                            </div>
                          </div>
                          {room.amenities && room.amenities.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Amenities
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {room.amenities
                                  .filter((amenity) => amenity && amenity.trim() !== "")
                                  .map((amenity, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="bg-purple-100 text-purple-800 border-purple-200 text-xs"
                                    >
                                      {amenity}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                          {room.recommendedFor && (
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Recommended For
                              </p>
                              <p className="text-xs text-gray-700">{room.recommendedFor}</p>
                            </div>
                          )}
                          {room.specialNote && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                              <p className="text-xs text-yellow-800 font-medium mb-1">
                                Note
                              </p>
                              <p className="text-xs text-yellow-700">{room.specialNote}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {selectedRoomId && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Room selected
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={relocateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!canComplete || relocateMutation.isPending}
              className="bg-[#F87D7D] hover:bg-[#F87D7D]/90 text-white"
            >
              {relocateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Relocating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Relocation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

