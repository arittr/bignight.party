"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import type { CategoryUpdateInput } from "@/schemas/category-schema";
import { EditCategoryForm } from "./edit-category-form";

export interface EditCategoryWrapperProps {
	eventId: string;
	category: {
		id: string;
		name: string;
		order: number;
		points: number;
		isRevealed: boolean;
	};
}

export function EditCategoryWrapper({ eventId, category }: EditCategoryWrapperProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const mutation = useMutation(
		orpc.admin.categories.update.mutationOptions({
			onError: (err) => {
				setError(err.message || "Failed to update category");
			},
			onSuccess: () => {
				// Refresh the page to show updated data
				router.refresh();
				setError(null);
			},
		}),
	);

	const handleSubmit = async (data: CategoryUpdateInput) => {
		setError(null);
		await mutation.mutateAsync(data);
	};

	const handleCancel = () => {
		router.push(routes.admin.events.detail(eventId));
	};

	return (
		<EditCategoryForm
			error={error}
			initialData={category}
			isLoading={mutation.isPending}
			onCancel={handleCancel}
			onSubmit={handleSubmit}
		/>
	);
}
