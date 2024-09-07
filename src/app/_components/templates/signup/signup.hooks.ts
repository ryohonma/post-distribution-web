import { zodResolver } from "@hookform/resolvers/zod";
import { useDialog } from "@luna/context/dialog/dialog";
import { createUser } from "@luna/lib/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signupSchema } from "./validation-schema";

export const useSignup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const { alert } = useDialog();

  const submit = async (data: z.infer<typeof signupSchema>) => {
    const res = await createUser(data.email, data.password);

    if (res.message) {
      await alert({ body: res.message });
      return;
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(submit),
    errors,
    isSubmitting,
    isValid,
  };
};