import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .refine((val) => {
    const [local, domain] = val.split("@");
    if (!domain) return false;
    const domainParts = domain.split(".");
    const tld = domainParts[domainParts.length - 1];
    return (
      local.length >= 2 && // local part at least 2 chars
      domainParts.length >= 2 && // must have at least one dot in domain
      tld.length >= 2 && // TLD at least 2 chars (no .c or .a)
      domain.length >= 4 && // domain at least 4 chars (a.co minimum)
      !/^[^a-zA-Z0-9]/.test(local) && // local can't start with special char
      !/\.\.|--/.test(val) // no consecutive dots or hyphens
    );
  }, "Enter a valid email address");

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((val) => val.trim() === val, {
      message: "Password cannot start or end with spaces",
    })
    .refine((val) => !/^\s+$/.test(val), {
      message: "Password cannot be only spaces",
    }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be less than 60 characters")
    .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), {
      message: "Name can only contain letters, spaces, hyphens and apostrophes",
    }),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((val) => val.trim() === val, {
      message: "Password cannot start or end with spaces",
    })
    .refine((val) => !/^\s+$/.test(val), {
      message: "Password cannot be only spaces",
    })
    .refine((val) => /(?=.*[a-zA-Z])/.test(val), {
      message: "Password must contain at least one letter",
    }),
});

export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((val) => val.trim() === val, {
        message: "Password cannot start or end with spaces",
      })
      .refine((val) => /(?=.*[a-zA-Z])/.test(val), {
        message: "Password must contain at least one letter",
      }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((val) => val.trim() === val, {
        message: "Password cannot start or end with spaces",
      })
      .refine((val) => /(?=.*[a-zA-Z])/.test(val), {
        message: "Password must contain at least one letter",
      }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
