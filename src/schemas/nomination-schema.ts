import { z } from "zod";

export const nominationCreateSchema = z
  .object({
    categoryId: z.string().cuid("Invalid category ID"),
    nominationText: z.string().min(1, "Nomination text is required"),
    personId: z.string().cuid("Invalid person ID").optional(),
    workId: z.string().cuid("Invalid work ID").optional(),
  })
  .refine((data) => data.workId || data.personId, {
    message: "At least one of workId or personId must be provided",
    path: ["workId"], // Shows error on workId field
  });

export const nominationUpdateSchema = z
  .object({
    categoryId: z.string().cuid("Invalid category ID").optional(),
    id: z.string().cuid("Invalid nomination ID"),
    nominationText: z.string().min(1, "Nomination text is required").optional(),
    personId: z.string().cuid("Invalid person ID").optional(),
    workId: z.string().cuid("Invalid work ID").optional(),
  })
  .refine(
    (data) => {
      // If both workId and personId are provided in update, at least one must be non-null
      // If neither is provided, we don't validate (existing values stay)
      const hasWorkId = data.workId !== undefined;
      const hasPersonId = data.personId !== undefined;

      if (!hasWorkId && !hasPersonId) {
        return true; // No validation needed if neither is being updated
      }

      return data.workId || data.personId;
    },
    {
      message: "At least one of workId or personId must be provided",
      path: ["workId"],
    }
  );

export type NominationCreateInput = z.infer<typeof nominationCreateSchema>;
export type NominationUpdateInput = z.infer<typeof nominationUpdateSchema>;
