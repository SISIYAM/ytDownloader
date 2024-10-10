import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { fetchYouTubeTitle, getYouTubeVideoID } from "./utilities/method";

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
      console.log(response.data.videoFormats);

      const uniqueVideoFormats = filterUniqueFormats(
        response.data.videoFormats
      );
      const uniqueAudioFormats = filterUniqueFormats(
        response.data.audioFormats
      );

      setVideoFormats(uniqueVideoFormats);
      setAudioFormats(uniqueAudioFormats);
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

    const url = `http://localhost:5000/download/${type}?url=${encodeURIComponent(
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

    const url = `http://localhost:5000/download/video?url=${encodeURIComponent(
      videoSrcUrl
    )}`;

    const userFilename = window.prompt(
      `Enter the filename to save as (without extension):`,
      title
    );
    const finalFilename = userFilename ? userFilename : title;

    try {
      const response = await axios.get(url, { responseType: "blob" });

      const blob = new Blob([response.data], {
        type: "video/mp4",
      });
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

  // method for calculate file size in KB, MB, or GB
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
    fetchFormats();
    if (videoUrl) {
      fetchTitle();
    }
  }, [videoUrl]);

  return (
    <div className="container m-5">
      <h1 className="">YouTube Video Downloader</h1>
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
      {videoTitle && <h5 className="">{videoTitle}</h5>}

      <div>
        <video src={videoSrcUrl} controls></video>
      </div>
      <h2>Select Video Quality:</h2>
      <div className="formats-container">
        {videoFormats.map((format, index) => {
          const size = calculateFileSize(format.bitrate, 180);
          return (
            <>
              <div
                key={`${format.itag}-${index}`}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div className="form-check format-item">
                  <input
                    type="radio"
                    id={`video-${format.itag}`}
                    name="videoQuality"
                    value={format.url}
                    className="form-check-input"
                    onChange={(e) => setVideoSrcUrl(e.target.value)}
                  />
                  <label
                    htmlFor={`video-${format.itag}`}
                    className="form-check-label"
                    style={{ width: "100px", textAlign: "center" }}
                  >
                    {format.qualityLabel}
                  </label>
                </div>
                <span style={{ margin: "0 10px", textAlign: "center" }}>
                  {size}
                </span>
              </div>
            </>
          );
        })}
      </div>
      <button className="btn btn-primary" onClick={() => downloadVideo()}>
        {videoLoading ? "Downloading..." : "Download Video"}
      </button>

      <h2 className="mt-4">Select Audio Quality:</h2>
      <div className="formats-container">
        {audioFormats.map((format, index) => {
          const size = calculateFileSize(format.bitrate, 180);
          return (
            <>
              <div style={{ display: "flex", flexDirection: "column" }}>
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
                    style={{ width: "100px", textAlign: "center" }}
                  >
                    {formatAudioLabel(format)}
                  </label>
                </div>
                <span style={{ margin: "0 10px", textAlign: "center" }}>
                  {size}
                </span>
              </div>
            </>
          );
        })}
      </div>
      <button
        className="btn btn-danger mt-2"
        onClick={() => downloadFile("audio")}
      >
        {audioLoading ? "Downloading..." : "Download Audio"}
      </button>
    </div>
  );
};

export default App;
