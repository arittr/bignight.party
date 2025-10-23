import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AdminForm } from "./admin-form";
import { FormFieldGroup } from "./form-field-group";

// Test form schema
const testSchema = z.object({
  date: z.date(),
  description: z.string().optional(),
  name: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

type TestFormData = z.infer<typeof testSchema>;

// Test component wrapper
function TestForm({
  onSubmit,
  type,
  fieldName,
  options,
}: {
  onSubmit: (data: TestFormData) => void;
  type: "text" | "textarea" | "date" | "select";
  fieldName: keyof TestFormData;
  options?: Array<{ label: string; value: string }>;
}) {
  const form = useForm<TestFormData>({
    defaultValues: {
      date: new Date("2025-03-02"),
      description: "",
      name: "",
      status: "DRAFT",
    },
    resolver: zodResolver(testSchema),
  });

  return (
    <AdminForm form={form} onSubmit={onSubmit}>
      <FormFieldGroup
        label="Test Field"
        name={fieldName}
        options={options}
        placeholder="Test placeholder"
        type={type}
      />
    </AdminForm>
  );
}

describe("FormFieldGroup", () => {
  describe("Text Field", () => {
    it("renders text input with label", () => {
      render(<TestForm fieldName="name" onSubmit={() => {}} type="text" />);

      expect(screen.getByLabelText("Test Field")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Test placeholder")).toBeInTheDocument();
    });

    it("renders text input as input element", () => {
      render(<TestForm fieldName="name" onSubmit={() => {}} type="text" />);

      const input = screen.getByPlaceholderText("Test placeholder");
      expect(input.tagName).toBe("INPUT");
    });

    it("accepts user input for text field", async () => {
      const user = userEvent.setup();
      render(<TestForm fieldName="name" onSubmit={() => {}} type="text" />);

      const input = screen.getByPlaceholderText("Test placeholder");
      await user.type(input, "Test Value");

      expect(input).toHaveValue("Test Value");
    });
  });

  describe("Textarea Field", () => {
    it("renders textarea with label", () => {
      render(<TestForm fieldName="description" onSubmit={() => {}} type="textarea" />);

      expect(screen.getByLabelText("Test Field")).toBeInTheDocument();
    });

    it("renders textarea with correct rows", () => {
      function TestTextareaForm() {
        const form = useForm<TestFormData>({
          defaultValues: { date: new Date(), description: "", name: "", status: "DRAFT" },
        });

        return (
          <AdminForm form={form} onSubmit={() => {}}>
            <FormFieldGroup label="Description" name="description" rows={6} type="textarea" />
          </AdminForm>
        );
      }

      render(<TestTextareaForm />);

      const textarea = screen.getByLabelText("Description");
      expect(textarea).toHaveAttribute("rows", "6");
    });

    it("accepts user input for textarea", async () => {
      const user = userEvent.setup();
      render(<TestForm fieldName="description" onSubmit={() => {}} type="textarea" />);

      const textarea = screen.getByPlaceholderText("Test placeholder");
      await user.type(textarea, "Multi-line text");

      expect(textarea).toHaveValue("Multi-line text");
    });
  });

  describe("Date Field", () => {
    it("renders date input with label", () => {
      render(<TestForm fieldName="date" onSubmit={() => {}} type="date" />);

      expect(screen.getByLabelText("Test Field")).toBeInTheDocument();
    });

    it("renders date input with type attribute", () => {
      render(<TestForm fieldName="date" onSubmit={() => {}} type="date" />);

      const input = screen.getByPlaceholderText("Test placeholder");
      expect(input).toHaveAttribute("type", "date");
    });

    it("displays date value in correct format", () => {
      render(<TestForm fieldName="date" onSubmit={() => {}} type="date" />);

      const input = screen.getByPlaceholderText("Test placeholder") as HTMLInputElement;
      expect(input.value).toBe("2025-03-02");
    });
  });

  describe("Select Field", () => {
    const selectOptions = [
      { label: "Draft", value: "DRAFT" },
      { label: "Published", value: "PUBLISHED" },
    ];

    it("renders select with label", () => {
      render(
        <TestForm fieldName="status" onSubmit={() => {}} options={selectOptions} type="select" />
      );

      // Label should be present
      expect(screen.getByText("Test Field")).toBeInTheDocument();
      // Select should be present
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders select component", () => {
      render(
        <TestForm fieldName="status" onSubmit={() => {}} options={selectOptions} type="select" />
      );

      // Select should render with combobox role
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders select trigger", () => {
      render(
        <TestForm fieldName="status" onSubmit={() => {}} options={selectOptions} type="select" />
      );

      // Select trigger should be present
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
    });

    it("displays default selected value", () => {
      render(
        <TestForm fieldName="status" onSubmit={() => {}} options={selectOptions} type="select" />
      );

      // Default value from form is "DRAFT" - should be visible in the trigger
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Draft");
    });
  });

  describe("Field Props", () => {
    it("renders field with description", () => {
      function TestFormWithDescription() {
        const form = useForm<TestFormData>({
          defaultValues: { date: new Date(), description: "", name: "", status: "DRAFT" },
        });

        return (
          <AdminForm form={form} onSubmit={() => {}}>
            <FormFieldGroup
              description="This is a help text"
              label="Name"
              name="name"
              type="text"
            />
          </AdminForm>
        );
      }

      render(<TestFormWithDescription />);

      expect(screen.getByText("This is a help text")).toBeInTheDocument();
    });

    it("renders required indicator", () => {
      function TestFormRequired() {
        const form = useForm<TestFormData>({
          defaultValues: { date: new Date(), description: "", name: "", status: "DRAFT" },
        });

        return (
          <AdminForm form={form} onSubmit={() => {}}>
            <FormFieldGroup label="Name" name="name" required type="text" />
          </AdminForm>
        );
      }

      render(<TestFormRequired />);

      // Required indicator is rendered as *
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("renders field without label", () => {
      function TestFormNoLabel() {
        const form = useForm<TestFormData>({
          defaultValues: { date: new Date(), description: "", name: "", status: "DRAFT" },
        });

        return (
          <AdminForm form={form} onSubmit={() => {}}>
            <FormFieldGroup name="name" placeholder="No label field" type="text" />
          </AdminForm>
        );
      }

      render(<TestFormNoLabel />);

      expect(screen.getByPlaceholderText("No label field")).toBeInTheDocument();
      expect(screen.queryByText("Name")).not.toBeInTheDocument();
    });
  });

  describe("Type Safety", () => {
    it("eliminates need for type casting", () => {
      // This test verifies that TypeScript compilation succeeds
      // The component should work without any 'as' type assertions

      function TypeSafeForm() {
        const form = useForm<TestFormData>({
          defaultValues: { date: new Date(), description: "", name: "", status: "DRAFT" },
        });

        return (
          <AdminForm form={form} onSubmit={() => {}}>
            {/* All of these should compile without type assertions */}
            <FormFieldGroup name="name" type="text" />
            <FormFieldGroup name="description" type="textarea" />
            <FormFieldGroup name="date" type="date" />
            <FormFieldGroup
              name="status"
              options={[
                { label: "Draft", value: "DRAFT" },
                { label: "Published", value: "PUBLISHED" },
              ]}
              type="select"
            />
          </AdminForm>
        );
      }

      render(<TypeSafeForm />);

      // If this renders without TypeScript errors, the test passes
      expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty options array for select", () => {
      render(<TestForm fieldName="status" onSubmit={() => {}} options={[]} type="select" />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles missing placeholder", () => {
      function TestFormNoPlaceholder() {
        const form = useForm<TestFormData>({
          defaultValues: { date: new Date(), description: "", name: "", status: "DRAFT" },
        });

        return (
          <AdminForm form={form} onSubmit={() => {}}>
            <FormFieldGroup label="Name" name="name" type="text" />
          </AdminForm>
        );
      }

      render(<TestFormNoPlaceholder />);

      const input = screen.getByLabelText("Name");
      expect(input).toBeInTheDocument();
      expect(input).not.toHaveAttribute("placeholder");
    });

    it("handles default rows for textarea", () => {
      function TestTextareaDefaultRows() {
        const form = useForm<TestFormData>({
          defaultValues: { date: new Date(), description: "", name: "", status: "DRAFT" },
        });

        return (
          <AdminForm form={form} onSubmit={() => {}}>
            <FormFieldGroup label="Description" name="description" type="textarea" />
          </AdminForm>
        );
      }

      render(<TestTextareaDefaultRows />);

      const textarea = screen.getByLabelText("Description");
      expect(textarea).toHaveAttribute("rows", "4");
    });
  });
});
