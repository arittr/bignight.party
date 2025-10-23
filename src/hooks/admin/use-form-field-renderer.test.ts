import { renderHook } from "@testing-library/react";
import type { ControllerRenderProps } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { useFormFieldRenderer } from "./use-form-field-renderer";

interface TestFormData {
  name: string;
  description: string;
  eventDate: Date;
  status: string;
}

describe("useFormFieldRenderer", () => {
  const createMockField = (
    name: string,
    value: unknown
  ): ControllerRenderProps<TestFormData, keyof TestFormData> =>
    ({
      disabled: false,
      name,
      onBlur: vi.fn(),
      onChange: vi.fn(),
      ref: vi.fn(),
      value,
    }) as ControllerRenderProps<TestFormData, keyof TestFormData>;

  describe("text renderer", () => {
    it("should return field as-is for text inputs", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = createMockField("name", "Test Event");

      const rendered = result.current.text({
        ariaLabel: "Event name",
        field: mockField,
        placeholder: "Enter name",
      });

      expect(rendered).toBe(mockField);
      expect(rendered.name).toBe("name");
      expect(rendered.value).toBe("Test Event");
    });

    it("should maintain stable reference across rerenders", () => {
      const { result, rerender } = renderHook(() => useFormFieldRenderer<TestFormData>());

      const firstText = result.current.text;
      rerender();
      const secondText = result.current.text;

      expect(firstText).toBe(secondText);
    });
  });

  describe("textarea renderer", () => {
    it("should return field as-is for textarea inputs", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = createMockField("description", "Test description");

      const rendered = result.current.textarea({
        ariaLabel: "Event description",
        field: mockField,
      });

      expect(rendered).toBe(mockField);
      expect(rendered.name).toBe("description");
      expect(rendered.value).toBe("Test description");
    });

    it("should maintain stable reference across rerenders", () => {
      const { result, rerender } = renderHook(() => useFormFieldRenderer<TestFormData>());

      const firstTextarea = result.current.textarea;
      rerender();
      const secondTextarea = result.current.textarea;

      expect(firstTextarea).toBe(secondTextarea);
    });
  });

  describe("date renderer", () => {
    it("should convert Date value to ISO date string", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const testDate = new Date("2025-03-10T00:00:00.000Z");
      const mockField = createMockField("eventDate", testDate);

      const rendered = result.current.date({
        ariaLabel: "Event date",
        field: mockField,
      });

      expect(rendered.value).toBe("2025-03-10");
      expect(rendered.name).toBe("eventDate");
      expect(rendered.ref).toBe(mockField.ref);
      expect(rendered.onBlur).toBe(mockField.onBlur);
    });

    it("should convert string value to ISO date string", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = createMockField("eventDate", "2025-03-10T15:30:00.000Z");

      const rendered = result.current.date({
        ariaLabel: "Event date",
        field: mockField,
      });

      expect(rendered.value).toBe("2025-03-10");
    });

    it("should handle empty/invalid values gracefully", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = createMockField("eventDate", null);

      const rendered = result.current.date({
        ariaLabel: "Event date",
        field: mockField,
      });

      expect(rendered.value).toBe("");
    });

    it("should convert onChange event to Date object", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockOnChange = vi.fn();
      const mockField = {
        ...createMockField("eventDate", new Date()),
        onChange: mockOnChange,
      };

      const rendered = result.current.date({
        ariaLabel: "Event date",
        field: mockField,
      });

      const mockEvent = {
        target: { value: "2025-03-10" },
      } as React.ChangeEvent<HTMLInputElement>;

      rendered.onChange(mockEvent);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const calledWith = mockOnChange.mock.calls[0][0];
      expect(calledWith).toBeInstanceOf(Date);
      expect(calledWith.toISOString()).toContain("2025-03-10");
    });

    it("should preserve disabled state", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = {
        ...createMockField("eventDate", new Date()),
        disabled: true,
      };

      const rendered = result.current.date({
        ariaLabel: "Event date",
        field: mockField,
      });

      expect(rendered.disabled).toBe(true);
    });

    it("should maintain stable reference across rerenders", () => {
      const { result, rerender } = renderHook(() => useFormFieldRenderer<TestFormData>());

      const firstDate = result.current.date;
      rerender();
      const secondDate = result.current.date;

      expect(firstDate).toBe(secondDate);
    });
  });

  describe("select renderer", () => {
    it("should return field as-is for select inputs", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = createMockField("status", "OPEN");

      const rendered = result.current.select({
        ariaLabel: "Event status",
        field: mockField,
      });

      expect(rendered).toBe(mockField);
      expect(rendered.name).toBe("status");
      expect(rendered.value).toBe("OPEN");
    });

    it("should maintain stable reference across rerenders", () => {
      const { result, rerender } = renderHook(() => useFormFieldRenderer<TestFormData>());

      const firstSelect = result.current.select;
      rerender();
      const secondSelect = result.current.select;

      expect(firstSelect).toBe(secondSelect);
    });
  });

  describe("generic type safety", () => {
    it("should work with different form data types", () => {
      interface OtherFormData {
        title: string;
        count: number;
      }

      const { result } = renderHook(() => useFormFieldRenderer<OtherFormData>());
      const mockOtherField: ControllerRenderProps<OtherFormData, "title"> = {
        disabled: false,
        name: "title",
        onBlur: vi.fn(),
        onChange: vi.fn(),
        ref: vi.fn(),
        value: "Test Title",
      };

      const rendered = result.current.text({
        field: mockOtherField,
      });

      expect(rendered.value).toBe("Test Title");
    });
  });

  describe("edge cases", () => {
    it("should handle date field with Date object", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const specificDate = new Date("2025-12-31T23:59:59.999Z");
      const mockField = createMockField("eventDate", specificDate);

      const rendered = result.current.date({
        field: mockField,
      });

      expect(rendered.value).toBe("2025-12-31");
    });

    it("should handle date field with already formatted string", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = createMockField("eventDate", "2025-12-31");

      const rendered = result.current.date({
        field: mockField,
      });

      expect(rendered.value).toBe("2025-12-31");
    });

    it("should handle undefined values", () => {
      const { result } = renderHook(() => useFormFieldRenderer<TestFormData>());
      const mockField = createMockField("eventDate", undefined);

      const rendered = result.current.date({
        field: mockField,
      });

      expect(rendered.value).toBe("");
    });
  });
});
