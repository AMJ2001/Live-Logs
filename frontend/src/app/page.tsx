"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/utils";
import router from "next/router";

export default function Home() {
  const [stats, setStats] = useState<{ errors: number; keywords: string[]; ips: string[] } | null>(null);
  const [queueStatus, setQueueStatus] = useState<Record<string, string> | null>(null);
  const [jobStats, setJobStats] = useState<{ jobId: string; errors: number; keywords: string[]; ips: string[] } | null>(
    null
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState<{ jobId: string }[]>([]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats(data);
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    fetchQueueStatus();
  }, []);

  const fetchQueueStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/queue-status", {
        headers: { authorization: localStorage.getItem('supabase_jwt') || '' }
      });
      if (!res.ok) { throw new Error("Failed to fetch queue status"); }
      const data = await res.json();
      setQueueStatus(data);
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const fetchJobStats = async (jobId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/stats/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job stats");
      const data = await res.json();
      setJobStats({ jobId, ...data });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await fetch("http://localhost:5000/api/upload-logs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      alert("File uploaded successfully 🎉");
      fetchQueueStatus();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4"> 
      <div>
        <button onClick={logout}>Logout</button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-10 max-w-3xl w-full text-center shadow-lg"
      >
        <h1 className="text-4xl font-bold mb-6">Log Processing Dashboard</h1>
        <p className="text-gray-300 mb-8">Monitor and manage log processing in real-time.</p>

        {/* File Upload */}
        <div className="glass p-6 rounded-xl shadow-lg">
          <input type="file" className="text-gray-300 mb-4" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button
            className="btn w-full flex items-center justify-center"
            onClick={handleFileUpload}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="animate-spin" /> : "Upload Log File"}
          </button>
        </div>

        {/* Queue Status */}
        <motion.div className="mt-6 p-4 glass rounded-lg w-full">
          <h2 className="text-xl font-semibold text-center mb-4">Queue Status</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Active</th>
                  <th>Waiting</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {queueStatus ? (
                  <tr className="hover:bg-gray-700 transition-all duration-200">
                    <td>{queueStatus.active}</td>
                    <td>{queueStatus.waiting}</td>
                    <td>{queueStatus.completed}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-3">Loading...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        {/* Live Stats Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-8 glass p-6 rounded-xl shadow-xl w-full"
        >
          <h2 className="text-2xl font-semibold text-center mb-4">Live Log Stats</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Errors</th>
                  <th>Keywords</th>
                  <th>IP Addresses</th>
                </tr>
              </thead>
              <tbody>
                {stats ? (
                  <motion.tr
                    key={stats.errors}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-700 transition-all duration-200"
                  >
                    <td>{stats.errors}</td>
                    <td>{stats.keywords.join(", ")}</td>
                    <td>{stats.ips.join(", ")}</td>
                  </motion.tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-3">
                      No data available 💤
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Job Stats */}
        {jobs.length > 0 && (
          <motion.div className="mt-8 glass p-6 rounded-xl shadow-xl w-full">
            <h2 className="text-2xl font-semibold text-center mb-4">Job Stats</h2>
            <ul>
              {jobs.map((job) => (
                <li key={job.jobId} className="cursor-pointer hover:underline text-blue-400" onClick={() => fetchJobStats(job.jobId)}>
                  View Job {job.jobId}
                </li>
              ))}
            </ul>
            {jobStats && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold">Details for Job {jobStats.jobId}</h3>
                <p>Errors: {jobStats.errors}</p>
                <p>Keywords: {jobStats.keywords.join(", ")}</p>
                <p>IPs: {jobStats.ips.join(", ")}</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}