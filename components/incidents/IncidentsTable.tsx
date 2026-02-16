"use client";

import { useState } from "react";
import axios from "axios";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api, { API_HOST } from "@/lib/axios";
import { RoleWrapper } from "@/lib/RoleWrapper";
import { useAuth } from "../providers/auth-provider";
import incidentPlaceholder from "../../public/incident_placeholder.jpg";
import Link from "next/link";

interface UIIncident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  reportedBy: string;
  assignedTo: string;
  branch: string;
  location: string;
  type: string;
  residentInvolved: string;
  dateReported: string;
  timeReported: string;
  dateResolved: string | null;
  timeResolved: string | null;
  category: string;
  evidence?: any;
  actionsTaken: string;
  portNumber: string;
}

interface IncidentsTableProps {
  incidents: UIIncident[];
  getSeverityColor: (severity: string) => string;
  getStatusColor: (status: string) => string;
  getCategoryColor: (category: string) => string;
  handleViewIncident: (incidentId: string) => void;
}

export default function IncidentsTable({
  incidents,
  getSeverityColor,
  getStatusColor,
  getCategoryColor,
}: IncidentsTableProps) {
  const [selectedIncident, setSelectedIncident] = useState<UIIncident | null>(
    null
  );
  const [status, setStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedPortId, setCopiedPortId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleStatusUpdate = async () => {
    if (!selectedIncident || !status) return;
    setIsUpdating(true);

    try {
      await api.patch(`/incident/${selectedIncident.id}/resolve`, {
        status,
        resolutionNotes: "Issue resolved", // static note
      });

      toast({
        title: "Status Updated",
        description: `Incident marked as ${status}`,
      });

      // Close modal & reset
      setSelectedIncident(null);
      setStatus("");
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description:
          error.response?.data?.message ||
          error.response?.data?.details ||
          error.message ||
          error.response?.data?.error ||
          "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evidence</TableHead>
            <TableHead>Resident</TableHead>
            <TableHead>Port Number</TableHead>
            <TableHead>Incident Details</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Incident Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reported</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id} className="text-xs">
              <TableCell>
                {incident.evidence ? (
                  <img
                    src={`${API_HOST}${incident.evidence}`}
                    alt="Evidence"
                    className="w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80 transition"
                    onClick={() =>
                      setPreviewImage(`${API_HOST}${incident.evidence}`)
                    }
                    onError={(e) => {
                      e.currentTarget.src = incidentPlaceholder.src; // fallback image
                    }}
                  />
                ) : (
                  <span className="text-gray-400 italic text-sm">No image</span>
                )}
              </TableCell>

              <TableCell className="capitalize">
                <Link
                  href={`/service-users?highlight=${incident.residentInvolved}`}
                  className="hover:underline cursor-pointer"
                >
                  {incident.residentInvolved}
                </Link>
              </TableCell>

              <TableCell className="">
                <div className="flex items-center justify-center gap-1">
                  <div>{incident.portNumber}</div>
                  <div>
                    {incident.portNumber && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(incident.portNumber);
                          setCopiedPortId(incident.id); // jis user ka copy kiya uska id set
                          setTimeout(() => setCopiedPortId(null), 2000); // 2 sec baad reset
                        }}
                        className="text-gray-500 hover:text-black transition-colors"
                      >
                        {copiedPortId === incident.id ? (
                          <Check size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="max-w-[250px]">
                {incident.description}
              </TableCell>

              <TableCell className="capitalize">{incident.branch}</TableCell>

              <TableCell>
                <div
                  className={`w-fit px-2 py-1 rounded ${getCategoryColor(
                    incident.category
                  )}`}
                >
                  {incident.category}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-2 capitalize">
                  <div
                    className={`w-fit px-2 py-1 rounded ${getSeverityColor(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(incident.status)} capitalize`}
                  >
                    {incident.status}
                  </Badge>
                  {RoleWrapper(
                    user?.roles[0]?.name,
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setStatus(
                          incident?.status?.charAt(0)?.toUpperCase() +
                            incident?.status?.slice(1)?.toLowerCase()
                        );
                      }}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  <div className="">{incident.dateReported}</div>
                  <div className="text-muted-foreground">
                    {incident.timeReported}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by {incident.reportedBy}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* === Status Update Modal === */}
      <Dialog
        open={!!selectedIncident}
        onOpenChange={() => setSelectedIncident(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Incident Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Select Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedIncident(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#F87D7D] text-white"
                onClick={handleStatusUpdate}
                disabled={isUpdating || !status}
              >
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Evidence Preview Modal === */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Evidence Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="mt-4 flex-1 overflow-hidden flex items-center justify-center">
              <img
                src={previewImage}
                alt="Full Evidence"
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
                onError={(e) => {
                  e.currentTarget.src = incidentPlaceholder.src; // fallback image
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
