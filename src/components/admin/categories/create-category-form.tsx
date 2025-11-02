"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm, AdminFormField } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { categoryCreateSchema } from "@/schemas/category-schema";

// Wire format type
type CategoryFormData = z.infer<typeof categoryCreateSchema>;

export interface CreateCategoryFormProps {
	eventId: string;
	onSubmit: (data: CategoryFormData) => void | Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
	error?: string | null;
}

export function CreateCategoryForm({
	eventId,
	onSubmit,
	onCancel,
	isLoading = false,
	error,
}: CreateCategoryFormProps) {
	const form = useForm<CategoryFormData>({
		defaultValues: {
			eventId,
			isRevealed: false,
			name: "",
			order: 0,
			points: 1,
		},
		resolver: zodResolver(categoryCreateSchema),
	});

	return (
		<AdminForm
			ariaLabel="Create category form"
			error={error}
			form={form}
			isLoading={isLoading}
			onCancel={onCancel}
			onSubmit={onSubmit}
			submitLabel="Create Category"
		>
			<FormFieldGroup<CategoryFormData, "name">
				ariaLabel="Category name"
				label="Category Name"
				name="name"
				placeholder="e.g., Best Picture, Best Director"
				required
				type="text"
			/>

			<div className="grid grid-cols-2 gap-4">
				<AdminFormField
					description="Order in which this category appears"
					label="Display Order"
					name="order"
					required
				>
					{(field) => (
						<Input
							{...(field as { name: string; onBlur: () => void; ref: React.Ref<HTMLInputElement> })}
							aria-label="Display order"
							min={0}
							onChange={(e) => {
								const value = e.target.value;
								(field as { onChange: (value: number) => void }).onChange(
									value === "" ? 0 : Number.parseInt(value, 10),
								);
							}}
							type="number"
							value={(field as { value: number }).value}
						/>
					)}
				</AdminFormField>

				<AdminFormField
					description="Points awarded for correct pick"
					label="Points"
					name="points"
					required
				>
					{(field) => (
						<Input
							{...(field as { name: string; onBlur: () => void; ref: React.Ref<HTMLInputElement> })}
							aria-label="Points value"
							min={1}
							onChange={(e) => {
								const value = e.target.value;
								(field as { onChange: (value: number) => void }).onChange(
									value === "" ? 1 : Number.parseInt(value, 10),
								);
							}}
							type="number"
							value={(field as { value: number }).value}
						/>
					)}
				</AdminFormField>
			</div>

			<AdminFormField
				description="Check if this category's winner has been revealed"
				label="Is Revealed"
				name="isRevealed"
			>
				{(field) => (
					<Checkbox
						aria-label="Is revealed"
						checked={(field as { value: boolean }).value}
						onCheckedChange={(checked) => {
							(field as { onChange: (value: boolean) => void }).onChange(
								checked === true,
							);
						}}
					/>
				)}
			</AdminFormField>
		</AdminForm>
	);
}
