import { z } from "zod";

export const phoneSchema = z.object({
  identifier: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, "Enter the 4 digit OTP"),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Enter a valid email",
    }),
});

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
