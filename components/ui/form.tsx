"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";

import { cn } from "@/lib/utils";

type AppFormProps<TFieldValues extends FieldValues> = {
  schema: z.ZodType<TFieldValues>;
  defaultValues?: DefaultValues<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  children: ReactNode | ((form: UseFormReturn<TFieldValues>) => ReactNode);
  className?: string;
  id?: string;
};

export function AppForm<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  id,
}: AppFormProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    // zodResolver typings lag Zod 4 generics slightly; runtime behavior is correct.
    resolver: zodResolver(schema as never),
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form
        id={id}
        className={cn("space-y-4", className)}
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        {typeof children === "function" ? children(form) : children}
      </form>
    </FormProvider>
  );
}

export { FormProvider, useForm };
