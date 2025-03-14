"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      if (!res.ok) router.push("/auth");
      else setUser(data.user);
    };

    fetchUser();
  }, []);

  const logout = async () => {
    await fetch("/api/auth", { method: "POST", body: JSON.stringify({ type: "logout" }) });
    localStorage.removeItem("token");
    router.push("/auth");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl">Welcome {user?.email}</h1>
      <button className="bg-red-500 text-white p-2 rounded" onClick={logout}>Logout</button>
    </div>
  );
}