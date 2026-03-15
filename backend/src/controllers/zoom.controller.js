import crypto from 'crypto';

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
    const exp = iat + 60 * 60 * 2; // 2 hours

    const oHeader = { alg: 'HS256', typ: 'JWT' };

    const oPayload = {
      sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      appKey: sdkKey,
      tokenExp: exp,
    };

    const sHeader  = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);

    const base64Header  = Buffer.from(sHeader).toString('base64url');
    const base64Payload = Buffer.from(sPayload).toString('base64url');

    const message   = `${base64Header}.${base64Payload}`;
    const signature = crypto
      .createHmac('sha256', sdkSecret)
      .update(message)
      .digest('base64url');

    const token = `${message}.${signature}`;

    return res.json({
      signature: token,
      sdkKey,
      meetingNumber,
      role,
    });
  } catch (error) {
    console.error('Zoom signature error:', error);
    return res.status(500).json({ error: 'Failed to generate signature' });
  }
};

export const createZoomMeeting = async (req, res) => {
  try {
    const { appointmentId, topic } = req.body;

    // Meeting number generate karo — appointment ID se consistent number
    const meetingNumber = parseInt(appointmentId.replace(/\D/g, '').slice(0, 10)) || Math.floor(Math.random() * 9000000000) + 1000000000;

    return res.json({
      meetingNumber: meetingNumber.toString(),
      topic: topic || 'HealthLine Consultation',
      password: '',
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    return res.status(500).json({ error: 'Failed to create meeting' });
  }
};