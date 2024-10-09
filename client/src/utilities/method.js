import axios from "axios";
const getYouTubeVideoID = (url) => {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Function to fetch YouTube video title using YouTube Data API
const fetchYouTubeTitle = async (videoId) => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  if (!videoId) {
    throw new Error("Invalid YouTube Video ID");
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`;

  try {
    const response = await axios.get(apiUrl);
    const videoTitle =
      response.data.items[0]?.snippet?.title || "Title not found";
    return videoTitle;
  } catch (error) {
    console.error("Error fetching video title:", error);
    throw error;
  }
};

export { getYouTubeVideoID, fetchYouTubeTitle };
