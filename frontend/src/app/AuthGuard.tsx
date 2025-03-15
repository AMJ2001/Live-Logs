"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && pathname !== "/auth") {
        router.push("/auth");
      }
      setLoading(false);
    };

    checkSession();
  }, [router, pathname]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}