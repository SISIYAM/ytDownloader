const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");

const app = express();
app.use(cors());

// Fetch available formats
app.get("/formats", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    const info = await ytdl.getInfo(videoUrl);
    const videoFormats = ytdl.filterFormats(info.formats, "video");
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

    res.json({ videoFormats, audioFormats });
  } catch (error) {
    console.error("Error fetching formats:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch video formats. " + error.message });
  }
});

// Route to download video
app.get("/download/video", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    res.header("Content-Disposition", `attachment; filename="video.mp4"`);
    ytdl(videoUrl, { quality: "highestvideo" }) // Adjust as needed
      .on("error", (error) => {
        console.error("Error downloading video:", error);
        res
          .status(500)
          .json({ error: "Failed to download video. " + error.message });
      })
      .pipe(res);
  } catch (error) {
    console.error("Error in video download route:", error);
    res
      .status(500)
      .json({ error: "An error occurred while downloading the video." });
  }
});

// Route to download audio
app.get("/download/audio", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    res.header("Content-Disposition", `attachment; filename="audio.mp3"`);

    const audioStream = ytdl(videoUrl, {
      filter: (format) => format.hasAudio,
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
        },
      },
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
