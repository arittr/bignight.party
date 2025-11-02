"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import type { PersonCreateInput } from "@/schemas/person-schema";
import { PersonForm } from "./person-form";

export function CreatePersonForm() {
  const router = useRouter();

  const mutation = useMutation(
    orpc.admin.people.create.mutationOptions({
      onSuccess: () => {
        router.push(routes.admin.people.index());
      },
    })
  );

  async function handleSubmit(data: PersonCreateInput) {
    await mutation.mutateAsync(data);
  }

  return (
    <PersonForm
      error={mutation.error?.message ?? null}
      isLoading={mutation.isPending}
      onCancel={() => router.push(routes.admin.people.index())}
      onSubmit={handleSubmit}
      submitLabel="Create Person"
    />
  );
}
