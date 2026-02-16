"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Heart,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetWelfareChecks } from "@/hooks/useGetWelfareChecks";
import { CustomPagination } from "@/components/CustomPagination";
import { WelfareCheck } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import Link from "next/link";
import { API_HOST } from "@/lib/axios";
import incidentPlaceholder from "../../public/incident_placeholder.jpg";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialogHeader } from "@/components/ui/alert-dialog";

export default function WelfarePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedPortId, setCopiedPortId] = useState<string | null>(null);
  const itemsPerPage = 10; // ek page me 10 hi dikhayenge
  const { toast } = useToast();

  const formatDate = (dateString: any) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Backend se saare data fetch (pagination remove kar diya)
  const { data: welfareData, isLoading, error } = useGetWelfareChecks({});

  console.log("allWelfareChecks ===>", welfareData);

  const allWelfareChecks: any[] = (welfareData?.data as any)?.data || welfareData?.data?.results || [];

  // Filtering logic
  const filteredWelfareChecks = useMemo(() => {
    return allWelfareChecks.filter((check: any) => {
      const fullName = check.guestId?.userId?.fullName || "";
      const matchesSearch = fullName
        ?.toLowerCase()
        .includes(searchTerm?.toLowerCase());

      const lastDetail = check?.details?.[check?.details?.length - 1];
      const matchesStatus =
        selectedStatus === "all" ||
        lastDetail?.status?.toLowerCase() ===
          selectedStatus?.toLowerCase();

      // Date range filter
      const matchesDate =
        !dateRange?.from && !dateRange?.to
          ? true
          : (() => {
              const start = new Date(lastDetail?.weekStartDate);
              const end = new Date(lastDetail?.weekEndDate);

              if (dateRange?.from && end < dateRange.from) return false;
              if (dateRange?.to && start > dateRange.to) return false;

              return true;
            })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allWelfareChecks, searchTerm, selectedStatus, dateRange]);

  // Sort latest first
  const sortedWelfareChecks = useMemo(() => {
    return [...filteredWelfareChecks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredWelfareChecks]);

  // Frontend pagination
  const totalPages = Math.ceil(sortedWelfareChecks.length / itemsPerPage);
  const paginatedChecks = sortedWelfareChecks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredWelfareChecks]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ok":
        return "bg-green-100 text-green-800";
      case "critical":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health?.toLowerCase()) {
      case "ok":
        return "text-green-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getMentalStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case "ok":
      case "positive":
      case "stable":
        return "text-green-600";
      case "anxious":
      case "fair":
        return "text-yellow-600";
      case "distressed":
      case "poor":
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (error) {
    return (
      <DashboardLayout title="Welfare Check Management" description="Error">
        <div className="flex items-center justify-center h-64">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-500">
            Error loading welfare checks
          </span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Welfare Check Management"
      description="Monitor and manage resident welfare checks across all branches"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              Welfare Records
            </CardTitle>
            <CardDescription className="text-sm">
              Monitor and manage resident welfare checks across all branches
            </CardDescription>
          </CardHeader>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F87D7D] mx-auto"></div>
              <p className="mt-2"> Loading welfare data...</p>
            </div>
          ) : (
            <>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                      <Input
                        placeholder="Search by Guest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {/* Date Range Picker */}
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ok">OK</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Snapshot</TableHead>
                        <TableHead>Resident</TableHead>
                        <TableHead>Port Number</TableHead>
                        <TableHead>Checked By</TableHead>
                        <TableHead>Week Period</TableHead>
                        <TableHead>Physical Health</TableHead>
                        <TableHead>Mental Health</TableHead>
                        <TableHead>Emotional Wellbeing</TableHead>
                        <TableHead>Social Support</TableHead>
                        <TableHead>Overall Assessment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedChecks.map((check) => {
                        const lastDetail = check?.details?.[check?.details?.length - 1];
                        return (
                        <TableRow className="text-xs" key={check._id}>
                          <TableCell>
                            <img
                              src={`${API_HOST}${lastDetail?.images}`}
                              alt="Evidence"
                              className="w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80 transition"
                              onClick={() =>
                                setPreviewImage(
                                  `${API_HOST}${lastDetail?.images}`
                                )
                              }
                              onError={(e) => {
                                e.currentTarget.src = incidentPlaceholder.src; // fallback image
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Link
                              href={`/service-users?highlight=${check.guestId?.userId?.fullName}`}
                              className="hover:underline cursor-pointer"
                            >
                              <div className="capitalize">
                                {check.guestId?.userId?.fullName}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-start gap-1">
                              <div className="text-xs">
                                {check?.guestId?.userId?.portNumber}
                              </div>
                              <div>
                                {check?.guestId?.userId?.portNumber && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        check?.guestId?.userId?.portNumber
                                      );
                                      setCopiedPortId(check._id); // jis user ka copy kiya uska id set
                                      setTimeout(
                                        () => setCopiedPortId(null),
                                        2000
                                      ); // 2 sec baad reset
                                    }}
                                    className="text-gray-500 hover:text-black transition-colors"
                                  >
                                    {copiedPortId === check._id ? (
                                      <Check
                                        size={14}
                                        className="text-green-600"
                                      />
                                    ) : (
                                      <Copy size={14} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="capitalize">
                              {check?.staffId?.fullName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="">
                              {new Date(
                                lastDetail?.weekStartDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                lastDetail?.weekEndDate
                              ).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={getHealthColor(
                                lastDetail?.physicalHealth?.status
                              )}
                            >
                              {lastDetail?.physicalHealth?.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={getMentalStateColor(
                                lastDetail?.mentalHealth?.status
                              )}
                            >
                              {lastDetail?.mentalHealth?.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={getHealthColor(
                                lastDetail?.emotionalWellbeing?.status
                              )}
                            >
                              {lastDetail?.emotionalWellbeing?.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={getHealthColor(
                                lastDetail?.socialSupport?.status
                              )}
                            >
                              {lastDetail?.socialSupport?.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={getHealthColor(
                                lastDetail?.overallAssessment
                              )}
                            >
                              {lastDetail?.overallAssessment}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(
                                lastDetail?.status
                              )}
                            >
                              {lastDetail?.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-700 max-w-xs">
                              {lastDetail?.notes || "No comments"}
                            </div>
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>

                  {/* === Evidence Preview Modal === */}
                  <Dialog
                    open={!!previewImage}
                    onOpenChange={() => setPreviewImage(null)}
                  >
                    <DialogContent className="w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                      <AlertDialogHeader>
                        <DialogTitle>Evidence Preview</DialogTitle>
                      </AlertDialogHeader>
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
                {paginatedChecks.length === 0 && (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      No welfare checks found
                    </h3>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>

        {/* Pagination */}
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </DashboardLayout>
  );
}
