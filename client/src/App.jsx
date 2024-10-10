import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { fetchYouTubeTitle, getYouTubeVideoID } from "./utilities/method"; // Assuming this exists

const baseUrl = "https://ytdownloader-4t9v.onrender.com";

const App = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFormats, setVideoFormats] = useState([]);
  const [audioFormats, setAudioFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [selectedVideoQuality, setSelectedVideoQuality] = useState("");
  const [selectedAudioQuality, setSelectedAudioQuality] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoSrcUrl, setVideoSrcUrl] = useState("");

  // Filters unique formats based on quality label and bitrate
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
      const response = await axios.get(`${baseUrl}/formats`, {
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
      setVideoSrcUrl(response.data.videoFormats[0]?.url); // Check if there's a video URL
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
        setVideoTitle(title);
        return title;
      } catch (error) {
        console.error("Failed to fetch video title", error);
      }
    }
    return "download";
  };

  const downloadFile = async (type) => {
    if (
      !videoUrl ||
      (type === "video" && !selectedVideoQuality) ||
      (type === "audio" && !selectedAudioQuality)
    )
      return;

    type === "audio" ? setAudioLoading(true) : setVideoLoading(true);
    const quality =
      type === "video" ? selectedVideoQuality : selectedAudioQuality;

    let title = videoTitle || (await fetchTitle());

    const url = `${baseUrl}/download/${type}?url=${encodeURIComponent(
      videoUrl
    )}&quality=${quality}`;

    const userFilename = window.prompt(
      `Enter the filename to save as (without extension):`,
      title
    );
    const finalFilename = userFilename ? userFilename : title;

    try {
      const response = await axios.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: type === "video" ? "video/mp4" : "audio/mpeg",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `${finalFilename}.${type === "video" ? "mp4" : "mp3"}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
    } finally {
      type === "audio" ? setAudioLoading(false) : setVideoLoading(false);
    }
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;

    setVideoLoading(true);

    let title = videoTitle || (await fetchTitle());

    const url = `${baseUrl}/download/video?url=${encodeURIComponent(
      videoSrcUrl
    )}`;

    const userFilename = window.prompt(
      `Enter the filename to save as (without extension):`,
      title
    );
    const finalFilename = userFilename ? userFilename : title;

    try {
      const response = await axios.get(url, { responseType: "blob" });

      const blob = new Blob([response.data], { type: "video/mp4" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", `${finalFilename}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Error downloading video:`, error);
    } finally {
      setVideoLoading(false);
    }
  };

  const formatAudioLabel = (format) => {
    const bitrate = format.bitrate
      ? `${Math.round(format.bitrate / 1000)}k`
      : "";
    const type = format.mimeType.includes("mp4") ? "MP4" : "WEBM";
    return `${bitrate} ${type}`;
  };

  // Calculate file size in human-readable format
  const calculateFileSize = (bitrate, duration) => {
    if (!bitrate) return "N/A";
    const sizeInBytes = (bitrate * duration) / 8; // convert bps to bytes
    const sizeInKB = sizeInBytes / 1024; // convert bytes to KB
    const sizeInMB = sizeInKB / 1024; // convert KB to MB
    const sizeInGB = sizeInMB / 1024; // convert MB to GB

    if (sizeInGB >= 1) {
      return `${sizeInGB.toFixed(2)} GB`;
    } else if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      return `${sizeInKB.toFixed(2)} KB`;
    }
  };

  useEffect(() => {
    if (videoUrl) {
      fetchFormats();
      fetchTitle();
    }
  }, [videoUrl]);

  return (
    <div className="container">
      <h1>YouTube Video Downloader</h1>
      <div className="input-group">
        <label htmlFor="video-url">Enter YouTube Video URL:</label>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          id="video-url"
          placeholder="https://www.youtube.com/watch?v=example"
        />
      </div>

      {/* Instructions if no video URL is entered */}
      {!videoUrl && (
        <div className="instructions">
          <h2>How to Download YouTube Videos or Audio:</h2>
          <ol>
            <li>Enter the YouTube video URL in the input box above.</li>
            <li>Available video and audio formats will appear.</li>
            <li>Select the desired format and quality.</li>
            <li>Click "Download Video" or "Download Audio" to download.</li>
          </ol>
        </div>
      )}

      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only"></span>
          </div>
        </div>
      )}

      {videoTitle && <h2>{videoTitle}</h2>}
      {videoSrcUrl && (
        <video src={videoSrcUrl} controls autoPlay id="video-preview"></video>
      )}

      {/* Video quality selection */}
      {videoFormats.length > 0 && (
        <div className="quality-selection">
          <h2>Select Video Quality</h2>
          <div className="quality-options">
            {videoFormats.map((format, index) => (
              <label key={index} className="quality-option">
                <input
                  type="radio"
                  name="video-quality"
                  value={format.url}
                  onChange={(e) => setVideoSrcUrl(e.target.value)}
                />
                <span className="quality-box">{format.qualityLabel}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Audio quality selection */}
      {audioFormats.length > 0 && (
        <div className="quality-selection">
          <h2>Select Audio Quality</h2>
          <div className="quality-options">
            {audioFormats.map((format, index) => (
              <label key={index} className="quality-option">
                <input
                  type="radio"
                  name="audio-quality"
                  value={format.itag}
                  onChange={(e) => setSelectedAudioQuality(e.target.value)}
                />
                <span className="quality-box">{formatAudioLabel(format)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="button-group">
        {videoFormats.length > 0 && (
          <button
            disabled={videoLoading}
            className={`download-btn ${videoLoading ? "loading" : ""}`}
            onClick={downloadVideo}
          >
            {videoLoading ? "Downloading..." : "Download Video"}
          </button>
        )}
        {audioFormats.length > 0 && (
          <button
            disabled={audioLoading}
            className={`download-btn ${audioLoading ? "loading" : ""}`}
            onClick={() => downloadFile("audio")}
          >
            {audioLoading ? "Downloading..." : "Download Audio"}
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
