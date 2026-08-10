"use client";

import type { ComponentProps, ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  name: string;
  label: string;
  description?: string;
  className?: string;
  children: (props: {
    id: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    "aria-invalid": boolean;
  }) => ReactNode;
};

export function FormField({ name, label, description, className, children }: FormFieldProps) {
  const { control } = useFormContext();
  const fieldId = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-2", className)}>
          <Label htmlFor={fieldId}>{label}</Label>
          {children({
            id: fieldId,
            name: field.name,
            value: typeof field.value === "string" ? field.value : "",
            onChange: field.onChange,
            onBlur: field.onBlur,
            "aria-invalid": Boolean(fieldState.error),
          })}
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          {fieldState.error?.message ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

export type FormFieldControlProps = ComponentProps<typeof FormField>;
