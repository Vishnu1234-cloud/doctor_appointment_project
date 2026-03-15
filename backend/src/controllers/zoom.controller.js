import crypto from 'crypto';
import axios from 'axios';

// Zoom OAuth token generate karo
const getZoomAccessToken = async () => {
  const accountId    = process.env.ZOOM_ACCOUNT_ID;
  const clientId     = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom Server-to-Server OAuth credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
};

// Zoom signature generate karo (Meeting SDK join ke liye)
export const generateZoomSignature = async (req, res) => {
  try {
    const { meetingNumber, role } = req.body;

    if (!meetingNumber || role === undefined) {
      return res.status(400).json({ error: 'meetingNumber and role are required' });
    }

    const sdkKey    = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return res.status(500).json({ error: 'Zoom SDK credentials not configured' });
    }

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const oHeader  = { alg: 'HS256', typ: 'JWT' };
    const oPayload = { sdkKey, mn: meetingNumber, role, iat, exp, appKey: sdkKey, tokenExp: exp };

    const base64Header  = Buffer.from(JSON.stringify(oHeader)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(oPayload)).toString('base64url');
    const message       = `${base64Header}.${base64Payload}`;
    const signature     = crypto.createHmac('sha256', sdkSecret).update(message).digest('base64url');
    const token         = `${message}.${signature}`;

    return res.json({ signature: token, sdkKey, meetingNumber, role });
  } catch (error) {
    console.error('Zoom signature error:', error);
    return res.status(500).json({ error: 'Failed to generate signature' });
  }
};

// Real Zoom meeting create karo
export const createZoomMeeting = async (req, res) => {
  try {
    const { topic } = req.body;

    const accessToken = await getZoomAccessToken();

    const meetingResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: topic || 'HealthLine Consultation',
        type: 1,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
          audio: 'both',
          auto_recording: 'none',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const meeting = meetingResponse.data;

    return res.json({
      meetingNumber: meeting.id.toString(),
      topic: meeting.topic,
      password: meeting.password || '',
      joinUrl: meeting.join_url,
    });
  } catch (error) {
    console.error('Create meeting error:', error?.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to create meeting',
      detail: error?.response?.data?.message || error.message,
    });
  }
};