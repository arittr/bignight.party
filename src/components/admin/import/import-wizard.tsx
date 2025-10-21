"use client";

import { ChevronLeft } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ImportForm } from "./import-form";
import { type ImportedNomination, PreviewTable } from "./preview-table";

type WizardStep = "input" | "preview" | "confirm";

export interface ImportWizardProps {
  onFetchNominations: (url: string) => Promise<ImportedNomination[]>;
  onImport: (nominations: ImportedNomination[]) => Promise<void>;
  className?: string;
}

export function ImportWizard({ onFetchNominations, onImport, className }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = React.useState<WizardStep>("input");
  const [url, setUrl] = React.useState<string>("");
  const [nominations, setNominations] = React.useState<ImportedNomination[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [showImportConfirm, setShowImportConfirm] = React.useState(false);

  const hasData = url !== "" || nominations.length > 0;

  const handleFetchSubmit = async (submittedUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedNominations = await onFetchNominations(submittedUrl);
      setUrl(submittedUrl);
      setNominations(fetchedNominations);
      setSelectedIds(fetchedNominations.map((n) => n.id));
      setCurrentStep("preview");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch nominations";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "preview") {
      setCurrentStep("input");
    }
  };

  const handleNext = () => {
    if (currentStep === "preview") {
      if (selectedIds.length === 0) {
        toast.warning("Please select at least one nomination to import.");
        return;
      }
      setShowImportConfirm(true);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);

    try {
      const selectedNominations = nominations.filter((n) => selectedIds.includes(n.id));
      await onImport(selectedNominations);
      toast.success("Nominations imported successfully!");

      // Reset wizard
      setCurrentStep("input");
      setUrl("");
      setNominations([]);
      setSelectedIds([]);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import nominations";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasData) {
      setShowCancelConfirm(true);
    } else {
      resetWizard();
    }
  };

  const resetWizard = () => {
    setCurrentStep("input");
    setUrl("");
    setNominations([]);
    setSelectedIds([]);
    setError(null);
  };

  const getStepNumber = (): number => {
    switch (currentStep) {
      case "input":
        return 1;
      case "preview":
        return 2;
      case "confirm":
        return 3;
      default:
        return 1;
    }
  };

  const progressValue = (getStepNumber() / 3) * 100;

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Import Nominations</CardTitle>
          <CardDescription>
            Import nominations from external sources in three easy steps.
          </CardDescription>
          <div className="mt-4">
            <Progress aria-label="Import progress" value={progressValue} />
            <p className="mt-2 text-sm text-muted-foreground">Step {getStepNumber()} of 3</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === "input" && (
            <ImportForm error={error} isLoading={isLoading} onSubmit={handleFetchSubmit} />
          )}

          {currentStep === "preview" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Review Nominations</h3>
                <p className="text-sm text-muted-foreground">
                  Review the fetched nominations and deselect any you don't want to import.
                </p>
              </div>

              <PreviewTable
                data={nominations}
                onSelectionChange={setSelectedIds}
                selectedIds={selectedIds}
              />

              <div className="flex justify-between">
                <Button
                  aria-label="Go back to URL input"
                  disabled={isLoading}
                  onClick={handleBack}
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    disabled={isLoading}
                    onClick={handleCancel}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    aria-label="Proceed to import"
                    disabled={isLoading || selectedIds.length === 0}
                    onClick={handleNext}
                    type="button"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        confirmLabel="Yes, Cancel"
        description="You have unsaved data. Are you sure you want to cancel? All progress will be lost."
        onConfirm={resetWizard}
        onOpenChange={setShowCancelConfirm}
        open={showCancelConfirm}
        title="Cancel Import?"
        variant="destructive"
      />

      <ConfirmDialog
        confirmLabel="Import"
        description={`You are about to import ${selectedIds.length} nomination${selectedIds.length === 1 ? "" : "s"}. This action cannot be undone.`}
        isLoading={isLoading}
        onConfirm={handleImport}
        onOpenChange={setShowImportConfirm}
        open={showImportConfirm}
        title="Confirm Import"
      />
    </>
  );
}
