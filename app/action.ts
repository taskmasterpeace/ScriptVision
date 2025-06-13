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

    const combinedData = data.items.map((video) => {
      return {
        id: video.id.videoId,
        videoId: video.id.videoId,
        selected: false,
        snippet: video.snippet,
        statistics: statsData.items.find((item) => item.id === video.id.videoId)
          ?.statistics,
        transcript: '',
        source: 'youtube' as 'youtube',
      };
    });
    return combinedData;
  } catch (error) {
    console.error('Failed to search YouTube (server action):', error);
    throw error;
  }
};

// Fetch videos on research transcript
export const fetchVideoTranscript = async (
  videoId: string
): Promise<string> => {
  try {
    // Try primary method
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const transcriptText = transcript.map((item) => item.text).join(' ').trim();
    
    if (transcriptText) {
      return transcriptText;
    }
    throw new Error('Transcript is empty');
  } catch (err) {
    console.warn(`Primary fetch failed for videoId: ${videoId}, trying Supadata`, err);
    
    // Fallback to Supadata
    try {
      const transcriptSupadata = await supadata.youtube.transcript({
        videoId,
        text: true,
      });

      if (typeof transcriptSupadata.content === 'string') {
        return transcriptSupadata.content;
      } else if (Array.isArray(transcriptSupadata.content)) {
        return transcriptSupadata.content.map((item) => item.text).join(' ');
      }
      return '';
    } catch (error) {
      console.error('Failed to fetch transcript:', error);
      throw new Error('Failed to fetch transcript');
    }
  }
};