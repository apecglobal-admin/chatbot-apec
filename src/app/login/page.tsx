"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Bot, Lock, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/components/ui/input-group";
import { loginAction } from "@/features/auth/api/auth-actions";

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tài khoản"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("password", values.password);

      const result = await loginAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đăng nhập thành công!");
        router.push("/cms");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="z-10 w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center ">
          <div className="flex p-3 items-center justify-center rounded-full bg-gradient-to-br from-brand-lime to-brand-green shadow-xl shadow-brand-green/20">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CHATBOT ECOOP MART
            </h1>
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white/80 p-8 shadow-2xl shadow-indigo-100 backdrop-blur-xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Tài khoản
                    </FormLabel>
                     <FormControl>
                        <InputGroup className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                          <InputGroupAddon className="pl-4">
                            <User className="text-slate-400" />
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="Nhập tên đăng nhập"
                            {...field}
                          />
                        </InputGroup>
                      </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Mật khẩu
                    </FormLabel>
                      <FormControl>
                        <InputGroup className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                          <InputGroupAddon className="pl-4">
                            <Lock className="text-slate-400" />
                          </InputGroupAddon>
                          <InputGroupInput
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </InputGroup>
                      </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-gradient-to-r from-brand-lime to-brand-green font-semibold text-white shadow-lg shadow-brand-green/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? "Đang xác thực..." : "Đăng nhập"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-xs text-slate-400">
          &copy; 2026 Apec Global. All rights reserved.
        </p>
      </div>
    </div>
  );
}
