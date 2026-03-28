import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

export const generateTwilioToken = async (req, res) => {
  try {
    const { roomName, identity } = req.body;

    if (!roomName || !identity) {
      return res.status(400).json({ error: 'roomName and identity are required' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey     = process.env.TWILIO_API_KEY;
    const apiSecret  = process.env.TWILIO_API_SECRET;

    if (!accountSid || !apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: String(identity)
    });

    const videoGrant = new VideoGrant({ room: roomName });
    token.addGrant(videoGrant);

    return res.json({ token: token.toJwt() });

  } catch (error) {
    console.error('Twilio token error:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
};