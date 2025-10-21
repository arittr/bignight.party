"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const importUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type ImportUrlData = z.infer<typeof importUrlSchema>;

export interface ImportFormProps {
  onSubmit: (url: string) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function ImportForm({ onSubmit, isLoading = false, error, className }: ImportFormProps) {
  const inputId = useId();
  const errorId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ImportUrlData>({
    resolver: zodResolver(importUrlSchema),
  });

  const handleFormSubmit = (data: ImportUrlData) => {
    onSubmit(data.url);
  };

  return (
    <form
      aria-label="Import nominations form"
      className={cn("space-y-4", className)}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      {error && (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={inputId}>Source URL</Label>
        <Input
          {...register("url")}
          aria-describedby={errors.url ? errorId : undefined}
          aria-invalid={Boolean(errors.url)}
          disabled={isLoading}
          id={inputId}
          placeholder="https://example.com/nominations"
          type="url"
        />
        {errors.url && (
          <p className="text-sm text-destructive" id={errorId} role="alert">
            {errors.url.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Enter the URL of the page containing nominations to import. Supported sources: Wikipedia,
          IMDB, and other structured data sources.
        </p>
      </div>

      <div className="flex justify-end">
        <Button aria-label="Fetch nominations" disabled={isLoading} type="submit">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Fetch Nominations
        </Button>
      </div>
    </form>
  );
}
