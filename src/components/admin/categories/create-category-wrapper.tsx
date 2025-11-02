"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import type { CategoryCreateInput } from "@/schemas/category-schema";
import { CreateCategoryForm } from "./create-category-form";

export interface CreateCategoryWrapperProps {
	eventId: string;
}

export function CreateCategoryWrapper({ eventId }: CreateCategoryWrapperProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const mutation = useMutation(
		orpc.admin.categories.create.mutationOptions({
			onError: (err) => {
				setError(err.message || "Failed to create category");
			},
			onSuccess: () => {
				router.push(routes.admin.events.detail(eventId));
			},
		}),
	);

	const handleSubmit = async (data: CategoryCreateInput) => {
		setError(null);
		await mutation.mutateAsync(data);
	};

	const handleCancel = () => {
		router.push(routes.admin.events.detail(eventId));
	};

	return (
		<CreateCategoryForm
			error={error}
			eventId={eventId}
			isLoading={mutation.isPending}
			onCancel={handleCancel}
			onSubmit={handleSubmit}
		/>
	);
}
