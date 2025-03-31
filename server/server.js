const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');
const { google } = require('googleapis');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Initialize Firebase Admin and get db reference
let db;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
  db = admin.firestore(); // Define db here
}

const INITIAL_TOKENS = 15;
const TOKENS_PER_SUMMARY = 1;

// Configure CORS to only allow requests from your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Allow cookies to be sent with requests
}));

app.use(express.json());
app.use(cookieParser());

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const user = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value
      };

      // Use admin.firestore() instead of db
      try {
        const userRef = admin.firestore().collection('users').doc(user.id);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          await userRef.set({
            tokens: INITIAL_TOKENS,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ...user
          });
        } else {
          const userData = userDoc.data();
          if (typeof userData.tokens === 'undefined') {
            await userRef.update({
              tokens: INITIAL_TOKENS,
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      } catch (firebaseError) {
        console.error('Firebase operation error:', firebaseError);
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Auth error:', error);
      return done(error, null);
    }
  }
));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Auth middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required', redirectToLogin: true });
};

// Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to the frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.get('/auth/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({ success: true });
  });
});

// Extract YouTube video ID from URL
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Add at the top with other global variables
const videoContexts = new Map(); // Store video contexts in memory (low cost solution)

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

async function generateSummary(transcript, videoInfo, language) {
  try {
    const prompt = `Create an engaging summary of this YouTube video transcript in ${language} language. The video is titled "${videoInfo?.title || 'Unknown Title'}" by ${videoInfo?.channelTitle || 'Unknown Channel'}.

Transcript:
${transcript}

Important instructions:
1. Write 3-4 clear paragraphs with double line breaks between them
2. Add 5-8 relevant emojis naturally within the text (not at the start of paragraphs)
3. Use **bold** for important terms and key concepts
4. Make it conversational and engaging
5. End with a question inviting further discussion

Use these emojis where relevant: 🔍📊📈📉💹⚡🔧🌐💻🔗💰💵🏦💼📱🎯🎨🔑💡`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error in generateSummary:', error.response?.data || error);
    throw error;
  }
}

// Now require authentication for the main features
app.post('/api/summarize', isAuthenticated, async (req, res) => {
  try {
    // Check user's tokens in Firebase first
    const userRef = admin.firestore().collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData.tokens || userData.tokens < 1) {
      return res.status(403).json({ 
        error: 'Insufficient tokens',
        tokens: userData.tokens || 0
      });
    }

    // Existing URL validation code
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const videoId = extractVideoId(url);
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
      language = transcript[0].lang || 'en'; // Default to 'en' if no language detected
      console.log('Transcript fetch successful');
      console.log('Language detected:', language);
      console.log('Transcript length:', transcript.length);
      
      // Format transcript with timestamps
      let currentTime = 0; // Keep track of cumulative time
      rawTranscript = transcript.map(item => {
        // Convert duration from seconds to milliseconds and add to current time
        currentTime += item.duration * 1000;
        const totalSeconds = Math.floor(currentTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
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

    const summary = await generateSummary(text, videoInfo, language.split('-')[0]);

    console.log('\nSending response with transcript length:', rawTranscript.length);
    
    // Store the user's activity
    console.log(`User ${req.user.name} (${req.user.email}) summarized video: ${videoId}`);
    
    // After successfully generating the summary, decrease tokens
    await userRef.update({
      tokens: admin.firestore.FieldValue.increment(-1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated token count
    const updatedUserDoc = await userRef.get();
    const updatedTokens = updatedUserDoc.data().tokens;

    // Return the response with updated token count
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
      } : null,
      tokens: updatedTokens // Add tokens to response
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

// This endpoint is also protected - requires login
app.post('/api/translate', isAuthenticated, async (req, res) => {
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

// This endpoint is public - basic video info doesn't require login
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

// Chat endpoint requires authentication too
app.post('/api/chat', isAuthenticated, async (req, res) => {
  try {
    const { message, context } = req.body;

    const prompt = `You're discussing a video titled "${context.videoTitle}". 
Use this transcript and summary as context for answering:

Summary: ${context.summary}

Transcript: ${context.transcript}

User question: ${message}

Important:
1. Base your answer only on the video content
2. Be concise and friendly
3. Use **bold** for key terms
4. If something isn't in the video content, say so
5. Keep responses focused and relevant`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return res.json({
      reply: response.data.candidates[0].content.parts[0].text
    });

  } catch (error) {
    console.error('Chat Error:', error.response?.data || error);
    return res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.response?.data || error.message
    });
  }
});

// Add instead
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Add validation
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});