import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PhoneOff, Video, MessageCircle, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;
const ZOOM_SDK_KEY = process.env.REACT_APP_ZOOM_SDK_KEY;

function useWindowWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

const font = "'Plus Jakarta Sans','Segoe UI',sans-serif";
const mono = "'JetBrains Mono','Courier New',monospace";

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const w = useWindowWidth();
  const isMobile = w < 768;

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomLoaded, setZoomLoaded] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOnly, setIsChatOnly] = useState(false);

  const zoomClientRef = useRef(null);
  const websocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const WS_URL = String(BACKEND_URL).replace('https://', 'wss://').replace('http://', 'ws://');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await axios.get(`${API}/appointments/${appointmentId}`);
        setAppointment(res.data);
        if (res.data.consultation_type === 'chat') {
          setIsChatOnly(true);
          setShowChat(true);
        }
        try {
          const msgRes = await axios.get(`${API}/chat/messages/${appointmentId}?limit=50&skip=0`);
          if (msgRes.data?.length > 0) {
            setMessages(msgRes.data.map(m => ({
              id: m.id, sender_id: m.sender_id,
              sender_role: m.sender_role, message: m.message
            })));
          }
        } catch {}
      } catch {
        toast.error('Failed to fetch appointment');
        navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (appointmentId) fetchAppointment();
  }, [appointmentId]);

  useEffect(() => {
    if (!token || !appointment) return;
    const ws = new WebSocket(`${WS_URL}/api/ws/consultation/${appointmentId}`);
    websocketRef.current = ws;
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'auth', token })); };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, {
          id: data.id || Date.now(),
          sender_id: data.from_user_id,
          sender_role: data.from_role,
          message: data.message
        }]);
      }
      if (data.type === 'auth_success') toast.success('Connected to consultation room');
    };
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close(1000, 'Component unmounting');
    };
  }, [token, appointment]);

  useEffect(() => {
    if (isChatOnly) return;
    const loadZoom = async () => {
      try {
        const { ZoomMtg } = await import('@zoom/meetingsdk');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();
        zoomClientRef.current = ZoomMtg;
        setZoomLoaded(true);
      } catch (err) {
        console.error('Zoom SDK load error:', err);
        setError('Failed to load Zoom SDK');
      }
    };
    loadZoom();
  }, [isChatOnly]);

  const startZoomMeeting = async () => {
    if (!zoomClientRef.current) return;
    try {
      toast.loading('Starting video consultation...');
      const meetingRes = await axios.post(`${API}/zoom/meeting`,
        { appointmentId, topic: 'HealthLine Consultation' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { meetingNumber } = meetingRes.data;
      const sigRes = await axios.post(`${API}/zoom/signature`,
        { meetingNumber, role: user?.role === 'doctor' ? 1 : 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { signature } = sigRes.data;
      toast.dismiss();
      const ZoomMtg = zoomClientRef.current;

      // Zoom container activate karo
      const zoomRoot = document.getElementById('zmmtg-root');
      if (zoomRoot) zoomRoot.classList.add('zoom-active');

      ZoomMtg.init({
        leaveUrl: window.location.href,
        patchJsMedia: true,
        leaveOnPageUnload: true,
        success: () => {
          ZoomMtg.join({
            sdkKey: ZOOM_SDK_KEY,
            signature,
            meetingNumber,
            passWord: '',
            userName: user?.full_name || (user?.role === 'doctor' ? 'Doctor' : 'Patient'),
            userEmail: user?.email || '',
            success: () => { setInMeeting(true); toast.success('Joined meeting!'); },
            error: (err) => { console.error('Join error:', err); toast.error('Failed to join meeting'); }
          });
        },
        error: (err) => {
          // Error pe container hide karo
          if (zoomRoot) zoomRoot.classList.remove('zoom-active');
          console.error('Init error:', err);
          toast.error('Failed to initialize Zoom');
        }
      });
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to start meeting');
    }
  };

  const endCall = () => {
    if (zoomClientRef.current && inMeeting) {
      try { zoomClientRef.current.leaveMeeting({}); } catch {}
    }
    // Zoom container hide karo
    const zoomRoot = document.getElementById('zmmtg-root');
    if (zoomRoot) zoomRoot.classList.remove('zoom-active');

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'leave' }));
      websocketRef.current.close();
    }
    navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'chat_message', message: newMessage }));
      setNewMessage('');
    } else { toast.error('Not connected to chat'); }
  };

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'#fff', fontFamily:font }}>
        Loading...
      </div>
    );
  }

  const ChatPanel = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff', borderRadius:isMobile?0:16, overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>
          {isChatOnly ? 'Chat Consultation' : 'Chat'}
        </h3>
        {isMobile && !isChatOnly && (
          <button onClick={() => setShowChat(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}>
            <X size={18} />
          </button>
        )}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:8 }}>
        {messages.length === 0 ? (
          <p style={{ textAlign:'center', color:'#9ca3af', fontSize:13, margin:'auto 0', fontFamily:mono }}>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id || i} style={{ display:'flex', justifyContent:msg.sender_id === user?.id ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth:'80%', borderRadius:14, padding:'8px 12px', background:msg.sender_id === user?.id ? '#4f46e5' : '#f1f5f9', color:msg.sender_id === user?.id ? '#fff' : '#1e293b' }}>
                <p style={{ fontSize:10, fontWeight:600, marginBottom:3, opacity:0.75, fontFamily:mono }}>{msg.sender_role === 'doctor' ? 'Doctor' : 'Patient'}</p>
                <p style={{ fontSize:13, margin:0, lineHeight:1.5 }}>{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} style={{ display:'flex', gap:8, padding:'12px', borderTop:'1px solid #f3f4f6' }}>
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..."
          style={{ flex:1, padding:'10px 14px', border:'1px solid #e5e7eb', borderRadius:999, fontSize:13, outline:'none', fontFamily:font, background:'#f9fafb' }} />
        <button type="submit" disabled={!newMessage.trim()}
          style={{ width:38, height:38, borderRadius:'50%', background:'#4f46e5', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, opacity:!newMessage.trim()?0.5:1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  );

  const VideoArea = () => (
    <div id="zmmtg-root" style={{ background:'#1e293b', borderRadius:isMobile?12:16, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', minHeight:isMobile?280:400, flex:1 }}>
      {!inMeeting && (
        <div style={{ textAlign:'center', color:'#fff', padding:'2rem' }}>
          {error ? (
            <div>
              <p style={{ color:'#fca5a5', marginBottom:12 }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ padding:'8px 20px', background:'#334155', border:'none', borderRadius:999, color:'#fff', cursor:'pointer' }}>Reload</button>
            </div>
          ) : (
            <div>
              <div style={{ width:70, height:70, borderRadius:'50%', background:'#334155', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <Video size={30} color="#4f46e5" />
              </div>
              <p style={{ color:'#94a3b8', fontSize:isMobile?13:15, marginBottom:6 }}>
                {zoomLoaded ? 'Ready to start video consultation' : 'Loading Zoom...'}
              </p>
              <p style={{ color:'#64748b', fontSize:11, marginBottom:20, fontFamily:mono }}>Powered by Zoom</p>
              <button onClick={startZoomMeeting} disabled={!zoomLoaded}
                style={{ padding:isMobile?'10px 24px':'14px 40px', background:zoomLoaded?'#4f46e5':'#334155', border:'none', borderRadius:999, color:'#fff', fontSize:isMobile?13:15, fontWeight:600, cursor:zoomLoaded?'pointer':'not-allowed', display:'inline-flex', alignItems:'center', gap:8 }}>
                <Video size={isMobile?16:20} />
                {zoomLoaded ? 'Start Video Call' : 'Loading...'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', fontFamily:font }} data-testid="consultation-room">
      <header style={{ background:'#1e293b', borderBottom:'1px solid #334155', padding:'0 1rem' }}>
        <div style={{ height:isMobile?52:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={endCall} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #475569', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8' }}>
              <ArrowLeft size={15} />
            </button>
            <h1 style={{ fontSize:isMobile?13:15, fontWeight:700, color:'#f1f5f9', margin:0 }}>
              {isChatOnly ? 'Chat Consultation' : 'Video Consultation'}
            </h1>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, background:inMeeting?'#059669':'#2563eb', color:'#fff', fontFamily:mono }}>
              {inMeeting ? '● In Meeting' : '● Ready'}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {isMobile && !isChatOnly && (
              <button onClick={() => setShowChat(s => !s)}
                style={{ width:32, height:32, borderRadius:'50%', border:'none', background:showChat?'#4f46e5':'#334155', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <MessageCircle size={15} color="#fff" />
              </button>
            )}
            <button onClick={endCall} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <PhoneOff size={14} color="#fff" />
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding:isMobile?'0.75rem':'1.25rem', height:`calc(100vh - ${isMobile?52:56}px)`, display:'flex', flexDirection:'column', boxSizing:'border-box' }}>
        {isChatOnly ? (
          <div style={{ flex:1, maxWidth:720, margin:'0 auto', width:'100%' }}>
            <ChatPanel />
          </div>
        ) : isMobile ? (
          showChat ? (
            <div style={{ flex:1 }}><ChatPanel /></div>
          ) : (
            <VideoArea />
          )
        ) : (
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 340px', gap:'1rem' }}>
            <VideoArea />
            <ChatPanel />
          </div>
        )}
      </div>
    </div>
  );
}