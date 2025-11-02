"use client";

import { useMutation } from "@tanstack/react-query";
import type { Person } from "@prisma/client";
import { orpc } from "@/lib/api/client";
import type { PersonUpdateInput } from "@/schemas/person-schema";
import { PersonForm } from "./person-form";

interface EditPersonFormProps {
  person: Person;
}

export function EditPersonForm({ person }: EditPersonFormProps) {
  const mutation = useMutation(orpc.admin.people.update.mutationOptions());

  async function handleSubmit(data: Partial<PersonUpdateInput>) {
    await mutation.mutateAsync({
      id: person.id,
      ...data,
    });
  }

  return (
    <PersonForm
      error={mutation.error?.message ?? null}
      initialData={{
        externalId: person.externalId ?? "",
        imageUrl: person.imageUrl ?? "",
        name: person.name,
      }}
      isLoading={mutation.isPending}
      onSubmit={handleSubmit}
      submitLabel="Update Person"
    />
  );
}
