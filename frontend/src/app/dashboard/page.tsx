"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils";

export default function Dashboard() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
      } else {
        setUser({ email: session.user.email || "Guest user" });
      }
    };

    checkSession();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl">Welcome {user?.email}</h1>
      <button className="bg-red-500 text-white p-2 rounded" onClick={logout}>Logout</button>
    </div>
  );
}