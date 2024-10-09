import React, { useState } from "react";
import axios from "axios";

const Download = () => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleDownload = async (type) => {
    if (!url) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    try {
      setError(""); // Clear previous errors
      const response = await axios({
        url: `http://localhost:5000/download/${type}`,
        method: "GET",
        responseType: "blob", // Important
        params: { url }, // Pass the URL as a query parameter
      });

      // Create a blob URL for the response
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create a link element to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute(
        "download",
        type === "audio" ? "audio.mp3" : "video.mp4"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download. Please check the URL.");
    }
  };

  return (
    <div>
      <h1>YouTube Video/Audio Downloader</h1>
      <input
        type="text"
        placeholder="Enter YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={() => handleDownload("audio")}>Download Audio</button>
      <button onClick={() => handleDownload("video")}>Download Video</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Download;
