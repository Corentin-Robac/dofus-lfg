// src/components/AuthButtons.tsx
"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data } = useSession();
  const isAuthenticated = !!data?.user;

  if (isAuthenticated) {
    return <button onClick={() => signOut()}>Se déconnecter</button>;
  }
  return (
    <button onClick={() => signIn("google")}>Se connecter avec Google</button>
  );
}
