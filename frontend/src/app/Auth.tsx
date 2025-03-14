"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleAuth = async (type: "login" | "signup") => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, email, password }),
    });

    const data = await res.json();
    if (res.ok) router.push("/dashboard");
    else alert(data.error);
  };

  const handleOAuthLogin = async () => {
    const res = await fetch("/api/auth/github");
    const data = await res.json();
    if (data.url) window.location.href = data.url; // Redirect to GitHub login
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl mb-4">Login / Signup</h2>
      <input className="border p-2 mb-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 mb-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="bg-blue-500 text-white p-2 rounded" onClick={() => handleAuth("login")}>Login</button>
      <button className="bg-green-500 text-white p-2 rounded mt-2" onClick={() => handleAuth("signup")}>Sign Up</button>
      <button className="bg-gray-800 text-white p-2 rounded mt-4" onClick={handleOAuthLogin}>Login with GitHub</button>
    </div>
  );
}