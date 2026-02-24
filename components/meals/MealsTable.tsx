"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  CheckCircle,
  Copy,
  XCircle,
  AlertCircle,
  StickyNote,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { CustomPagination } from "../CustomPagination";
import Link from "next/link";

type MealInfo = {
  marked: boolean;
  time: string | null;
  staff: string | null;
  reasonIfNotTaken: string | null;
  notes: string | null;
  markedAt: string | null;
  isEditable: boolean;
};

function formatTime(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MealCell({ meal }: { meal: MealInfo }) {
  if (meal.marked) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
          <span className="text-xs font-medium text-green-700">Delivered</span>
        </div>

        {meal.markedAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCheck className="h-3 w-3 shrink-0" />
            <span>Marked at {formatTime(meal.markedAt)}</span>
          </div>
        )}

        {meal.notes && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
            <span>{meal.notes}</span>
          </div>
        )}
      </div>
    );
  }

  if (!meal.isEditable) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-xs font-medium text-red-700">Not Taken</span>
        </div>

        {meal.reasonIfNotTaken && (
          <div className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md w-fit">
            {meal.reasonIfNotTaken}
          </div>
        )}

        {meal.markedAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCheck className="h-3 w-3 shrink-0" />
            <span>Marked at {formatTime(meal.markedAt)}</span>
          </div>
        )}

        {meal.notes && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
            <span>{meal.notes}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      <span className="text-xs font-medium text-amber-700">Pending</span>
    </div>
  );
}

export default function MealsTable({
  residents,
  currentPage,
  onPageChange,
}: any) {
  const itemsPerPage = 10;
  const totalPages = Math.ceil(residents.length / itemsPerPage);
  const [copiedPortId, setCopiedPortId] = useState<string | null>(null);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResidents = residents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resident</TableHead>
              <TableHead>Port Number</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Breakfast</TableHead>
              <TableHead>Lunch</TableHead>
              <TableHead>Dinner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResidents.map((resident: any) => (
              <TableRow key={resident.id + resident.markingId}>
                <TableCell>
                  <Link
                    href={`/service-users?highlight=${resident.name}`}
                    className="hover:underline cursor-pointer"
                  >
                    <div className="font-medium capitalize">
                      {resident.name}
                    </div>
                  </Link>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{resident?.portNumber}</span>
                    {resident?.portNumber && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(resident?.portNumber);
                          setCopiedPortId(resident.markingId);
                          setTimeout(() => setCopiedPortId(null), 2000);
                        }}
                        className="text-gray-500 hover:text-black transition-colors"
                      >
                        {copiedPortId === resident.markingId ? (
                          <Check size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm font-medium">{resident.branch}</span>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {resident.mealDate
                      ? formatDate(resident.mealDate)
                      : "No data"}
                  </span>
                </TableCell>

                <TableCell>
                  <MealCell meal={resident.meals.breakfast} />
                </TableCell>

                <TableCell>
                  <MealCell meal={resident.meals.lunch} />
                </TableCell>

                <TableCell>
                  <MealCell meal={resident.meals.dinner} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CustomPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
