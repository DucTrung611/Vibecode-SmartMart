"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/Button";
import { Field } from "@/shared/components/Field";
import { ApiError } from "@/shared/types/api-envelope";
import { useLogin } from "../hooks/useLogin";
import { LoginFormValues, loginSchema } from "../utils/schemas";

export function LoginForm() {
  const router = useRouter();
  const { mutate, isPending, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginFormValues) => {
    mutate(values, {
      onSuccess: () => router.push("/profile"),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {error && (
        <p className="text-sm text-(--color-destructive)" role="alert">
          {error instanceof ApiError
            ? error.message
            : "Something went wrong. Please try again."}
        </p>
      )}
      <Button type="submit" isLoading={isPending}>
        Log in
      </Button>
    </form>
  );
}
