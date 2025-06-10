'use server';

import { YoutubeTranscript } from 'youtube-transcript';
import { Supadata } from '@supadata/js';
import {
  YoutubeSearchResponse,
  YoutubeVideoStatistics,
  YoutubeSearchResult,
  YoutubeTranscriptResult,
} from '@/lib/types/script.type';

const supadata = new Supadata({
  apiKey: process.env.SUPADATA_API_KEY!,
});

export const searchYouTubeAction = async (
  query: string,
  params: string
): Promise<YoutubeSearchResult[]> => {
  try {
    const urlParams = new URLSearchParams({
      type: 'video',
      part: 'snippet',
      q: query,
      maxResults: '5',
    }).toString();
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?${params || urlParams}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data: YoutubeSearchResponse = await response.json();

    const videoIds = data.items.map((video) => video.id.videoId).join(',');

    // Fetch statistics for all videos in one API call
    const statsResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const statsData: YoutubeVideoStatistics = await statsResponse.json();

    const transcripts = await getYouTubeTranscript(
      data.items.map((video) => video.id.videoId)
    );

    const combinedData = data.items.map((video) => {
      return {
        id: video.id.videoId,
        videoId: video.id.videoId,
        selected: false,
        snippet: video.snippet,
        statistics: statsData.items.find((item) => item.id === video.id.videoId)
          ?.statistics,
        transcript:
          transcripts.find(
            (transcript) => transcript.videoId === video.id.videoId
          )?.text || '',
        source: 'youtube' as 'youtube',
      };
    });
    return combinedData;
  } catch (error) {
    console.error('Failed to search YouTube (server action):', error);
    throw error;
  }
};
export const getYouTubeTranscript = async (
  videoIds: string[]
): Promise<YoutubeTranscriptResult[]> => {
  const results: YoutubeTranscriptResult[] = [];

  for (const videoId of videoIds) {
    let transcriptText = '';

    try {
      // Primary attempt: YoutubeTranscript package
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      // Check if transcript has meaningful text
      transcriptText = transcript.map((item) => item.text).join(' ').trim();

      if (!transcriptText) {
        throw new Error('Transcript is empty');
      }
      results.push({ videoId, text: transcriptText });
      continue; // Success — skip fallback
    } catch (err) {
      console.warn(`Primary fetch failed or empty for videoId: ${videoId}, trying Supadata`, err);
    }

// Fallback: Supadata
    try {
      const transcriptSupadata = await supadata.youtube.transcript({
        videoId,
        text: true,
      });

      if (typeof transcriptSupadata.content === 'string') {
        transcriptText = transcriptSupadata.content;
      } else if (Array.isArray(transcriptSupadata.content)) {
        transcriptText = transcriptSupadata.content.map((item) => item.text).join(' ');
      }
      results.push({
        videoId,
        text: transcriptText.trim(),
      });
    } catch (supadataErr) {
      console.error(`Supadata fetch failed for videoId: ${videoId}`, supadataErr);
      results.push({
        videoId,
        text: '',
    });
   }
  }
  return results;
};
