"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Package, Search, Calendar, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Basket } from "@/hooks/useGetBaskets";
import { CustomPagination } from "../CustomPagination";
import { Modal, Tree } from "antd";
import { DataNode } from "antd/es/tree";
import { API_HOST } from "@/lib/axios";
import Link from "next/link";

interface BasketsTableProps {
  baskets: Basket[];
}

export const BasketsTable = ({ baskets }: BasketsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [expandedBasketId, setExpandedBasketId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedPortId, setCopiedPortId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();

  useEffect(() => {
    console.log("baskets", baskets);
  });

  const branches = [
    "All Branches",
    ...new Set(
      baskets?.map((basket) => basket.branchId?.name)?.filter(Boolean)
    ),
  ];
  const statuses = ["all", "Out Of Stock", "Requested", "In Progress"];

  // 🔹 Filtered + Sorted Data
  const filteredBaskets = useMemo(() => {
    return baskets
      ?.filter((basket) => {
        const matchesSearch =
          basket.guestId?.userId?.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          basket.notes.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch =
          selectedBranch === "all" || basket.branchId?.name === selectedBranch;
        const matchesStatus =
          selectedStatus === "all" || basket.status === selectedStatus;

        return matchesSearch && matchesBranch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ); // latest pehle
  }, [baskets, searchTerm, selectedBranch, selectedStatus]);

  // 🔹 Pagination
  const totalPages = Math.ceil(filteredBaskets?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredBaskets?.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "on hold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      // hour: "2-digit",
      // minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Package className="h-5 w-5" />
          Service User Baskets
        </CardTitle>
        <CardDescription className="text-sm">
          Manage and track service user baskets across all branches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search baskets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statuses?.map((status) => (
                <SelectItem key={status} value={status}>
                  {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Port Number</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead>Key Metrics</TableHead>
                <TableHead>Assignment Details</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData?.map((basket) => (
                <TableRow className="text-xs" key={basket._id}>
                  <TableCell>
                    <Link
                      href={`/service-users?highlight=${basket.guestId?.userId?.fullName}`}
                      className="hover:underline cursor-pointer"
                    >
                      <div className="font-medium capitalize">
                        {basket.guestId?.userId?.fullName}
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-start gap-1">
                      <div>{basket.guestId?.userId?.portNumber}</div>
                      <div>
                        {basket.guestId?.userId?.portNumber && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                basket.guestId?.userId?.portNumber
                              );
                              setCopiedPortId(basket._id); // jis user ka copy kiya uska id set
                              setTimeout(() => setCopiedPortId(null), 2000); // 2 sec baad reset
                            }}
                            className="text-gray-500 hover:text-black transition-colors"
                          >
                            {copiedPortId === basket._id ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>{basket.branchId?.name || "Not Assigned"}</div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs flex items-center gap-2">
                      {/* Basket count */}
                      <span>Total Items : {basket?.basket?.length}</span>

                      {/* Expand/Collapse button - only show if items exist */}
                      {basket?.basket?.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedBasketId(
                              expandedBasketId === basket._id ? null : basket._id
                            )
                          }
                          className="text-white bg-gray-400 flex items-center justify-center w-4 h-4 rounded-full text-sm font-medium"
                        >
                          {expandedBasketId === basket._id ? "−" : "+"}
                        </button>
                      )}
                    </div>

                    {/* Expanded Content */}
                    {expandedBasketId === basket._id && (
                      <div className="mt-2 border rounded-md p-2 bg-gray-50 text-xs space-y-2">
                        {basket.basket.map((item: any, index: number) => (
                          <div
                            key={`${basket._id}-item-${index}`}
                            className="flex flex-col border-b last:border-b-0 pb-1"
                          >
                            {/* Item name + status */}
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {item.itemName} - {item.status}
                              </span>
                            </div>

                            {/* View Proof (only for Delivered) */}
                            {item.status === "Delivered" &&
                              item.proofOfDelivery && (
                                <span
                                  className="text-blue-500 cursor-pointer hover:underline mt-1 ml-2"
                                  onClick={() =>
                                    setPreviewImage(
                                      `${API_HOST}${item.proofOfDelivery}`
                                    )
                                  }
                                >
                                  View Proof
                                </span>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">
                        {Math.round(
                          (basket.deliveredItems / (basket.totalItems || 1)) *
                            100
                        )}
                        % Complete
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {basket.deliveredItems}/{basket.totalItems} items
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(basket.createdAt)}
                      </div>
                      <div className="text-muted-foreground">
                        By: {basket.staffId?.fullName || "Not Assigned"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(basket.status)}
                    >
                      {basket.status.charAt(0).toUpperCase() +
                        basket.status?.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {currentData?.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No baskets found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or create a new basket.
            </p>
          </div>
        )}

        {/* 🔹 Pagination */}
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page: any) => setCurrentPage(page)}
        />

        <Modal
          open={!!previewImage}
          footer={null}
          onCancel={() => setPreviewImage(null)}
          centered
        >
          {previewImage && (
            <img
              src={previewImage}
              alt="Proof of Delivery"
              className="w-full h-auto rounded-md mt-5"
            />
          )}
        </Modal>
      </CardContent>
    </Card>
  );
};
