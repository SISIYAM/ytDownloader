import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { fetchYouTubeTitle, getYouTubeVideoID } from "./utilities/method";

const App = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFormats, setVideoFormats] = useState([]);
  const [audioFormats, setAudioFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoQuality, setSelectedVideoQuality] = useState("");
  const [selectedAudioQuality, setSelectedAudioQuality] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

  const filterUniqueFormats = (formats) => {
    const uniqueFormats = new Map();

    formats.forEach((format) => {
      const key = `${format.qualityLabel}-${format.bitrate}`;
      if (!uniqueFormats.has(key)) {
        uniqueFormats.set(key, format);
      }
    });

    return Array.from(uniqueFormats.values());
  };

  const fetchFormats = async () => {
    if (!videoUrl) return;
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/formats", {
        params: { url: videoUrl },
      });

      const uniqueVideoFormats = filterUniqueFormats(
        response.data.videoFormats
      );
      const uniqueAudioFormats = filterUniqueFormats(
        response.data.audioFormats
      );

      setVideoFormats(uniqueVideoFormats);
      setAudioFormats(uniqueAudioFormats);
      console.log("Video", uniqueVideoFormats);
      console.log("Audio", uniqueAudioFormats);
    } catch (error) {
      console.error("Error fetching formats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTitle = async () => {
    const videoId = getYouTubeVideoID(videoUrl);
    if (videoId) {
      try {
        const title = await fetchYouTubeTitle(videoId);
        setVideoTitle(title); // Set the video title here
        return title; // Return the title for use in download
      } catch (error) {
        console.error("Failed to fetch video title", error);
      }
    }
    return "download"; // Fallback title
  };

  const downloadFile = async (type) => {
    if (
      !videoUrl ||
      (type === "video" && !selectedVideoQuality) ||
      (type === "audio" && !selectedAudioQuality)
    )
      return;

    setLoading(true);
    const quality =
      type === "video" ? selectedVideoQuality : selectedAudioQuality;

    // Fetch the video title if not already fetched
    let title = videoTitle || (await fetchTitle());

    const url = `http://localhost:5000/download/${type}?url=${encodeURIComponent(
      videoUrl
    )}&quality=${quality}`;

    try {
      const response = await axios.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: type === "video" ? "video/mp4" : "audio/mpeg",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `${title || "download"}.${type === "video" ? "mp4" : "mp3"}`
      ); // Use the fetched title for the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Function to format audio quality labels
  const formatAudioLabel = (format) => {
    const bitrate = format.bitrate
      ? `${Math.round(format.bitrate / 1000)}k`
      : "";
    const type = format.mimeType.includes("mp4") ? "MP4" : "WEBM";
    return `${bitrate} ${type}`;
  };

  // Function to calculate file size in KB, MB, or GB
  const calculateFileSize = (bitrate, duration) => {
    if (!bitrate) return "N/A";
    const sizeInBytes = (bitrate * duration) / 8; // Convert bps to bytes
    const sizeInKB = sizeInBytes / 1024; // Convert bytes to KB
    const sizeInMB = sizeInKB / 1024; // Convert KB to MB
    const sizeInGB = sizeInMB / 1024; // Convert MB to GB

    if (sizeInGB >= 1) {
      return `${sizeInGB.toFixed(2)} GB`;
    } else if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      return `${sizeInKB.toFixed(2)} KB`;
    }
  };

  useEffect(() => {
    fetchFormats();
    if (videoUrl) {
      fetchTitle(); // Fetch the title whenever the video URL changes
    }
  }, [videoUrl]);

  return (
    <div className="container mt-5">
      <h1 className="text-center">YouTube Video Downloader</h1>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter video URL"
        />
      </div>
      {loading && <p className="text-center">Loading...</p>}

      {/* Display the video title below the input field */}
      {videoTitle && <h5 className="text-center">{videoTitle}</h5>}

      <h2>Select Video Quality:</h2>
      <div className="formats-container">
        {videoFormats.map((format, index) => {
          const size = calculateFileSize(format.bitrate, 180); // Assuming a duration of 180 seconds
          return (
            <div
              key={`${format.itag}-${index}`}
              className="form-check format-item"
            >
              <input
                type="radio"
                id={`video-${format.itag}`}
                name="videoQuality"
                value={format.itag}
                className="form-check-input"
                onChange={(e) => setSelectedVideoQuality(e.target.value)}
              />
              <label
                htmlFor={`video-${format.itag}`}
                className="form-check-label"
              >
                {format.qualityLabel} (Approx. {size})
              </label>
            </div>
          );
        })}
      </div>
      <button className="btn btn-primary" onClick={() => downloadFile("video")}>
        Download Video
      </button>

      <h2 className="mt-4">Select Audio Quality:</h2>
      <div className="formats-container">
        {audioFormats.map((format, index) => {
          const size = calculateFileSize(format.bitrate, 180); // Assuming a duration of 180 seconds
          return (
            <div
              key={`${format.itag}-${index}`}
              className="form-check format-item"
            >
              <input
                type="radio"
                id={`audio-${format.itag}`}
                name="audioQuality"
                value={format.itag}
                className="form-check-input"
                onChange={(e) => setSelectedAudioQuality(e.target.value)}
              />
              <label
                htmlFor={`audio-${format.itag}`}
                className="form-check-label"
              >
                {formatAudioLabel(format)} (Approx. {size})
              </label>
            </div>
          );
        })}
      </div>
      <button
        className="btn btn-danger mt-2"
        onClick={() => downloadFile("audio")}
      >
        Download Audio
      </button>
    </div>
  );
};

export default App;
