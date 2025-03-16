"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/utils";
import { useRouter } from "next/navigation";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
  const router = useRouter();
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
    if (!!localStorage.getItem('supabase_jwt')) {
      fetchJobs();
      fetchQueueStatus();
    }
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
      if (!res.ok) {
        if (res.status === 401) {
          window.alert("Session timed out, please login again.");
          await logout();
          return;
        }
        throw new Error("Failed to fetch jobs");
      }
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

      if (!res.ok) { throw new Error("Upload failed"); }

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
    localStorage.clear();
    router.push("/auth");
  };

  return !!localStorage.getItem('supabase_jwt') && (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 px-4 position-relative">
    <button
      onClick={logout}
      className="btn position-absolute"
      style={{
        top: "16px",
        left: "16px",
      }}
    >
      Logout
    </button>
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 shadow-lg text-center w-100 mb-5"
      style={{
        maxWidth: "700px",
      }}
    >
      <h1 className="display-4 fw-bold text-white text-center mb-4">Log Dashboard</h1>
      <p className="text-secondary mb-4">Monitor and manage log processing in real-time.</p>
    </motion.div>
    <div
      className="glass p-4 shadow-lg text-center w-100 mb-5"
      style={{
        maxWidth: "700px",
      }}
    >
      <input
        type="file"
        className="form-control mb-3"
        onChange={(e) => console.log(e.target.files?.[0])}
      />
      <button
        className="btn w-100"
        onClick={handleFileUpload}
        disabled={uploading}
      >
        {uploading ? (
          <div
            className="spinner-border spinner-border-sm"
            role="status"
          ></div>
        ) : (
          "Upload Log File"
        )}
      </button>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass p-4 shadow-lg text-center w-100 mb-5"
      style={{
        maxWidth: "800px",
      }}
    >
      <h2 className="h5 text-center mb-3">Queue Status</h2>
      <div className="table-responsive">
        <table className="table table-bordered text-white">
          <thead className="thead-light">
            <tr>
              <th>Active</th>
              <th>Waiting</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {queueStatus ? (
              <tr>
                <td>{queueStatus.active}</td>
                <td>{queueStatus.waiting}</td>
                <td>{queueStatus.completed}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={3} className="text-center">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass p-4 shadow-lg text-center w-100 mb-5"
      style={{
        maxWidth: "800px",
      }}
    >
      <h2 className="h5 text-center mb-3">Jobs</h2>
      <div className="table-responsive">
        <table className="table table-bordered text-white">
          <thead className="thead-light">
            <tr>
              <th>Job ID</th>
              <th>File Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length > 0 ? (
              jobs.map((job: any) => (
                <tr key={job.jobId}>
                  <td
                    className="text-primary cursor-pointer"
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
                <td colSpan={3} className="text-center">
                  No jobs available 💤
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
    {selectedJobStats && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass p-4 shadow-lg text-center w-100 mb-5"
        style={{
          maxWidth: "800px",
        }}
      >
        <h2 className="h5 text-center mb-3">Job Details</h2>
        <p>Job ID: {selectedJobStats.jobId}</p>
        <p>Errors: {selectedJobStats.errors || "None"}</p>
        <p>Keywords: {selectedJobStats.keywords}</p>
        <p>IP Addresses: {selectedJobStats.ips}</p>
      </motion.div>
    )}
  </div>
  );
}
