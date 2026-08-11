// lib/actions/auth.ts
"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { registerSchema } from "@/lib/validation";
import { actionOk, actionError, type ActionResult } from "@/types";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  await connectDB();

  const existing = await UserModel.findOne({ email: parsed.data.email });
  if (existing) {
    return actionError("CONFLICT", "Un compte existe deja avec cet email");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const created = await UserModel.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    authProvider: "credentials",
  });

  return actionOk({ id: created._id.toString() });
}
