const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const OpenAI = require('openai');
const axios = require('axios');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Configure CORS to only allow requests from your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

app.use(express.json());

// Extract YouTube video ID from URL
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function getVideoInfo(videoId) {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      id: videoId
    });

    const video = response.data.items[0];
    if (!video) {
      throw new Error('Video not found');
    }

    // Get channel details
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: video.snippet.channelId
    });
    
    const channel = channelResponse.data.items[0];

    return {
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      channelInfo: {
        name: channel.snippet.title,
        description: channel.snippet.description,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount
      }
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw error;
  }
}

async function generateSummary(transcript, videoInfo) {
  try {
    // Split transcript into chunks of roughly 5000 characters each
    const chunkSize = 5000;
    const chunks = [];
    for (let i = 0; i < transcript.length; i += chunkSize) {
      chunks.push(transcript.slice(i, i + chunkSize));
    }

    // Process each chunk and get summaries
    const chunkSummaries = [];
    for (let chunk of chunks) {
      let prompt = `Please summarize this part of the video transcript, focusing on the most important points:\n\n${chunk}`;
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo-16k",
        temperature: 0.7,
        max_tokens: 1000
      });

      chunkSummaries.push(completion.choices[0].message.content);
    }

    // Combine chunk summaries into a final summary
    const combinedSummary = chunkSummaries.join('\n\n');
    
    let finalPrompt;
    if (videoInfo && videoInfo.channelInfo) {
      finalPrompt = `Please provide a comprehensive and detailed summary of this YouTube video by ${videoInfo.channelInfo.name} (${videoInfo.channelTitle}) about ${videoInfo.title}.
The channel has ${parseInt(videoInfo.channelInfo.subscriberCount).toLocaleString()} subscribers and this video has ${parseInt(videoInfo.viewCount).toLocaleString()} views.

Based on the following preliminary summary, generate a detailed structured summary:

${combinedSummary}`;
    } else {
      finalPrompt = `Please provide a comprehensive and detailed summary based on the following preliminary summary:\n\n${combinedSummary}`;
    }

    finalPrompt += `\n\nStructure the summary exactly in this format:

**Summary**
Write a comprehensive paragraph overview that thoroughly explains all the video's content, context, and main arguments. Each paragraph should focus on different aspects: introduction, main discussion points, and key takeaways. Make it detailed but clear including data, brands or any other relevant information.

**Highlights**
Write 3-6 unique highlights, each focusing on a different aspect. Each highlight must start with an emoji then important or relevant information. Do not repeat the emojis. Use different emojis for each sentence.
Use these emojis: 🔍📊📈📉💹⚡🔧🌐💻🔗💰💵🏦💼📱🎯🎨🔑💡⚙️⚠️❗❌🚫⛔✅👍💪🏆💯🔄🔨🛠️📝🌟💥🔥⭐💫


The transcript is:

${transcript}`;

    const finalCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: finalPrompt }],
      model: "gpt-3.5-turbo-16k",
      temperature: 0.7,
      max_tokens: 2000
    });

    return finalCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateSummary:', error);
    throw error;
  }
}

app.post('/api/summarize', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('\n--- Starting transcript fetch process ---');
    console.log('URL received:', url);
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const videoId = extractVideoId(url);
    console.log('Extracted video ID:', videoId);
    
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Fetch video metadata if YouTube API key is available
    let videoInfo = null;
    if (process.env.YOUTUBE_API_KEY) {
      try {
        videoInfo = await getVideoInfo(videoId);
      } catch (error) {
        console.log('Failed to fetch video metadata:', error.message);
      }
    }

    let transcript;
    let language = 'unknown';
    let rawTranscript = '';
    
    try {
      console.log('\n1. Attempting to fetch transcript...');
      transcript = await YoutubeTranscript.fetchTranscript(videoId);
      language = transcript[0].lang || 'unknown';
      console.log('Transcript fetch successful');
      console.log('Transcript length:', transcript.length);
      
      // Format transcript with timestamps
      rawTranscript = transcript.map(item => {
        const minutes = Math.floor(item.offset / 60000);
        const seconds = Math.floor((item.offset % 60000) / 1000);
        return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${item.text}`;
      }).join('\n');
      
      console.log('Raw transcript length:', rawTranscript.length);
    } catch (error) {
      console.error('\n--- Transcript Fetch Error ---');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      return res.status(404).json({ 
        error: `Failed to fetch transcripts: ${error.message}`,
        details: {
          videoId,
          errorType: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        }
      });
    }

    if (!transcript || transcript.length === 0) {
      console.log('\nTranscript validation failed:');
      console.log('Transcript empty:', !transcript);
      console.log('Transcript length:', transcript ? transcript.length : 0);
      
      return res.status(404).json({ 
        error: 'No transcript available for this video.',
        details: {
          videoId,
          transcriptEmpty: !transcript,
          transcriptLength: transcript ? transcript.length : 0
        }
      });
    }

    console.log('\n--- Transcript fetch successful ---');
    console.log('Language detected:', language);
    console.log('Transcript length:', transcript.length);

    const text = transcript.map(item => item.text).join(' ');

    const summary = await generateSummary(text, videoInfo);

    console.log('\nSending response with transcript length:', rawTranscript.length);
    
    return res.json({ 
      summary: summary,
      transcript: rawTranscript,
      language: language,
      videoInfo: videoInfo ? {
        title: videoInfo.title,
        description: videoInfo.description,
        thumbnail: videoInfo.thumbnail,
        channelTitle: videoInfo.channelTitle,
        publishedAt: videoInfo.publishedAt,
        viewCount: videoInfo.viewCount,
        likeCount: videoInfo.likeCount,
        channelInfo: videoInfo.channelInfo
      } : null
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message || 'An error occurred',
      details: {
        errorType: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
          Maintain the same formatting, emojis, and structure as the original text.
          Keep all technical terms and jargon in their appropriate form in the target language.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return res.json({ 
      translation: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Translation Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Translation failed',
      details: {
        errorType: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
  }
});

app.get('/api/video-info', async (req, res) => {
  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // If no API key is available, return basic info
    if (!process.env.YOUTUBE_API_KEY) {
      return res.json({
        videoInfo: {
          title: 'Video Preview',
          description: 'Video details not available. Add a YouTube API key to see full details.',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          channelTitle: 'Unknown Channel'
        }
      });
    }

    try {
      const videoInfo = await getVideoInfo(videoId);
      return res.json({
        videoInfo: {
          title: videoInfo.title,
          description: videoInfo.description,
          thumbnail: videoInfo.thumbnail,
          channelTitle: videoInfo.channelTitle,
          publishedAt: videoInfo.publishedAt,
          viewCount: videoInfo.viewCount,
          likeCount: videoInfo.likeCount,
          channelInfo: videoInfo.channelInfo
        }
      });
    } catch (error) {
      console.error('YouTube API Error:', error);
      // Return basic info on API error
      return res.json({
        videoInfo: {
          title: 'Video Preview',
          description: 'Video details not available.',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          channelTitle: 'Unknown Channel'
        }
      });
    }
  } catch (error) {
    console.error('Video Info Error:', error);
    return res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});