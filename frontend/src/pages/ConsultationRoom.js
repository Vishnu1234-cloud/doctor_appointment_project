import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Video, VideoOff, Mic, MicOff, PhoneOff, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;
const WS_URL = String(BACKEND_URL).replace('https://', 'wss://').replace('http://', 'ws://');

const DEFAULT_ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function useWindowWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

// ── Styles ──────────────────────────────────────────────
const font = "'Plus Jakarta Sans','Segoe UI',sans-serif";
const mono = "'JetBrains Mono','Courier New',monospace";

const statusColors = {
  connecting:    { bg:'#ca8a04', text:'#fff' },
  reconnecting:  { bg:'#ea580c', text:'#fff' },
  authenticating:{ bg:'#ca8a04', text:'#fff' },
  waiting:       { bg:'#2563eb', text:'#fff' },
  connected:     { bg:'#059669', text:'#fff' },
  disconnected:  { bg:'#dc2626', text:'#fff' },
  error:         { bg:'#dc2626', text:'#fff' },
  call_ended:    { bg:'#6b7280', text:'#fff' },
};

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const w = useWindowWidth();
  const isMobile = w < 768;

  const [appointment, setAppointment]     = useState(null);
  const [messages, setMessages]           = useState([]);
  const [newMessage, setNewMessage]       = useState('');
  const [videoEnabled, setVideoEnabled]   = useState(true);
  const [audioEnabled, setAudioEnabled]   = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [remoteUser, setRemoteUser]       = useState(null);
  const [isChatOnly, setIsChatOnly]       = useState(false);
  const [cameraError, setCameraError]     = useState(null);
  const [showChat, setShowChat]           = useState(false); // mobile toggle
  const [skipMessages, setSkipMessages]   = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const localStreamRef    = useRef(null);
  const peerConnectionRef = useRef(null);
  const websocketRef      = useRef(null);
  const remoteUserIdRef   = useRef(null);
  const iceServersRef     = useRef(DEFAULT_ICE_SERVERS);
  const reconnectTimeoutRef = useRef(null);
  const messagesEndRef    = useRef(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await axios.get(`${API}/appointments/${appointmentId}`);
        const apt = response.data;
        setAppointment(apt);
        if (apt.consultation_type === 'chat') {
          setIsChatOnly(true);
          setShowChat(true);
        }
        try {
          const limit = 50;
          const messagesResponse = await axios.get(`${API}/chat/messages/${appointmentId}?limit=${limit}&skip=0`);
          if (messagesResponse.data && messagesResponse.data.length > 0) {
            setMessages(messagesResponse.data.map(msg => ({
              id: msg.id, sender_id: msg.sender_id,
              sender_role: msg.sender_role, message: msg.message, timestamp: msg.timestamp
            })));
            setSkipMessages(messagesResponse.data.length);
            if (messagesResponse.data.length < limit) setHasMoreMessages(false);
          } else { setHasMoreMessages(false); }
        } catch {}
      } catch (error) {
        toast.error('Failed to fetch appointment');
        navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
      }
    };
    if (appointmentId) fetchAppointment();
  }, [appointmentId, navigate, user]);

  const fetchMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    setIsLoadingMore(true);
    try {
      const limit = 50;
      const response = await axios.get(`${API}/chat/messages/${appointmentId}?limit=${limit}&skip=${skipMessages}`);
      if (response.data && response.data.length > 0) {
        setMessages(prev => [...response.data.map(msg => ({ id:msg.id, sender_id:msg.sender_id, sender_role:msg.sender_role, message:msg.message, timestamp:msg.timestamp })), ...prev]);
        setSkipMessages(prev => prev + response.data.length);
        if (response.data.length < limit) setHasMoreMessages(false);
      } else { setHasMoreMessages(false); }
    } catch { toast.error('Failed to load older messages'); }
    finally { setIsLoadingMore(false); }
  };

  const initializeLocalStream = useCallback(async () => {
    if (isChatOnly) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:{ideal:1280}, height:{ideal:720} }, audio:true });
      localStreamRef.current = stream;
      setCameraError(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      toast.success('Camera and microphone connected');
      return stream;
    } catch (error) {
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera/mic found.');
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Permission denied.');
      } else {
        setCameraError('Camera unavailable.');
      }
      toast.error('Could not access camera/microphone.');
      return null;
    }
  }, [isChatOnly]);

  const createPeerConnection = useCallback((remoteUserId) => {
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    const pc = new RTCPeerConnection(iceServersRef.current);
    peerConnectionRef.current = pc;
    remoteUserIdRef.current = remoteUserId;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus('connected');
        toast.success('Connected to remote user');
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type:'ice_candidate', target_user_id:remoteUserId, candidate:event.candidate }));
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setConnectionStatus('connected');
      else if (pc.connectionState === 'disconnected') { setConnectionStatus('reconnecting'); toast.warning('Peer disconnected...'); }
      else if (pc.connectionState === 'failed') {
        setConnectionStatus('error');
        toast.error('Connection failed. Reconnecting...');
        setTimeout(() => { if (remoteUserIdRef.current) createOffer(remoteUserIdRef.current); }, 1000);
      }
    };
    return pc;
  }, []);

  const createOffer = useCallback(async (targetUserId) => {
    const pc = createPeerConnection(targetUserId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type:'offer', target_user_id:targetUserId, offer }));
      }
    } catch (error) { console.error('Error creating offer:', error); }
  }, [createPeerConnection]);

  const handleOffer = useCallback(async (offer, fromUserId, fromRole) => {
    setRemoteUser({ id:fromUserId, role:fromRole });
    const pc = createPeerConnection(fromUserId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type:'answer', target_user_id:fromUserId, answer }));
      }
    } catch (error) { console.error('Error handling offer:', error); }
  }, [createPeerConnection]);

  const handleAnswer = useCallback(async (answer) => {
    if (peerConnectionRef.current) {
      try { await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer)); }
      catch (error) { console.error('Error setting remote description:', error); }
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnectionRef.current) {
      try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (error) { console.error('Error adding ICE candidate:', error); }
    }
  }, []);

  useEffect(() => {
    if (!token || !appointmentId || !appointment) return;
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = async () => {
      if (!isChatOnly) await initializeLocalStream();
      ws = new WebSocket(`${WS_URL}/api/ws/consultation/${appointmentId}`);
      websocketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('authenticating');
        ws.send(JSON.stringify({ type:'auth', token }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'auth_success':
            if (data.ice_servers?.length > 0) iceServersRef.current = { iceServers: data.ice_servers };
            reconnectAttempts = 0;
            setConnectionStatus('waiting');
            toast.success('Connected to consultation room');
            if (data.room_users?.length > 0 && !isChatOnly) {
              const other = data.room_users[0];
              setRemoteUser({ id:other.user_id, role:other.role });
              createOffer(other.user_id);
            } else if (data.room_users?.length > 0) {
              setRemoteUser({ id:data.room_users[0].user_id, role:data.room_users[0].role });
              setConnectionStatus('connected');
            }
            break;
          case 'user_joined':
            toast.info(`${data.user_role === 'doctor' ? 'Doctor' : 'Patient'} joined`);
            setRemoteUser({ id:data.user_id, role:data.user_role });
            if (!peerConnectionRef.current && !isChatOnly) createOffer(data.user_id);
            else if (isChatOnly) setConnectionStatus('connected');
            break;
          case 'user_left':
            toast.warning(`${data.user_role === 'doctor' ? 'Doctor' : 'Patient'} left`);
            setRemoteUser(null);
            setConnectionStatus('waiting');
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
            break;
          case 'offer':    if (!isChatOnly) handleOffer(data.offer, data.from_user_id, data.from_role); break;
          case 'answer':   if (!isChatOnly) handleAnswer(data.answer); break;
          case 'ice_candidate': if (!isChatOnly) handleIceCandidate(data.candidate); break;
          case 'chat_message':
            setMessages(prev => [...prev, { id:data.id||Date.now(), sender_id:data.from_user_id, sender_role:data.from_role, message:data.message, timestamp:data.timestamp }]);
            setSkipMessages(prev => prev + 1);
            break;
          case 'error': toast.error(data.message); break;
        }
      };

      ws.onerror = () => setConnectionStatus('error');
      ws.onclose = (event) => {
        if (event.code === 1000) return;
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000 * reconnectAttempts);
        } else {
          setConnectionStatus('disconnected');
          toast.error('Connection lost permanently.');
        }
      };
    };

    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (ws) ws.close(1000, 'Component unmounting');
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [token, appointmentId, appointment, isChatOnly, initializeLocalStream, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const vt = localStreamRef.current.getVideoTracks()[0];
      if (vt) { vt.enabled = !vt.enabled; setVideoEnabled(vt.enabled); }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const at = localStreamRef.current.getAudioTracks()[0];
      if (at) { at.enabled = !at.enabled; setAudioEnabled(at.enabled); }
    }
  };

  const endCall = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type:'leave' }));
      websocketRef.current.close();
    }
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type:'chat_message', message:newMessage }));
      setNewMessage('');
    } else { toast.error('Not connected to chat'); }
  };

  const statusInfo = statusColors[connectionStatus] || statusColors.call_ended;
  const statusText = {
    connecting:'Connecting...', reconnecting:'Reconnecting...', authenticating:'Authenticating...',
    waiting:'Waiting for participant...', connected:'Connected', disconnected:'Disconnected',
    error:'Connection Error', call_ended:'Call Ended'
  }[connectionStatus] || 'Unknown';

  if (!appointment) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'#fff', fontFamily:font }} data-testid="loading">
        Loading...
      </div>
    );
  }

  // ── Chat Panel (shared between chat-only and video+chat) ──
  const ChatPanel = ({ fullHeight }) => (
    <div style={{ display:'flex', flexDirection:'column', height:fullHeight ? '100%' : isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 140px)', background:'#fff', borderRadius:16, overflow:'hidden' }}
      data-testid={isChatOnly ? 'chat-only-area' : 'chat-area'}>
      {isChatOnly && (
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f3f4f6' }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#1e293b', margin:0, fontFamily:font }} data-testid="chat-only-title">Chat Consultation</h2>
          <p style={{ fontSize:12, color:'#6b7280', marginTop:4, fontFamily:mono }}>
            {remoteUser ? `Connected with ${remoteUser.role === 'doctor' ? 'Doctor' : 'Patient'}` : 'Waiting for participant...'}
          </p>
        </div>
      )}
      {!isChatOnly && (
        <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #f3f4f6' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }} data-testid="chat-title">Chat</h3>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'0.75rem', display:'flex', flexDirection:'column', gap:8 }} data-testid="messages-container">
        {hasMoreMessages && (
          <button onClick={fetchMoreMessages} disabled={isLoadingMore}
            style={{ alignSelf:'center', background:'none', border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 12px', fontSize:11, color:'#6b7280', cursor:'pointer', fontFamily:mono, marginBottom:4 }}>
            {isLoadingMore ? 'Loading...' : 'Load previous messages'}
          </button>
        )}
        {messages.length === 0 && !hasMoreMessages ? (
          <p style={{ textAlign:'center', color:'#9ca3af', fontSize:13, padding:'2rem 0', margin:'auto 0', fontFamily:mono }}>
            {isChatOnly ? 'No messages yet. Start the conversation!' : 'No messages yet'}
          </p>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || index} data-testid={`message-${index}`}
              style={{ display:'flex', justifyContent:msg.sender_id === user?.id ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth:'80%', borderRadius:14, padding:'8px 12px',
                background: msg.sender_id === user?.id ? '#4f46e5' : '#f1f5f9',
                color: msg.sender_id === user?.id ? '#fff' : '#1e293b',
              }}>
                <p style={{ fontSize:10, fontWeight:600, marginBottom:3, opacity:0.75, fontFamily:mono }}>
                  {msg.sender_role === 'doctor' ? 'Doctor' : 'Patient'}
                </p>
                <p style={{ fontSize:13, margin:0, lineHeight:1.5 }}>{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage}
        style={{ display:'flex', gap:8, padding:'0.75rem', borderTop:'1px solid #f3f4f6' }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={connectionStatus === 'connecting' || connectionStatus === 'error'}
          data-testid="message-input"
          style={{ flex:1, padding:'10px 14px', border:'1px solid #e5e7eb', borderRadius:999, fontSize:13, outline:'none', fontFamily:font, background:'#f9fafb' }}
        />
        <button type="submit" disabled={!newMessage.trim() || connectionStatus === 'connecting' || connectionStatus === 'error'}
          data-testid="send-button"
          style={{ width:38, height:38, borderRadius:'50%', background:'#4f46e5', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, opacity:!newMessage.trim()?0.5:1 }}>
          <Send size={16} color="#fff" />
        </button>
      </form>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', fontFamily:font }} data-testid="consultation-room">
      {/* Header */}
      <header style={{ background:'#1e293b', borderBottom:'1px solid #334155', padding:'0 0.875rem' }}>
        <div style={{ height:isMobile?'auto':56, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:isMobile?'wrap':'nowrap', padding:isMobile?'8px 0':'0', gap:isMobile?6:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
            <button onClick={endCall} data-testid="back-button"
              style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #475569', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8', flexShrink:0 }}>
              <ArrowLeft size={15} />
            </button>
            <h1 style={{ fontSize:isMobile?13:16, fontWeight:700, color:'#f1f5f9', margin:0, whiteSpace:'nowrap' }} data-testid="consultation-title">
              {isChatOnly ? 'Chat Consultation' : 'Video Consultation'}
            </h1>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, background:statusInfo.bg, color:statusInfo.text, fontFamily:mono, whiteSpace:'nowrap', flexShrink:0 }}>
              {isMobile ? statusText.replace('participant...','...') : statusText}
            </span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            {isMobile && !isChatOnly && (
              <button onClick={() => setShowChat(s => !s)}
                style={{ padding:'5px 10px', borderRadius:999, border:'1px solid #475569', background:showChat?'#4f46e5':'transparent', color:'#fff', fontSize:10, fontFamily:mono, cursor:'pointer', whiteSpace:'nowrap' }}>
                {showChat ? '📹' : '💬'}
              </button>
            )}
            {!isChatOnly && (
              <>
                <button onClick={toggleVideo} data-testid="video-toggle-button"
                  style={{ width:32, height:32, borderRadius:'50%', border:'none', background:videoEnabled?'#4f46e5':'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                  {videoEnabled ? <Video size={14} color="#fff" /> : <VideoOff size={14} color="#fff" />}
                </button>
                <button onClick={toggleAudio} data-testid="audio-toggle-button"
                  style={{ width:32, height:32, borderRadius:'50%', border:'none', background:audioEnabled?'#4f46e5':'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                  {audioEnabled ? <Mic size={14} color="#fff" /> : <MicOff size={14} color="#fff" />}
                </button>
              </>
            )}
            <button onClick={endCall} data-testid="end-call-button"
              style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <PhoneOff size={14} color="#fff" />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{ padding:isMobile?'0.75rem 0.875rem':'1.25rem', boxSizing:'border-box', width:'100%' }}>
        {isChatOnly ? (
          <div style={{ maxWidth:720, margin:'0 auto', height:'calc(100vh - 130px)' }}>
            <ChatPanel fullHeight />
          </div>
        ) : isMobile ? (
          showChat ? (
            <div style={{ height:'calc(100vh - 130px)' }}>
              <ChatPanel fullHeight />
            </div>
          ) : (
            <div>
              {/* Remote video */}
              <div style={{ background:'#1e293b', borderRadius:12, overflow:'hidden', aspectRatio:'16/9', width:'100%', marginBottom:10, position:'relative' }} data-testid="remote-video-area">
                {remoteUser && connectionStatus === 'connected' ? (
                  <video ref={remoteVideoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} data-testid="remote-video" />
                ) : (
                  <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', textAlign:'center', padding:'1rem' }}>
                    {connectionStatus === 'error' ? (
                      <div>
                        <PhoneOff size={36} color="#ef4444" style={{ margin:'0 auto 8px' }} />
                        <p style={{ color:'#fca5a5', fontSize:13, marginBottom:8 }}>Connection Error</p>
                        <button onClick={() => window.location.reload()} style={{ padding:'6px 14px', background:'#334155', border:'none', borderRadius:999, color:'#fff', fontSize:12, cursor:'pointer' }}>Reload</button>
                      </div>
                    ) : (
                      <div style={{ opacity:0.7 }}>
                        <User size={36} style={{ margin:'0 auto 8px' }} />
                        <p style={{ fontSize:13 }}>Waiting for {user?.role === 'doctor' ? 'patient' : 'doctor'} to join...</p>
                      </div>
                    )}
                  </div>
                )}
                {remoteUser && (
                  <div style={{ position:'absolute', bottom:10, left:10, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'3px 9px', borderRadius:999, fontSize:11, fontFamily:mono }}>
                    {remoteUser.role === 'doctor' ? 'Doctor' : 'Patient'}
                  </div>
                )}
                {/* Local video — PiP inside remote video box */}
                <div style={{ position:'absolute', top:10, right:10, width:90, height:68, borderRadius:8, overflow:'hidden', border:'2px solid #475569', background:'#0f172a', zIndex:10 }} data-testid="local-video-area">
                  <video ref={localVideoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }} data-testid="local-video" />
                  {cameraError && (
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'#94a3b8' }}>
                      <User size={16} />
                    </div>
                  )}
                  <div style={{ position:'absolute', bottom:3, left:5, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'1px 6px', borderRadius:999, fontSize:9, fontFamily:mono }}>
                    You
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          // Desktop — video left, chat right
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1rem', height:'calc(100vh - 90px)' }}>
            {/* Video */}
            <div>
              <div style={{ background:'#1e293b', borderRadius:16, overflow:'hidden', aspectRatio:'16/9', width:'100%', position:'relative', marginBottom:'0.75rem' }} data-testid="remote-video-area">
                {remoteUser && connectionStatus === 'connected' ? (
                  <video ref={remoteVideoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} data-testid="remote-video" />
                ) : (
                  <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', textAlign:'center', padding:'2rem' }}>
                    {connectionStatus === 'error' ? (
                      <div>
                        <PhoneOff size={56} color="#ef4444" style={{ margin:'0 auto 12px' }} />
                        <p style={{ color:'#fca5a5', fontSize:16, marginBottom:8 }}>Connection Error</p>
                        <p style={{ color:'#94a3b8', fontSize:13, marginBottom:16 }}>Could not establish secure WebRTC layer.</p>
                        <button onClick={() => window.location.reload()} style={{ padding:'8px 20px', background:'#334155', border:'none', borderRadius:999, color:'#fff', fontSize:13, cursor:'pointer' }}>Reload Consultation</button>
                      </div>
                    ) : connectionStatus === 'reconnecting' ? (
                      <div>
                        <div style={{ width:48, height:48, border:'3px solid #ea580c', borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto 12px', animation:'spin 1s linear infinite' }} />
                        <p style={{ color:'#fdba74', fontSize:15 }}>Reconnecting...</p>
                      </div>
                    ) : (
                      <div style={{ opacity:0.6 }}>
                        <User size={56} style={{ margin:'0 auto 12px' }} />
                        <p style={{ fontSize:15 }}>Waiting for {user?.role === 'doctor' ? 'patient' : 'doctor'} to join...</p>
                      </div>
                    )}
                  </div>
                )}
                {remoteUser && (
                  <div style={{ position:'absolute', bottom:16, left:16, background:'rgba(0,0,0,0.5)', color:'#fff', padding:'4px 12px', borderRadius:999, fontSize:13, fontFamily:mono }}>
                    {remoteUser.role === 'doctor' ? 'Doctor' : 'Patient'}
                  </div>
                )}
                {/* Local PiP */}
                <div style={{ position:'absolute', bottom:16, right:16, width:200, height:130, borderRadius:12, overflow:'hidden', border:'2px solid #475569', background:'#0f172a' }} data-testid="local-video-area">
                  <video ref={localVideoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }} data-testid="local-video" />
                  {cameraError && (
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', flexDirection:'column', color:'#94a3b8' }}>
                      <User size={28} />
                      <p style={{ fontSize:11, marginTop:4, fontFamily:mono }}>No camera</p>
                    </div>
                  )}
                  <div style={{ position:'absolute', bottom:6, left:8, background:'rgba(0,0,0,0.5)', color:'#fff', padding:'2px 8px', borderRadius:999, fontSize:11, fontFamily:mono }}>
                    You ({user?.role === 'doctor' ? 'Doctor' : 'Patient'})
                  </div>
                </div>
              </div>
            </div>

            {/* Chat */}
            <ChatPanel />
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}