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
import { Eye, Phone, Clock, Truck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api, { API_HOST } from "@/lib/axios";
import { RoleWrapper } from "@/lib/RoleWrapper";
import { useAuth } from "../providers/auth-provider";
import broken from "../../public/broken.jpg";

interface UsersTableProps {
  filteredUsers: any[];
  handleViewUser: (userId: string) => void;
}

export default function UsersTable({
  filteredUsers,
  handleViewUser,
}: UsersTableProps) {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<any>(undefined);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // ✅ Color and Icon Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "requested":
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
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // ✅ Reject Modal Functions
  const handleRejectClick = (user: any) => {
    setSelectedUserId(user._id);
    setSelectedUserData(user);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedUserId) return;
    try {
      setIsRejecting(true);
      await api.post("/su-removal/reject-other-removals", {
        guestIds: [selectedUserId],
        rejectionReason:
          "Request Rejected - insufficient documentation provided",
      });
      await queryClient.invalidateQueries({ queryKey: ["otherRemovals"] });
      setIsRejectModalOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  // ✅ Approve Modal Functions
  const handleApproveClick = (user: any) => {
    setSelectedUserId(user._id);
    setSelectedUserData(user);
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedUserId) return;
    try {
      setIsApproving(true);
      await api.post("/su-removal/approve-other-removals", {
        guestIds: [selectedUserId],
        approvalNotes: "Approved for eviction due to rule violations",
      });
      await queryClient.invalidateQueries({ queryKey: ["otherRemovals"] });
      setIsApproveModalOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error("Error approving user:", error);
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
            <TableHead>Reason</TableHead>
            <TableHead>Attachment</TableHead>
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
                    {user?.guestId?.userId?.phoneNumber||"No Phone Number Provided"}
                  </div>
                  {/* <div className="flex items-center text-xs">
                    {user?.guestId?.userId?.emailAddress}
                  </div> */}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-xs">
                    Room: {user?.guestId?.familyRooms?.[0]?.roomId?.roomNumber}
                  </div>
                  <div className="text-xs">
                    Location:{" "}
                    {user?.guestId?.familyRooms?.[0]?.locationId?.name}
                  </div>
                  <div className="text-xs">Branch: {user?.branchId?.name}</div>
                </div>
              </TableCell>

              <TableCell className="max-w-sm">
                <div className="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 w-fit rounded-xl">
                  {user?.guestId?.removal?.reason || "N/A"}
                </div>
              </TableCell>

              <TableCell>
                {user?.removalAttachmentFile?.viewUrl ? (
                  <>
                    <img
                      src={`${API_HOST}${user.removalAttachmentFile.viewUrl}`}
                      alt={
                        user.removalAttachmentFile.originalName || "Attachment"
                      }
                      className="h-12 w-12 rounded-md object-cover border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = broken.src;
                      }}
                      onClick={() => {
                        setSelectedUserData(user); // store selected image user
                        setIsImageModalOpen(true); // open image modal
                      }}
                    />

                    {/* 🖼️ Image Preview Modal */}
                    {isImageModalOpen && selectedUserData?._id === user._id && (
                      <Dialog
                        open={isImageModalOpen}
                        onOpenChange={setIsImageModalOpen}
                      >
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-800">
                              Attachment Preview
                            </DialogTitle>
                          </DialogHeader>

                          <div className="flex justify-center py-4">
                            <img
                              src={`${API_HOST}${user.removalAttachmentFile.viewUrl}`}
                              alt={
                                user.removalAttachmentFile.originalName ||
                                "Attachment"
                              }
                              className="max-h-[70vh] rounded-lg object-contain border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = broken.src;
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-500 italic">
                    No Image Provided
                  </div>
                )}
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
                    {user.removalStatus === "requested" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveClick(user)}
                          className="bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 hover:border-green-300"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(user)}
                          className="bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 hover:border-red-300"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleViewUser(user._id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ✅ Reject Confirmation Modal */}
      <Dialog
        open={isRejectModalOpen}
        onOpenChange={(open) => {
          setIsRejectModalOpen(open);
          if (!open) {
            setSelectedUserData(undefined);
            setSelectedUserId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Confirm Rejection
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-gray-600">
              Are you sure you want to reject this request?
            </p>
            {selectedUserData?.guestId?.removal?.reason && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-800">Reason:</span>{" "}
                  {selectedUserData.guestId.removal.reason}
                </p>
              </div>
            )}
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
              {isRejecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Approve Confirmation Modal */}
      <Dialog
        open={isApproveModalOpen}
        onOpenChange={(open) => {
          setIsApproveModalOpen(open);
          if (!open) {
            setSelectedUserData(undefined);
            setSelectedUserId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Confirm Approval
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <p className="text-gray-600">
              Are you sure you want to approve this removal request?
            </p>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsApproveModalOpen(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmApprove}
              disabled={isApproving}
            >
              {isApproving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
