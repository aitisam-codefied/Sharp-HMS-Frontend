import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useBranches } from "@/hooks/useGetBranches";
import dynamic from "next/dynamic";
import html2pdf from "html2pdf.js";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SignaturePad = dynamic(() => import("react-signature-pad-wrapper"), {
  ssr: false,
});

export default function ReviewConfirmationForm({
  formData,
  setFormData,
  rooms,
}: any) {
  const numDependants = Number(formData.guests[0]?.numberOfDependents) || 0;
  const totalPeople = numDependants + 1;
  const { data: branchData } = useBranches();
  const sigRef = useRef<SignaturePad | null>(null);
  const suSigRef = useRef<SignaturePad | null>(null); // Added ref for service user signature
  const formRef = useRef<HTMLDivElement | null>(null);
  const [isSavingAdminSig, setIsSavingAdminSig] = useState(false);
  const [isSavingSUSig, setIsSavingSUSig] = useState(false);
  const [adminSigSaved, setAdminSigSaved] = useState(false);
  const [suSigSaved, setSuSigSaved] = useState(false);
  const { toast } = useToast();

  const getBranchName = (branchId: string) => {
    return branchData?.find((b: any) => b._id === branchId)?.name || branchId;
  };

  const handleConsentChange = (consentType: string, checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      [consentType]: checked,
    }));
  };

  const saveSignature = async () => {
    if (!sigRef.current) return;
    
    setIsSavingAdminSig(true);
    setAdminSigSaved(false);
    
    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const dataUrl = sigRef.current.toDataURL("image/png");

      // Convert base64 → Blob
      const byteString = atob(dataUrl.split(",")[1]);
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Convert Blob → File
      const file = new File([blob], "signature.png", { type: "image/png" });

      // Save to formData
      setFormData((prev: any) => ({
        ...prev,
        signature: file, // UploadedFile format
      }));
      
      setAdminSigSaved(true);
      toast({
        title: "Success",
        description: "Admin signature saved successfully",
      });
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive",
      });
    } finally {
      setIsSavingAdminSig(false);
    }
  };

  const clearSignature = () => {
    if (sigRef.current) {
      sigRef.current.clear(); // canvas se clear
    }

    setFormData((prev: any) => ({
      ...prev,
      signature: "", // state se bhi clear
    }));
    
    setAdminSigSaved(false);
  };

  const saveSUSignature = async () => {
    // Added function to save service user signature
    if (!suSigRef.current) return;
    
    setIsSavingSUSig(true);
    setSuSigSaved(false);
    
    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const dataUrl = suSigRef.current.toDataURL("image/png");

      // Convert base64 → Blob
      const byteString = atob(dataUrl.split(",")[1]);
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Convert Blob → File
      const file = new File([blob], "su_signature.png", { type: "image/png" });

      // Save to formData
      setFormData((prev: any) => ({
        ...prev,
        suSignature: file, // UploadedFile format
      }));
      
      setSuSigSaved(true);
      toast({
        title: "Success",
        description: "Service user signature saved successfully",
      });
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive",
      });
    } finally {
      setIsSavingSUSig(false);
    }
  };

  const clearSUSignature = () => {
    // Added function to clear service user signature
    if (suSigRef.current) {
      suSigRef.current.clear(); // canvas se clear
    }

    setFormData((prev: any) => ({
      ...prev,
      suSignature: "", // state se bhi clear
    }));
    
    setSuSigSaved(false);
  };

  const [pdf, setPdf] = useState<File | null>(null);

  const generatePDF = () => {
    if (formRef.current) {
      const element = formRef.current;
      const opt = {
        margin: 0.5,
        filename: `Review_Confirmation_${
          formData.guests[0]?.fullName || "User"
        }.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get("pdf")
        .then((pdfObj: any) => {
          const blob = pdfObj.output("blob");
          const file = new File(
            [blob],
            `Review_Confirmation_${formData.guests[0]?.fullName || "User"}.pdf`,
            { type: "application/pdf" }
          );

          setPdf(file);

          // ✅ direct File assign
          setFormData((prev: any) => ({
            ...prev,
            occupancyAgreement: file,
          }));
        })
        .catch((error: any) => {
          console.error("PDF generation failed:", error);
        });
    }
  };

  // 🔹 Page load pe PDF generate karo
  useEffect(() => {
    generatePDF();
  }, []);

  // 🔹 Download trigger
  const downloadPDF = () => {
    if (pdf) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdf);
      link.download = pdf.name;
      link.click();
      URL.revokeObjectURL(link.href);

      // Auto-check after download
      handleConsentChange("occupancy", true);
    }
  };

  return (
    <div
      ref={formRef}
      className="container mx-auto space-y-10 p-0 sm:p-6 min-h-screen"
    >
      <div className="flex justify-end">
        <Button
          onClick={downloadPDF} // ab direct state se download hoga
          disabled={!pdf} // agar PDF abhi generate nahi hui
          className="bg-[#F87D7D] hover:bg-[#E66B6B] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Download PDF
        </Button>
      </div>

      {/* assigned rooms */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-[#F87D7D] tracking-tight">
          Assigned Rooms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(formData.assignedRooms || {}).map(
            ([roomId, assigned]: any) => {
              const room = rooms.find(
                (r: any) => String(r.id) === String(roomId)
              );
              if (!room || assigned <= 0) return null;
              return (
                <Card
                  key={roomId}
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white border border-gray-200 rounded-xl"
                >
                  <CardHeader className="bg-[#F87D7D] text-white rounded-t-xl">
                    <CardTitle className="text-lg font-semibold">
                      Room {room.roomNumber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700">
                      <span className="font-medium">Assigned:</span> {assigned}{" "}
                      people
                    </p>

                    <p className="text-gray-700">
                      <span className="font-medium">Location:</span>{" "}
                      {room.location}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Amenities:</span>{" "}
                      {room.amenities.join(", ")}
                    </p>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </div>

      {/* user + dependant details */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-[#F87D7D] tracking-tight">
          User Details
        </h3>
        {[...Array(totalPeople)].map((_, i) => {
          return (
            <Card
              key={i}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white border border-gray-200 rounded-xl"
            >
              <CardHeader className="bg-gradient-to-r from-[#F87D7D] to-[#FFB2B2] text-white rounded-t-xl">
                <CardTitle className="text-xl font-semibold">
                  {i === 0 ? "Primary User" : `Dependant ${i}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-[#F87D7D] mb-3">
                    Personal Information
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">Name:</dt>
                      <dd className="text-gray-800">
                        {formData?.guests[i]?.fullName || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Email:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.emailAddress || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Phone:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.phoneNumber || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">DOB:</dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.dateOfBirth || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Gender:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.gender || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Nationality:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.nationality || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Address:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.address || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Notes:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.additionalNotes || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Language:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.language || "N/A"}
                      </dd>
                    </div>
                    {/* {i === 0 && (
                      <div className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">
                          Branch:
                        </dt>
                        <dd className="text-gray-800">
                          {formData?.branchId || "N/A"}
                        </dd>
                      </div>
                    )} */}
                  </dl>
                </div>
                {/* {Number(formData.guests[0].numberOfDependents) === 0 ||
                formData.sameEmergencyContact ? (
                  <div>
                    <h4 className="text-lg font-semibold text-[#F87D7D] mb-3">
                      Emergency Contact
                    </h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">
                          Name:
                        </dt>
                        <dd className="text-gray-800">
                          {formData.emergencyContact?.fullName || "N/A"}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">
                          Phone:
                        </dt>
                        <dd className="text-gray-800">
                          {formData.emergencyContact?.phoneNumber || "N/A"}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">
                          Relation:
                        </dt>
                        <dd className="text-gray-800">
                          {formData.emergencyContact?.relationship || "N/A"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-lg font-semibold text-[#F87D7D] mb-3">
                      Emergency Contact(s)
                    </h4>

                    <div className="mb-4 border p-4 rounded-lg">
                      <h5 className="font-semibold mb-2">Primary User</h5>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex">
                          <dt className="font-medium text-gray-600 w-1/3">
                            Name:
                          </dt>
                          <dd className="text-gray-800">
                            {formData.guests[0]?.emergencyContact?.fullName ||
                              "N/A"}
                          </dd>
                        </div>
                        <div className="flex">
                          <dt className="font-medium text-gray-600 w-1/3">
                            Phone:
                          </dt>
                          <dd className="text-gray-800">
                            {formData.guests[0]?.emergencyContact
                              ?.phoneNumber || "N/A"}
                          </dd>
                        </div>
                        <div className="flex">
                          <dt className="font-medium text-gray-600 w-1/3">
                            Relation:
                          </dt>
                          <dd className="text-gray-800">
                            {formData.guests[0]?.emergencyContact
                              ?.relationship || "N/A"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                  
                    {formData.guests.slice(1).map((guest: any, i: number) => (
                      <div key={i} className="mb-4 border p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">
                          Dependant {i + 1}
                        </h5>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex">
                            <dt className="font-medium text-gray-600 w-1/3">
                              Name:
                            </dt>
                            <dd className="text-gray-800">
                              {guest.emergencyContact?.fullName || "N/A"}
                            </dd>
                          </div>
                          <div className="flex">
                            <dt className="font-medium text-gray-600 w-1/3">
                              Phone:
                            </dt>
                            <dd className="text-gray-800">
                              {guest.emergencyContact?.phoneNumber || "N/A"}
                            </dd>
                          </div>
                          <div className="flex">
                            <dt className="font-medium text-gray-600 w-1/3">
                              Relation:
                            </dt>
                            <dd className="text-gray-800">
                              {guest.emergencyContact?.relationship || "N/A"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                )} */}

                <div>
                  <h4 className="text-lg font-semibold text-[#F87D7D] mb-3">
                    Medical & Dietary
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Medical Conditions:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.medicalCondition || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Allergies:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.allergies || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Medications:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.currentMedications || "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Dietary Requirements:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[i]?.dietaryRequirements?.join(", ") ||
                          "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-[#F87D7D] tracking-tight">
          Emergency Contacts
        </h3>
        <Card className="shadow-lg bg-white border border-gray-200 rounded-xl">
          <CardContent className="p-6 space-y-6">
            {Number(formData.guests[0]?.numberOfDependents) === 0 ||
            formData.sameEmergencyContact ? (
              // 🔹 Case 1 & 2: Single user OR Same contact for all
              <div>
                <h4 className="text-lg font-semibold text-[#F87D7D] mb-3">
                  Emergency Contact
                </h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-1/3">Name:</dt>
                    <dd className="text-gray-800">
                      {formData.emergencyContact?.fullName || "N/A"}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-1/3">Phone:</dt>
                    <dd className="text-gray-800">
                      {formData.emergencyContact?.phoneNumber || "N/A"}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-1/3">
                      Relation:
                    </dt>
                    <dd className="text-gray-800">
                      {formData.emergencyContact?.relationship || "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              // 🔹 Case 3: Dependants > 0 aur alag-alag contacts
              <div>
                {/* Primary User */}
                <div className="mb-4 border p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Primary User</h5>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">Name:</dt>
                      <dd className="text-gray-800">
                        {formData.guests[0]?.emergencyContact?.fullName ||
                          "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Phone:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[0]?.emergencyContact?.phoneNumber ||
                          "N/A"}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        Relation:
                      </dt>
                      <dd className="text-gray-800">
                        {formData.guests[0]?.emergencyContact?.relationship ||
                          "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Dependants */}
                {formData.guests.slice(1).map((guest: any, i: number) => (
                  <div key={i} className="mb-4 border p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Dependant {i + 1}</h5>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">
                          Name:
                        </dt>
                        <dd className="text-gray-800">
                          {guest.emergencyContact?.fullName || "N/A"}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">
                          Phone:
                        </dt>
                        <dd className="text-gray-800">
                          {guest.emergencyContact?.phoneNumber || "N/A"}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">
                          Relation:
                        </dt>
                        <dd className="text-gray-800">
                          {guest.emergencyContact?.relationship || "N/A"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consents */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-[#F87D7D] tracking-tight">
          Consents
        </h3>
        <div className="space-y-6">
          <Card className="shadow-lg bg-white border border-gray-200 rounded-xl">
            <CardHeader className="bg-[#F87D7D] text-white rounded-t-xl">
              <CardTitle className="text-lg font-semibold">
                Consent for Service User
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="consent-accuracy"
                  checked={formData.consentAccuracy || false}
                  onCheckedChange={(checked) =>
                    handleConsentChange("consentAccuracy", checked as boolean)
                  }
                  className="border-[#F87D7D] data-[state=checked]:bg-[#F87D7D]"
                />
                <Label
                  htmlFor="consent-accuracy"
                  className="text-gray-700 text-sm leading-relaxed"
                >
                  I confirm that all information provided is accurate and
                  complete
                </Label>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white border border-gray-200 rounded-xl">
            <CardHeader className="bg-[#F87D7D] text-white rounded-t-xl">
              <CardTitle className="text-lg font-semibold">
                Consent for Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="consent-processing"
                  checked={formData.consentDataProcessing || false}
                  onCheckedChange={(checked) =>
                    handleConsentChange(
                      "consentDataProcessing",
                      checked as boolean
                    )
                  }
                  className="border-[#F87D7D] data-[state=checked]:bg-[#F87D7D]"
                />
                <Label
                  htmlFor="consent-processing"
                  className="text-gray-700 text-sm leading-relaxed"
                >
                  I have obtained consent for data processing and storage
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="consent-occupancy"
                  checked={formData?.occupancy || false}
                  onCheckedChange={(checked) =>
                    handleConsentChange("occupancy", checked as boolean)
                  }
                  className="border-[#F87D7D] data-[state=checked]:bg-[#F87D7D]"
                />
                <Label
                  htmlFor="consent-occupancy"
                  className="text-gray-700 text-sm leading-relaxed"
                >
                  Occupancy letter provided
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Signature */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-[#F87D7D] tracking-tight">
          Admin Digital Signature
        </h3>
        <Card className="shadow-lg bg-white border border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <SignaturePad
                  ref={sigRef}
                  canvasProps={{
                    width: "500",
                    height: "200",
                    className:
                      "border-2 border-[#F87D7D] rounded-lg bg-gray-50 w-full max-w-[500px]",
                  }}
                  options={{
                    minWidth: 0.5,
                    maxWidth: 2.5,
                    penColor: "black",
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button
                onClick={saveSignature}
                disabled={isSavingAdminSig}
                className="bg-[#F87D7D] hover:bg-[#E66B6B] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingAdminSig ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : adminSigSaved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  "Save Signature"
                )}
              </Button>
              <Button
                onClick={clearSignature}
                variant="outline"
                disabled={isSavingAdminSig}
                className="text-red-500 border-red-500 hover:bg-red-50"
              >
                Clear Signature
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service User Signature - Added new section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-[#F87D7D] tracking-tight">
          Service User Digital Signature
        </h3>
        <Card className="shadow-lg bg-white border border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <SignaturePad
                  ref={suSigRef}
                  canvasProps={{
                    width: "500",
                    height: "200",
                    className:
                      "border-2 border-[#F87D7D] rounded-lg bg-gray-50 w-full max-w-[500px]",
                  }}
                  options={{
                    minWidth: 0.5,
                    maxWidth: 2.5,
                    penColor: "black",
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button
                onClick={saveSUSignature}
                disabled={isSavingSUSig}
                className="bg-[#F87D7D] hover:bg-[#E66B6B] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingSUSig ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : suSigSaved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  "Save Signature"
                )}
              </Button>
              <Button
                onClick={clearSUSignature}
                variant="outline"
                disabled={isSavingSUSig}
                className="text-red-500 border-red-500 hover:bg-red-50"
              >
                Clear Signature
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
