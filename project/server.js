const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Environment variables
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;

// Instagram publishing route
app.post('/api/publish-to-instagram', upload.single('image'), async (req, res) => {
  try {
    console.log('=== Instagram Publish Request ===');
    console.log('Request body:', req.body);
    console.log('Environment check:');
    console.log('ACCESS_TOKEN exists:', !!ACCESS_TOKEN);
    console.log('IG_USER_ID exists:', !!IG_USER_ID);

    const { caption, image_url } = req.body;
    
    // Use environment variables
    const token = ACCESS_TOKEN;
    const userId = IG_USER_ID;
    
    if (!token || !userId) {
      console.error('Missing credentials:', { token: !!token, userId: !!userId });
      return res.status(400).json({ 
        error: 'Missing Instagram credentials in environment variables',
        details: 'Please set INSTAGRAM_ACCESS_TOKEN and IG_USER_ID in your .env file'
      });
    }

    console.log('Using token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('Using user ID:', userId);
    console.log('Image URL:', image_url);
    console.log('Caption:', caption);

    // Step 1: Create media container
    const mediaPayload = {
      image_url: image_url,
      caption,
      access_token: token
    };

    console.log('Creating media container with payload:', mediaPayload);
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaPayload),
    });
    
    const mediaData = await mediaRes.json();
    console.log('Media creation response:', mediaData);
    
    if (mediaData.error) {
      console.error('Media creation error:', mediaData.error);
      return res.status(400).json({ 
        error: 'Failed to create media container',
        details: mediaData.error.message || mediaData.error,
        code: mediaData.error.code
      });
    }

    if (!mediaData.id) {
      console.error('No media ID returned:', mediaData);
      return res.status(400).json({ 
        error: 'Invalid response from Instagram API - no media ID',
        details: mediaData
      });
    }

    // Step 2: Publish media
    console.log('Publishing media with creation_id:', mediaData.id);
    const publishPayload = {
      creation_id: mediaData.id,
      access_token: token
    };

    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${userId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishPayload),
    });

    const result = await publishRes.json();
    console.log('Publish response:', result);
    
    if (result.error) {
      console.error('Publish error:', result.error);
      return res.status(400).json({ 
        error: 'Failed to publish to Instagram',
        details: result.error.message || result.error,
        code: result.error.code
      });
    }

    if (!result.id) {
      console.error('No post ID returned:', result);
      return res.status(400).json({ 
        error: 'Publishing failed - no post ID returned',
        details: result
      });
    }
    
    console.log('✅ Successfully published to Instagram! Post ID:', result.id);
    res.json({ 
      success: true, 
      postId: result.id,
      message: 'Successfully published to Instagram!'
    });
    
  } catch (err) {
    console.error('Instagram publish failed:', err);
    res.status(500).json({ 
      error: 'Server error during Instagram publishing', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Instagram API server is running' });
});

// --- NEW INSTAGRAM AUTH AND WEBHOOK ROUTES ---

// Instagram OAuth Redirect URI (GET request)
// This is where Instagram redirects the user after successful login/authorization.
// This endpoint receives an 'authorization code' which your backend then
// exchanges for an 'access token' with Instagram's API.
// You will set this URL in Meta Developer settings under "OAuth redirect URIs".
app.get('/auth/instagram/callback', (req, res) => {
    console.log('--- Received Instagram OAuth Callback ---');
    console.log('Query Parameters:', req.query); // This should contain the 'code' parameter

    const authCode = req.query.code;

    if (authCode) {
        console.log('Authorization Code received:', authCode);
        // TODO: This is where you would typically make a server-to-server POST request
        // to Instagram's token endpoint (e.g., https://api.instagram.com/oauth/access_token)
        // to exchange this authCode for a long-lived access token.
        // You'll need your App ID, App Secret, and the same redirect_uri for this.
        // After getting the access token, store it securely (e.g., in a database
        // associated with the user in your system).

        // For now, after receiving the code, you can redirect the user to
        // your app's frontend dashboard or a success page.
        // REMEMBER TO REPLACE THIS WITH YOUR ACTUAL FRONTEND DASHBOARD/SUCCESS PAGE URL
        res.redirect('/dashboard?status=instagram_login_success');
    } else {
        console.error('No authorization code found in Instagram callback. Possible error or user denied access.');
        // Redirect user to an error page or back to login
        res.redirect('/login?status=instagram_login_failed');
    }
});

// Instagram Deauthorize Callback Endpoint (POST request)
// This webhook is called by Meta's servers when a user deauthorizes your app
// from their Facebook/Instagram settings. This is crucial for privacy compliance.
// You will set this URL in Meta Developer settings under "Deauthorize callback URL".
app.post('/api/instagram/deauthorize', (req, res) => {
    console.log('--- Received Instagram Deauthorize Callback ---');
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', JSON.stringify(req.body, null, 2)); // Log the full JSON body

    // IMPORTANT ACTIONS TO TAKE HERE IN A PRODUCTION APP:
    // 1. *VERIFY THE REQUEST SIGNATURE*: Meta signs these requests. You MUST verify
    //    the signature to ensure the request is truly from Meta and not malicious.
    //    Refer to Meta's Webhooks guide for details:
    //    https://developers.facebook.com/docs/graph-api/webhooks/getting-started/#receive-updates
    // 2. *IDENTIFY THE USER*: Extract the user ID from the req.body.
    //    The payload structure is typically: {"object": "user", "entry": [{"uid": "USER_ID", "time": TIMESTAMP}]}
    // 3. *DELETE USER DATA*: Immediately delete all data associated with this user
    //    from your database and invalidate any stored access tokens.
    //    This is a strict requirement by Meta's Platform Policy.

    // Always respond with a 200 OK status to acknowledge receipt within a few seconds.
    res.sendStatus(200);
});

// Instagram Data Deletion Request Endpoint (POST request)
// This webhook is called by Meta's servers when a user requests their data
// to be deleted from your app via Meta's tools. Similar to deauthorize,
// but specifically for data deletion.
// You will set this URL in Meta Developer settings under "Data deletion request URL".
app.post('/api/instagram/data-deletion', (req, res) => {
    console.log('--- Received Instagram Data Deletion Request ---');
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', JSON.stringify(req.body, null, 2)); // Log the full JSON body

    // IMPORTANT ACTIONS TO TAKE HERE IN A PRODUCTION APP:
    // 1. *VERIFY THE REQUEST SIGNATURE*: Again, verify the signature for security.
    // 2. *IDENTIFY THE USER*: Extract user ID from req.body.
    //    Payload structure can vary, but often includes user_id or similar.
    //    Sometimes, Meta sends a 'confirmation_code' or a URL for status.
    // 3. *PERMANENTLY DELETE USER DATA*: Delete all user data associated
    //    with this user from your database permanently.
    // 4. *RESPOND AS REQUIRED*: Meta might expect a specific JSON response
    //    that includes a confirmation URL or confirmation code. For now, a 200 OK is fine for testing.
    //    Example response if needed:
    //    res.json({ url: "YOUR_DATA_DELETION_STATUS_URL_HERE", confirmation_code: "YOUR_CONFIRMATION_CODE" });


    // Always respond with a 200 OK status to acknowledge receipt.
    res.sendStatus(200);
});

// --- END NEW INSTAGRAM AUTH AND WEBHOOK ROUTES ---

app.listen(PORT, () => {
  console.log(`Instagram API server running on port ${PORT}`);
});

module.exports = app;