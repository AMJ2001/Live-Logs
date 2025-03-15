"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState<{ errors: number; keywords: string[]; ips: string[] } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats(data);
    };

    return () => socket.close();
  }, []);

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file); // Append the selected file
  
    try {
      const res = await fetch("http://localhost:5000/api/upload-logs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) { throw new Error("Upload failed"); }
      alert("File uploaded successfully 🎉");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-10 max-w-3xl w-full text-center shadow-lg"
      >
        <h1 className="text-4xl font-bold mb-6">Log Processing Dashboard</h1>
        <p className="text-gray-300 mb-8">Monitor and manage log processing in real-time.</p>

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

        {/* Stats Section */}
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
      </motion.div>
    </div>
  );
}