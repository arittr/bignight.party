import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateCategoryWrapper } from "@/components/admin/categories/create-category-wrapper";
import * as eventModel from "@/lib/models/event";
import { routes } from "@/lib/routes";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function NewCategoryPage(props: Props) {
	const params = await props.params;
	const event = await eventModel.findById(params.id);

	if (!event) {
		redirect(routes.admin.events.index());
	}

	return (
		<div className="max-w-2xl">
			<div className="mb-6">
				<Link
					className="text-blue-600 hover:underline text-sm"
					href={routes.admin.events.detail(params.id)}
				>
					← Back to {event.name}
				</Link>
			</div>

			<h1 className="text-3xl font-bold mb-6">Create New Category</h1>

			<div className="bg-white p-6 rounded-lg shadow">
				<CreateCategoryWrapper eventId={params.id} />
			</div>
		</div>
	);
}
