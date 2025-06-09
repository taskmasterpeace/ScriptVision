export interface Chapter {
  id: string;
  title: string;
  bulletPoints: BulletPoint[];
  expanded: boolean;
}

export interface BulletPoint {
  id: string;
  text: string;
  selected: boolean;
}

export interface GeneratedChapter {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  timestamp: string;
}

export interface EmotionalEnhancement {
  id: string;
  chapterId: string;
  originalContent: string;
  enhancedContent: string;
  emotionalImpact: string;
  changes: string[];
  timestamp: string;
}

export interface ChapterSuggestion {
  id: string;
  chapterId: string | null; // null for new chapter suggestions
  title: string;
  reason: string;
  bulletPoints: string[];
  selected: boolean;
}

export interface EmotionalSuggestion {
  id: string;
  chapterId: string;
  type: 'dialog' | 'scene' | 'character' | 'pacing';
  suggestion: string;
  emotionalImpact: string;
  selected: boolean;
}

type Thumbnail = {
  url: string;
  width: number;
  height: number;
};

export interface YoutubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: {
    kind: string;
    etag: string;
    id: {
      kind: string;
      videoId: string;
    };
    snippet: {
      publishedAt: string;
      channelId: string;
      title: string;
      description: string;
      thumbnails: {
        default: Thumbnail;
        medium: Thumbnail;
        high: Thumbnail;
      };
      channelTitle: string;
      liveBroadcastContent: string;
      publishTime: string;
    };
  }[];
}

export interface YoutubeVideoStatistics {
  kind: string;
  etag: string;
  items: {
    kind: string;
    etag: string;
    id: string;
    statistics: {
      viewCount: string;
      favoriteCount: string;
      commentCount: string;
      likeCount?: string;
    };
  }[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeTranscript {
  id: string;
  videoId: string | null; // Can be null for custom transcripts
  title: string;
  channelTitle: string | null; // Can be null for custom transcripts
  transcript: string;
  thumbnailUrl: string | null; // Can be null for custom transcripts
  selected: boolean;
  source: 'youtube' | 'custom'; // Add source field to distinguish between YouTube and custom transcripts
}

export interface YoutubeSearchResult {
  id: string;
  videoId: string;
  selected: boolean;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: Thumbnail;
      medium: Thumbnail;
      high: Thumbnail;
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
  source: 'youtube' | 'custom';
  statistics:
    | {
        viewCount: string;
        favoriteCount: string;
        commentCount: string;
        likeCount?: string;
      }
    | undefined;
  transcript: string;
}

export interface YoutubeTranscriptResult {
  videoId: string;
  text: string;
}
