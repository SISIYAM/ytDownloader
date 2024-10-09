const ytdl = require("ytdl-core");
const fs = require("fs"); // Required for file stream handling

// Example URL
const url = "https://www.youtube.com/watch?v=pD5mAkBpcHU"; // Ensure this URL is correct

async function downloadVideo(videoUrl) {
  try {
    // Validate URL format
    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
      throw new Error("Invalid YouTube URL");
    }

    console.log(`Fetching video info for URL: ${videoUrl}`); // Debug logging

    const info = await ytdl.getInfo(videoUrl);
    const audioFormats = info.formats.filter((format) => format.audioBitrate); // Filter audio formats
    const videoFormats = info.formats.filter((format) => format.hasVideo); // Filter video formats

    // Check for available formats
    if (audioFormats.length === 0) {
      throw new Error("No audio formats available");
    }
    if (videoFormats.length === 0) {
      throw new Error("No video formats available");
    }

    // Select the highest bitrate audio format
    const selectedAudioFormat = audioFormats.reduce((prev, current) => {
      return prev.audioBitrate > current.audioBitrate ? prev : current;
    });

    // Select the highest bitrate video format
    const selectedVideoFormat = videoFormats.reduce((prev, current) => {
      return prev.bitrate > current.bitrate ? prev : current;
    });

    if (!selectedAudioFormat) {
      throw new Error("No suitable audio format found");
    }
    if (!selectedVideoFormat) {
      throw new Error("No suitable video format found");
    }

    // Proceed with downloading audio
    const audioStream = ytdl(videoUrl, { format: selectedAudioFormat });
    const videoStream = ytdl(videoUrl, { format: selectedVideoFormat });

    // Specify output file names
    const audioOutput = "output-audio.mp3";
    const videoOutput = "output-video.mp4";

    // Pipe the audio stream to a writable file
    const audioWriteStream = fs.createWriteStream(audioOutput);
    audioStream.pipe(audioWriteStream);

    // Pipe the video stream to a writable file
    const videoWriteStream = fs.createWriteStream(videoOutput);
    videoStream.pipe(videoWriteStream);

    console.log("Downloading audio and video...");

    // Handle finish and error events for audio stream
    audioWriteStream.on("finish", () => {
      console.log("Audio download complete!");
    });

    audioWriteStream.on("error", (err) => {
      console.error("Error downloading audio:", err.message);
    });

    // Handle finish and error events for video stream
    videoWriteStream.on("finish", () => {
      console.log("Video download complete!");
    });

    videoWriteStream.on("error", (err) => {
      console.error("Error downloading video:", err.message);
    });

    // Add additional logging for the streams
    audioStream.on("progress", (chunkLength, downloaded, total) => {
      console.log(
        `Downloading audio: ${Math.round((downloaded / total) * 100)}%`
      );
    });

    videoStream.on("progress", (chunkLength, downloaded, total) => {
      console.log(
        `Downloading video: ${Math.round((downloaded / total) * 100)}%`
      );
    });

    // Listen for errors on the audio and video streams
    audioStream.on("error", (err) => {
      console.error("Audio stream error:", err.message);
    });

    videoStream.on("error", (err) => {
      console.error("Video stream error:", err.message);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

downloadVideo(url);
