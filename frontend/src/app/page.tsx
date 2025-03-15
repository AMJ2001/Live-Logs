"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/utils";
import router from "next/router";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
  const [queueStatus, setQueueStatus] = useState<{ active: number; waiting: number; completed: number } | null>(null);
  const [jobs, setJobs] = useState<{ jobId: string; fileName: string; status: string }[]>([]);
  const [selectedJobStats, setSelectedJobStats] = useState<{ jobId: string; errors: number; keywords: string[]; ips: string[] } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!WEBSOCKET_URL) return;
    const socket = new WebSocket(`${WEBSOCKET_URL}/api/live-stats`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "queueStatus") {
        setQueueStatus(data.payload);
      } else if (data.type === "jobUpdate") {
        setJobs((prevJobs) =>
          prevJobs.map((job) => (job.jobId === data.payload.jobId ? { ...job, status: data.payload.status } : job))
        );
      }
    };

    socket.onclose = () => {
      setTimeout(() => {
        const reconnectSocket = new WebSocket(`${WEBSOCKET_URL}/api/live-stats`);
        reconnectSocket.onmessage = socket.onmessage;
      }, 3000);
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchQueueStatus();
  }, []);

  const fetchQueueStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/queue-status`, {
        headers: { authorization: localStorage.getItem("supabase_jwt") || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch queue status");
      const data = await res.json();
      setQueueStatus(data);
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`, {
        headers: { authorization: localStorage.getItem("supabase_jwt") || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(data);
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const fetchJobStats = async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/${jobId}`, {
        headers: { authorization: localStorage.getItem("supabase_jwt") || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch job stats");
      const data = await res.json();
      setSelectedJobStats({ jobId, ...data });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload-logs`, {
        method: "POST",
        body: formData,
        headers: { authorization: localStorage.getItem("supabase_jwt") || "" },
      });

      if (!res.ok) throw new Error("Upload failed");

      alert("File uploaded successfully 🎉");
      fetchQueueStatus();
      fetchJobs();
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
                    <td colSpan={3} className="text-center p-3">
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Jobs Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-8 glass p-6 rounded-xl shadow-xl w-full"
        >
          <h2 className="text-2xl font-semibold text-center mb-4">Jobs</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>File Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.jobId} className="hover:bg-gray-700 transition-all duration-200">
                      <td
                        className="cursor-pointer text-blue-400 hover:underline"
                        onClick={() => fetchJobStats(job.jobId)}
                      >
                        {job.jobId}
                      </td>
                      <td>{job.fileName}</td>
                      <td>{job.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-3">
                      No jobs available 💤
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Selected Job Stats */}
        {selectedJobStats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-8 glass p-6 rounded-xl shadow-xl w-full"
          >
            <h2 className="text-2xl font-semibold text-center mb-4">Job Details</h2>
            <p>Job ID: {selectedJobStats.jobId}</p>
            <p>Errors: {selectedJobStats.errors || 'None'}</p>
            <p>Keywords: {selectedJobStats.keywords}</p>
            <p>IP Addresses: {selectedJobStats.ips}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
