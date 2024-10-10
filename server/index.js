const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");
const axios = require("axios");
const app = express();
app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.send("Success!");
});

// fetch available formats
app.get("/formats", async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    // validate the URL
    const videoIdMatch = videoUrl.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );

    if (!videoIdMatch) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const info = await ytdl.getInfo(videoUrl);

    // video and audio formats
    const videoFormats = ytdl.filterFormats(info.formats, "audioandvideo");
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

    res.json({
      videoFormats,
      audioFormats,
    });
  } catch (error) {
    console.error("Error fetching formats:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch video formats. " + error.message });
  }
});

// route to download video
app.get("/download/video", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("URL is required");
  }

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    res.set({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="video.mp4"`,
    });

    // send the video data
    res.send(response.data);
  } catch (error) {
    console.error("Error downloading video:", error);
    res.status(500).send("Error downloading video");
  }
});

// route to download audio
app.get("/download/audio", async (req, res) => {
  const videoUrl = req.query.url;
  const quality = req.query.quality;

  if (!videoUrl || !quality) {
    return res.status(400).json({ error: "URL and quality are required" });
  }

  try {
    res.header("Content-Disposition", `attachment; filename="audio.mp3"`);

    const audioStream = ytdl(videoUrl, {
      filter: (format) => format.hasAudio && format.itag === parseInt(quality),
    });

    audioStream.on("error", (error) => {
      console.error("Error downloading audio:", error);
      res
        .status(500)
        .json({ error: "Failed to download audio. " + error.message });
    });

    audioStream.pipe(res);
  } catch (error) {
    console.error("Error in audio download route:", error);
    res
      .status(500)
      .json({ error: "An error occurred while downloading the audio." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
