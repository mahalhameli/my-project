import "server-only";
import { redirect } from "next/navigation";
import { findUserById, type Plan } from "./db";
import { getSessionUserId } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  plan: Plan;
};

/** Returns the signed-in user, or null. Must be called inside <Suspense>. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await findUserById(userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, plan: user.plan };
}

/** Like getCurrentUser, but sends visitors to the sign-in page. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}
