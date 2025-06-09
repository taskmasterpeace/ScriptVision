"use server";

import { YoutubeTranscript } from "youtube-transcript";
import {
  YoutubeSearchResponse,
  YoutubeVideoStatistics,
  YoutubeSearchResult,
  YoutubeTranscriptResult,
} from "@/lib/types/script.type";

export const searchYouTubeAction = async (
  query: string,
  params: string
): Promise<YoutubeSearchResult[]> => {
  try {
    const urlParams = new URLSearchParams({
      type: "video",
      part: "snippet",
      q: query,
      maxResults: "5",
    }).toString();
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?${params || urlParams}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data: YoutubeSearchResponse = await response.json();

    const videoIds = data.items.map((video) => video.id.videoId).join(",");

    // Fetch statistics for all videos in one API call
    const statsResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const statsData: YoutubeVideoStatistics = await statsResponse.json();

    const transcripts = await getYouTubeTranscript(data.items.map((video) => video.id.videoId));

    const combinedData = data.items.map((video) => {
      return {
        id: video.id.videoId,
        videoId: video.id.videoId,
        selected: false,
        snippet: video.snippet,
        statistics: statsData.items.find((item) => item.id === video.id.videoId)
          ?.statistics,
        transcript: transcripts.find((transcript) => transcript.videoId === video.id.videoId)?.text || "",
        source: "youtube" as "youtube",
      };
    });
    return combinedData;
  } catch (error) {
    console.error("Failed to search YouTube (server action):", error);
    throw error;
  }
};

export const getYouTubeTranscript = async (
  videoIds: string[]
): Promise<YoutubeTranscriptResult[]> => {
  try {
    const results = await Promise.allSettled(
      videoIds.map(async (videoId) => {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return {
          videoId,
          text: transcript.map((item) => item.text).join(" "),
        };
      })
    );

    return videoIds.map((videoId, index) => {
      const result = results[index];
      if (result?.status === "fulfilled" && result.value) {
        return {
          videoId,
          text: result.value.text || "",
        };
      }
      return {
        videoId,
        text: "",
      };
    });
  } catch (error) {
    console.error("Error fetching transcripts:", error);
    return [];
  }
};
