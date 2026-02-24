"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Utensils } from "lucide-react";
import { useGetMealMarkings } from "@/hooks/useGetMealMarking";
import MealsStats from "@/components/meals/MealsStats";
import MealsTable from "@/components/meals/MealsTable";
import { useCompanies } from "@/hooks/useCompnay";

export default function MealsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("all");
  type MealDetail = {
    marked: boolean;
    time: string | null;
    staff: string | null;
    reasonIfNotTaken: string | null;
    notes: string | null;
    markedAt: string | null;
    isEditable: boolean;
  };

  type Resident = {
    id: string;
    name: string;
    portNumber: string;
    room: string;
    branch: string;
    branchId: string;
    meals: {
      breakfast: MealDetail;
      lunch: MealDetail;
      dinner: MealDetail;
    };
    totalMealsTaken: number;
    mealDate: string | null;
    lastMeal: string;
    markingId: string;
  };

  const [residents, setResidents] = useState<Resident[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useGetMealMarkings();
  const { data: CompanyData } = useCompanies();

  const companyBranches =
    selectedCompany !== "all"
      ? CompanyData?.find((c: any) => c._id === selectedCompany)?.branches || []
      : [];

  useEffect(() => {
    setSelectedBranch("all");
  }, [selectedCompany]);

  // branch list
  const branches = companyBranches.map((b: any) => ({
    id: b._id,
    name: b.name,
  }));

  useEffect(() => {
    if (data) {
      const mappedResidents = data.map((item: any) => {
        const latestDetail = item?.details?.[item.details.length - 1];
        const meals = latestDetail?.meals;

        const mapMeal = (meal: any) => ({
          marked: meal?.taken ?? false,
          time: meal?.time || null,
          staff: item?.staffId?.fullName || null,
          reasonIfNotTaken: meal?.reasonIfNotTaken || null,
          notes: meal?.notes || null,
          markedAt: meal?.markedAt || null,
          isEditable: meal?.isEditable ?? true,
        });

        return {
          id: item?.guestId?.userId.portNumber,
          name: item?.guestId?.userId.fullName.trim(),
          portNumber: item?.guestId?.userId.portNumber,
          room: item?.guestId?.familyId,
          branch: item?.branchId?.name,
          branchId: item?.branchId?._id,
          meals: {
            breakfast: mapMeal(meals?.breakfast),
            lunch: mapMeal(meals?.lunch),
            dinner: mapMeal(meals?.dinner),
          },
          totalMealsTaken: latestDetail?.totalMealsTaken ?? 0,
          mealDate: latestDetail?.date || null,
          lastMeal: "None",
          markingId: item._id,
        };
      });
      setResidents(mappedResidents);
      setCurrentPage(1);
    }
  }, [data]);

  const filteredResidents = residents.filter((resident) => {
    const matchesSearch = resident?.name
      ?.toLowerCase()
      .includes(searchTerm?.toLowerCase());

    const matchesBranch =
      selectedBranch === "all" || resident.branchId === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranch]);

  return (
    <DashboardLayout
      title="Meal Tracking System"
      description="Track meal attendance and dietary requirements across all branches"
    >
      <div className="space-y-6">
        <MealsStats residents={filteredResidents} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Utensils className="h-5 w-5" />
              Meal Attendance Tracking
            </CardTitle>
            <CardDescription className="text-sm">
              Mark meal attendance for residents across all branches
            </CardDescription>
          </CardHeader>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F87D7D] mx-auto"></div>
              <p className="mt-2"> Loading meals...</p>
            </div>
          ) : (
            <CardContent>
              <div
                className={`grid gap-4 mb-6 ${
                  selectedCompany !== "all"
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Company */}
                <Select
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {CompanyData?.map((company: any) => (
                      <SelectItem key={company._id} value={company._id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Branch (only if company selected) */}
                {selectedCompany !== "all" && (
                  <Select
                    value={selectedBranch}
                    onValueChange={setSelectedBranch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <MealsTable
                residents={filteredResidents}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />

              {filteredResidents.length === 0 && (
                <div className="text-center py-8">
                  <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    No residents found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
