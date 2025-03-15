"use client";
import { useEffect, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Auth() {
  const router = useRouter();
  const [, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        localStorage.setItem("supabase_jwt", data.session.access_token);
        setSession(data.session);
        router.push("/");
      }
    };
    fetchSession();
  }, [router]);

  const handleAuth = async () => {
    setLoading(true);
    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (data.session) {
      localStorage.setItem("supabase_jwt", data.session.access_token);
      router.push("/");
    } else if (error) {
      alert(error.message);
    }
  };

  const handleGitHubAuth = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-900 to-purple-900 p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 max-w-md w-full text-center"
      >
        <h2 className="text-2xl font-bold mb-4">{isLogin ? "Login" : "Sign Up"}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <button className="btn" onClick={handleAuth} disabled={loading}>
          {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
        </button>
        <button className="auth-btn github" onClick={handleGitHubAuth}>Sign in with GitHub</button>
        <button className="text-gray-300 mt-4 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </motion.div>
    </div>
  );
}