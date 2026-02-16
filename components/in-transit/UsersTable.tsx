"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle,
  Truck,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { InTransitUser } from "@/hooks/useGetInTransitUsers";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/axios";
import { RoleWrapper } from "@/lib/RoleWrapper";
import { useAuth } from "../providers/auth-provider";

interface UsersTableProps {
  filteredUsers: InTransitUser[];
  handleViewUser: (userId: string) => void;
  handleMarkArrived: (userId: string) => void;
}

interface Branch {
  _id: string;
  name: string;
  address: string;
  locations: { _id: string; name: string; rooms: string[] }[];
  documents: any[];
  createdAt: string;
  updatedAt: string;
}

interface Room {
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
  specialNote: string;
}

const fetchBranches = async (companyId: string): Promise<Branch[]> => {
  const response = await api.get(
    `/branch/list/by-company?companyId=${companyId}`
  );
  return response.data.branches;
};

const fetchRooms = async (branchId: string): Promise<Room[]> => {
  const response = await api.get(
    `/guest/rooms/capacity?capacity=1&kids=0&branchId=${branchId}`
  );
  return response.data.data;
};

export default function UsersTable({
  filteredUsers,
  handleViewUser,
  handleMarkArrived,
}: UsersTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const queryClient = useQueryClient();

  // Fetch branches when modal opens
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    isError: isBranchesError,
  } = useQuery({
    queryKey: ["branches", selectedCompanyId],
    queryFn: () => fetchBranches(selectedCompanyId!),
    enabled: !!selectedCompanyId && isModalOpen,
  });

  // Fetch rooms when branch is selected
  const {
    data: rooms = [],
    isLoading: isLoadingRooms,
    isError: isRoomsError,
  } = useQuery({
    queryKey: ["rooms", selectedBranchId],
    queryFn: () => fetchRooms(selectedBranchId!),
    enabled: !!selectedBranchId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "Transferred":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Transferred":
        return <Truck className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleApproveClick = (
    userId: string,
    companyId: string,
    branchId: string
  ) => {
    setSelectedUserId(userId);
    setSelectedCompanyId(companyId);
    setCurrentBranchId(branchId);
    setIsModalOpen(true);
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  const handleRejectClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedUserId) return;

    try {
      setIsRejecting(true);
      await api.post("/su-removal/reject-removal", {
        guestIds: [selectedUserId],
        rejectionReason:
          "Transfer request rejected - insufficient documentation provided",
      });

      // Invalidate queries to refetch the table data
      await queryClient.invalidateQueries({ queryKey: ["inTransitUsers"] });

      setIsRejectModalOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRoomSelect = (roomId: string, locationId: string) => {
    setSelectedRoomId(roomId);
    setSelectedLocationId(locationId);
  };

  const handleProceed = async () => {
    if (
      !selectedUserId ||
      !selectedCompanyId ||
      !selectedBranchId ||
      !selectedRoomId ||
      !selectedLocationId
    )
      return;

    try {
      setIsApproving(true);
      await api.post("/su-removal/approve-transfer", {
        guestIds: [selectedUserId],
        targetCompanyId: selectedCompanyId,
        targetBranchId: selectedBranchId,
        targetLocationId: selectedLocationId,
        targetRoomId: selectedRoomId,
        approvalNotes: "Transfer approved - guest moving to new location",
      });

      // Invalidate queries to refetch the table data
      await queryClient.invalidateQueries({ queryKey: ["inTransitUsers"] });

      // Close modal and reset selections
      setIsModalOpen(false);
      setSelectedUserId(null);
      setSelectedCompanyId(null);
      setSelectedBranchId(null);
      setSelectedRoomId(null);
      setSelectedLocationId(null);
    } catch (error) {
      console.error("Error approving transfer:", error);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service User</TableHead>
            <TableHead>Contact Details</TableHead>
            <TableHead>Current Location</TableHead>
            <TableHead>Status</TableHead>
            {RoleWrapper(
              currentUser?.roles[0]?.name,
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user: any) => (
            <TableRow className="text-xs" key={user?._id}>
              <TableCell>
                <div className="font-medium capitalize">
                  {user?.guestId?.userId?.fullName}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <Phone className="h-3 w-3 mr-1" />
                    {user?.guestId?.userId?.phoneNumber || "No Phone Number Provided"}
                  </div>
                  {/* <div className="flex items-center text-xs">
                    {user?.guestId?.userId?.emailAddress}
                  </div> */}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-xs">
                    Room: {user?.guestId?.familyRooms[0]?.roomId?.roomNumber}
                  </div>
                  <div className="text-xs">
                    Location: {user?.guestId?.familyRooms[0]?.locationId?.name}
                  </div>
                  <div className="text-xs">Branch: {user?.branchId?.name}</div>
                </div>
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatusColor(user.removalStatus)}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(user.removalStatus)}
                    {user?.removalStatus
                      ?.replace("_", " ")
                      ?.replace(/\b\w/g, (l: any) => l?.toUpperCase())}
                  </div>
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {RoleWrapper(
                  currentUser?.roles[0]?.name,
                  <>
                    {user.removalStatus === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleApproveClick(
                              user._id,
                              user.companyId._id,
                              user.branchId._id
                            )
                          }
                          className="bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 hover:border-green-300"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(user._id)}
                          className="bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 hover:border-red-300"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      // <Button
                      //   size="sm"
                      //   onClick={() => handleViewUser(user._id)}
                      //   className="bg-blue-600 hover:bg-blue-700"
                      // >
                      //   <Eye className="h-4 w-4" />
                      // </Button>
                      ""
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            // ✅ Reset everything when modal closes
            setSelectedBranchId(null);
            setSelectedRoomId(null);
            setSelectedLocationId(null);
            setSelectedCompanyId(null);
            setSelectedUserId(null);
            setCurrentBranchId(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              Select Destination Branch and Room
            </DialogTitle>
          </DialogHeader>
          {isLoadingBranches ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : isBranchesError ? (
            <div className="text-red-500 text-center py-4 bg-red-50 rounded-lg">
              Error loading branches. Please try again.
            </div>
          ) : (
            <div className="space-y-6">
              <Select onValueChange={handleBranchSelect}>
                <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg p-3 bg-gray-50">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg rounded-lg">
                  {branches
                    .filter((branch) => branch._id !== currentBranchId) // ✅ exclude current branch
                    .map((branch) => (
                      <SelectItem
                        key={branch._id}
                        value={branch._id}
                        className="hover:bg-blue-50 cursor-pointer"
                      >
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {isLoadingRooms ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : isRoomsError ? (
                <div className="text-red-500 text-center py-4 bg-red-50 rounded-lg">
                  Error loading rooms. Please try again.
                </div>
              ) : selectedBranchId ? ( // ✅ only show room section after branch is selected
                rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-400 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 19V5a2 2 0 012-2h14a2 2 0 012 2v14M3 19h18M3 19l3-3m12 3l3-3"
                      />
                    </svg>
                    <p className="text-gray-600 text-lg font-medium">
                      No rooms available in this branch
                    </p>
                    <p className="text-gray-500 text-sm">
                      Try selecting another branch to view available rooms.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2">
                    {rooms.map((room) => (
                      <Card
                        key={room.id}
                        className={`border-gray-200 shadow-md hover:shadow-lg hover:bg-blue-50 transition-all duration-200 rounded-lg bg-white cursor-pointer ${
                          selectedRoomId === room.id
                            ? "border-2 border-blue-500"
                            : ""
                        }`}
                        onClick={() =>
                          handleRoomSelect(room.id, room.locationId)
                        }
                      >
                        <CardHeader className="border-b border-gray-100 pb-3">
                          <CardTitle className="text-lg font-semibold text-gray-800">
                            {room.roomNumber}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 font-medium">Type</p>
                              <Badge
                                variant="outline"
                                className="mt-1 bg-yellow-50 text-yellow-800 border-yellow-200"
                              >
                                {room.roomType}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">
                                Location
                              </p>
                              <p className="text-gray-800 mt-1">
                                {room.location}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">
                                Branch
                              </p>
                              <p className="text-gray-800 mt-1">
                                {room.branch}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">
                                Status
                              </p>
                              <Badge
                                variant="outline"
                                className={`mt-1 ${
                                  room.status === "Partially Available"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                              >
                                {room.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">
                                Available Space
                              </p>
                              <Badge
                                variant="outline"
                                className="mt-1 bg-blue-100 text-blue-800 border-blue-200"
                              >
                                {room.totalAvailableSpace} spots
                              </Badge>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">
                                Amenities
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {room.amenities.map((amenity) => (
                                  <Badge
                                    key={amenity}
                                    variant="outline"
                                    className="bg-purple-100 text-purple-800"
                                  >
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-600 font-medium">
                                Recommended
                              </p>
                              <p className="text-gray-800 mt-1">
                                {room.recommendedFor}
                              </p>
                            </div>
                            {room.specialNote && (
                              <div className="col-span-2">
                                <p className="text-gray-600 font-medium">
                                  Note
                                </p>
                                <p className="text-gray-600 italic mt-1 flex items-start gap-1">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  {room.specialNote}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6l4 2m4-6a8 8 0 11-16 0 8 8 0 0116 0z"
                    />
                  </svg>
                  <p className="font-medium">
                    Please select a branch to view available rooms
                  </p>
                </div>
              )}

              {selectedRoomId && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleProceed}
                    disabled={isApproving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Proceed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Confirm Rejection
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to reject this transfer request?
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
