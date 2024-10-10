const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");
const axios = require("axios");
const puppeteer = require("puppeteer");
const app = express();
app.use(
  cors({
    origin: "*",
  })
);

// Function to fetch video formats using Puppeteer
const fetchVideoFormats = async (videoUrl) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(videoUrl, { waitUntil: "networkidle2" });

  // Use ytdl-core to extract video information
  const info = await ytdl.getInfo(videoUrl);
  await browser.close();

  const videoFormats = ytdl.filterFormats(info.formats, "audioandvideo");
  const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

  return { videoFormats, audioFormats };
};

// Endpoint to fetch formats
app.get("/formats", async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    const { videoFormats, audioFormats } = await fetchVideoFormats(videoUrl);

    res.json({ videoFormats, audioFormats });
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
