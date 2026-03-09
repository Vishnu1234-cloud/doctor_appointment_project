import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Video, VideoOff, Mic, MicOff, PhoneOff, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// WebSocket URL - use /api/ prefix for ingress compatibility
const WS_URL = String(BACKEND_URL).replace('https://', 'wss://').replace('http://', 'ws://');

// Default ICE servers for STUN
const DEFAULT_ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
};

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [remoteUser, setRemoteUser] = useState(null);
  const [isChatOnly, setIsChatOnly] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Pagination State
  const [skipMessages, setSkipMessages] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const websocketRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);
  const reconnectTimeoutRef = useRef(null);

  // Fetch appointment details and chat history
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await axios.get(`${API}/appointments/${appointmentId}`);
        const apt = response.data;
        setAppointment(apt);

        // Check if this is chat-only mode
        if (apt.consultation_type === 'chat') {
          setIsChatOnly(true);
          console.log('Chat-only mode enabled');
        }

        // Fetch existing chat messages (first page)
        try {
          const limit = 50;
          const messagesResponse = await axios.get(`${API}/chat/messages/${appointmentId}?limit=${limit}&skip=0`);
          if (messagesResponse.data && messagesResponse.data.length > 0) {
            setMessages(messagesResponse.data.map(msg => ({
              id: msg.id,
              sender_id: msg.sender_id,
              sender_role: msg.sender_role,
              message: msg.message,
              timestamp: msg.timestamp
            })));
            setSkipMessages(messagesResponse.data.length);
            if (messagesResponse.data.length < limit) setHasMoreMessages(false);
          } else {
            setHasMoreMessages(false);
          }
        } catch (msgError) {
          console.log('No previous messages or error fetching:', msgError.message);
        }
      } catch (error) {
        toast.error('Failed to fetch appointment');
        navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId, navigate, user]);

  const fetchMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    setIsLoadingMore(true);
    try {
      const limit = 50;
      const response = await axios.get(`${API}/chat/messages/${appointmentId}?limit=${limit}&skip=${skipMessages}`);
      if (response.data && response.data.length > 0) {
        setMessages(prev => [
          ...response.data.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            sender_role: msg.sender_role,
            message: msg.message,
            timestamp: msg.timestamp
          })),
          ...prev
        ]);
        setSkipMessages(prev => prev + response.data.length);
        if (response.data.length < limit) setHasMoreMessages(false);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      toast.error('Failed to load older messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    // Skip video initialization in chat-only mode
    if (isChatOnly) {
      console.log('Skipping video initialization - chat-only mode');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      localStreamRef.current = stream;
      setCameraError(null);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Ensure video plays
        localVideoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
      }

      toast.success('Camera and microphone connected');
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);

      // Set specific error message based on error type
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera/mic found. Please plug in a device.');
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera/Mic permission denied. Please allow site permissions.');
      } else {
        setCameraError('Camera unavailable or in use by another application.');
      }

      toast.error('Could not access camera/microphone. Continuing without them.');
      return null;
    }
  }, [isChatOnly]);

  // Create peer connection
  const createPeerConnection = useCallback((remoteUserId) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(iceServersRef.current);
    peerConnectionRef.current = pc;
    remoteUserIdRef.current = remoteUserId;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus('connected');
        toast.success('Connected to remote user');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          target_user_id: remoteUserId,
          candidate: event.candidate
        }));
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
        toast.warning('Peer disconnected, waiting to reconnect...');
      } else if (pc.connectionState === 'failed') {
        setConnectionStatus('error');
        toast.error('WebRTC Connection failed. Trying to reconnect...');
        // explicitly create a new offer to force renegotiation
        setTimeout(() => {
          if (remoteUserIdRef.current) {
            createOffer(remoteUserIdRef.current);
          }
        }, 1000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    return pc;
  }, []);

  // Create and send offer
  const createOffer = useCallback(async (targetUserId) => {
    const pc = createPeerConnection(targetUserId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'offer',
          target_user_id: targetUserId,
          offer: offer
        }));
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createPeerConnection]);

  // Handle received offer
  const handleOffer = useCallback(async (offer, fromUserId, fromRole) => {
    console.log('Received offer from:', fromUserId);
    setRemoteUser({ id: fromUserId, role: fromRole });

    const pc = createPeerConnection(fromUserId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'answer',
          target_user_id: fromUserId,
          answer: answer
        }));
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection]);

  // Handle received answer
  const handleAnswer = useCallback(async (answer) => {
    console.log('Received answer');
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }
  }, []);

  // Handle received ICE candidate
  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token || !appointmentId || !appointment) return;

    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = async () => {
      // Only initialize video if not chat-only
      if (!isChatOnly) {
        await initializeLocalStream();
      } else {
        console.log('Chat-only mode: Skipping video setup');
      }

      ws = new WebSocket(`${WS_URL}/api/ws/consultation/${appointmentId}`);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('authenticating');

        // Send authentication
        ws.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WS message:', data.type);

        switch (data.type) {
          case 'auth_success':
            if (data.ice_servers && data.ice_servers.length > 0) {
              iceServersRef.current = { iceServers: data.ice_servers };
            }
            // Reset reconnect attempts
            reconnectAttempts = 0;
            setConnectionStatus('waiting');
            toast.success('Connected to consultation room');

            // If other users are already in the room and NOT chat-only, initiate call
            if (data.room_users && data.room_users.length > 0 && !isChatOnly) {
              const otherUser = data.room_users[0];
              setRemoteUser({ id: otherUser.user_id, role: otherUser.role });
              // Initiator creates the offer
              createOffer(otherUser.user_id);
            } else if (data.room_users && data.room_users.length > 0) {
              // Chat-only: just set remote user
              const otherUser = data.room_users[0];
              setRemoteUser({ id: otherUser.user_id, role: otherUser.role });
              setConnectionStatus('connected');
            }
            break;

          case 'user_joined':
            toast.info(`${data.user_role === 'doctor' ? 'Doctor' : 'Patient'} joined the consultation`);
            setRemoteUser({ id: data.user_id, role: data.user_role });
            // New user joined, create offer if NOT chat-only and we haven't already
            if (!peerConnectionRef.current && !isChatOnly) {
              createOffer(data.user_id);
            } else if (isChatOnly) {
              setConnectionStatus('connected');
            }
            break;

          case 'user_left':
            toast.warning(`${data.user_role === 'doctor' ? 'Doctor' : 'Patient'} left the consultation`);
            setRemoteUser(null);
            setConnectionStatus('waiting');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
              peerConnectionRef.current = null;
            }
            break;

          case 'offer':
            if (!isChatOnly) {
              handleOffer(data.offer, data.from_user_id, data.from_role);
            }
            break;

          case 'answer':
            if (!isChatOnly) {
              handleAnswer(data.answer);
            }
            break;

          case 'ice_candidate':
            if (!isChatOnly) {
              handleIceCandidate(data.candidate);
            }
            break;

          case 'chat_message':
            // Add new message and increment skip token locally
            setMessages(prev => [...prev, {
              id: data.id || Date.now(),
              sender_id: data.from_user_id,
              sender_role: data.from_role,
              message: data.message,
              timestamp: data.timestamp
            }]);
            setSkipMessages(prev => prev + 1);
            break;

          case 'chat_message_ack':
            console.log(`Message successfully delivered (Server ID: ${data.msgId})`);
            break;

          case 'error':
            toast.error(data.message);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed code:', event.code);
        if (event.code === 1000) return; // Normal closure (e.g., leave button)

        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000 * reconnectAttempts);
        } else {
          setConnectionStatus('disconnected');
          toast.error('Signaling connection lost permanently.');
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        // Normal closure (1000)
        ws.close(1000, "Component unmounting");
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [token, appointmentId, appointment, isChatOnly, initializeLocalStream, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'leave' }));
      websocketRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    navigate(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: newMessage
      }));
      setNewMessage('');
    } else {
      toast.error('Not connected to chat');
    }
  };

  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { text: 'Connecting...', color: 'bg-yellow-500' };
      case 'reconnecting':
        return { text: 'Reconnecting...', color: 'bg-orange-500' };
      case 'authenticating':
        return { text: 'Authenticating...', color: 'bg-yellow-500' };
      case 'waiting':
        return { text: 'Waiting for other participant...', color: 'bg-blue-500' };
      case 'connected':
        return { text: 'Connected', color: 'bg-green-500' };
      case 'disconnected':
        return { text: 'Disconnected', color: 'bg-red-500' };
      case 'error':
        return { text: 'Connection Error', color: 'bg-red-500' };
      case 'call_ended':
        return { text: 'Call Ended', color: 'bg-gray-500' };
      default:
        return { text: 'Unknown', color: 'bg-gray-500' };
    }
  };

  const status = getStatusDisplay();

  if (!appointment) {
    return <div className="min-h-screen flex items-center justify-center" data-testid="loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900" data-testid="consultation-room">
      <header className="bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={endCall}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-slate-700"
                data-testid="back-button"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-xl font-serif font-bold text-white" data-testid="consultation-title">
                {isChatOnly ? 'Chat Consultation' : 'Video Consultation'}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs text-white ${status.color}`}>
                {status.text}
              </span>
            </div>
            <div className="flex gap-2">
              {!isChatOnly && (
                <>
                  <Button
                    variant={videoEnabled ? 'default' : 'destructive'}
                    size="sm"
                    onClick={toggleVideo}
                    className="rounded-full"
                    data-testid="video-toggle-button"
                  >
                    {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                  </Button>
                  <Button
                    variant={audioEnabled ? 'default' : 'destructive'}
                    size="sm"
                    onClick={toggleAudio}
                    className="rounded-full"
                    data-testid="audio-toggle-button"
                  >
                    {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={endCall}
                className="rounded-full"
                data-testid="end-call-button"
              >
                <PhoneOff size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isChatOnly ? (
          // Chat-only mode: Full-width chat
          <Card className="rounded-2xl border-none shadow-lg bg-white max-w-4xl mx-auto h-[calc(100vh-180px)]" data-testid="chat-only-area">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="mb-4">
                <h2 className="text-2xl font-serif font-bold mb-2" data-testid="chat-only-title">Chat Consultation</h2>
                <p className="text-sm text-muted-foreground">
                  {remoteUser ? `Connected with ${remoteUser.role === 'doctor' ? 'Doctor' : 'Patient'}` : 'Waiting for other participant...'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-3 border rounded-xl p-4 bg-slate-50 flex flex-col" data-testid="messages-container">
                {hasMoreMessages && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchMoreMessages}
                    disabled={isLoadingMore}
                    className="self-center mb-2 text-xs opacity-70"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load previous messages'}
                  </Button>
                )}
                {messages.length === 0 && !hasMoreMessages ? (
                  <p className="text-center text-muted-foreground text-sm py-8 my-auto">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${index}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.sender_id === user?.id
                          ? 'bg-primary text-white'
                          : 'bg-white border text-foreground'
                          }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {msg.sender_role === 'doctor' ? 'Doctor' : 'Patient'}
                        </p>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="rounded-full h-12"
                  disabled={connectionStatus === 'connecting' || connectionStatus === 'error'}
                  data-testid="message-input"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full px-6"
                  disabled={connectionStatus === 'connecting' || connectionStatus === 'error' || !newMessage.trim()}
                  data-testid="send-button"
                >
                  <Send size={20} />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          // Video mode: Video + Chat side by side
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Video Area */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Remote Video (Main) */}
                <Card className="col-span-2 rounded-2xl border-none shadow-lg overflow-hidden bg-slate-800" data-testid="remote-video-area">
                  <CardContent className="p-0 relative aspect-video">
                    {remoteUser && connectionStatus === 'connected' ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        data-testid="remote-video"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <div className="text-center text-white p-4 max-w-sm mx-auto">
                          {connectionStatus === 'disconnected' ? (
                            <>
                              <PhoneOff size={64} className="mx-auto mb-4 opacity-50 text-red-400" />
                              <p className="text-lg opacity-90 text-red-200 mb-2">Peer Disconnected</p>
                              <p className="text-sm opacity-70">The other user lost connection or left the call.</p>
                            </>
                          ) : connectionStatus === 'reconnecting' ? (
                            <>
                              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
                              <p className="text-lg opacity-90 text-orange-400 mb-2">Reconnecting...</p>
                              <p className="text-sm opacity-70">Attempting to restore the video connection.</p>
                            </>
                          ) : connectionStatus === 'error' ? (
                            <>
                              <PhoneOff size={64} className="mx-auto mb-4 opacity-50 text-red-500" />
                              <p className="text-lg font-semibold text-red-500 mb-2">Connection Error</p>
                              <p className="text-sm opacity-80 mb-4 text-slate-300">Could not establish secure WebRTC layer.</p>
                              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-slate-200 bg-slate-700 hover:bg-slate-600 border-none">Reload Consultation</Button>
                            </>
                          ) : (
                            <>
                              <div className="animate-pulse">
                                <User size={64} className="mx-auto mb-4 opacity-50" />
                                <p className="text-lg opacity-75">Waiting for {user?.role === 'doctor' ? 'patient' : 'doctor'} to join...</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {remoteUser && (
                      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {remoteUser.role === 'doctor' ? 'Doctor' : 'Patient'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Local Video (Picture-in-picture) */}
                <Card className="absolute bottom-24 right-8 w-64 rounded-2xl border-none shadow-lg overflow-hidden" data-testid="local-video-area">
                  <CardContent className="p-0 relative aspect-video bg-slate-900">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                      data-testid="local-video"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs">
                      You ({user?.role === 'doctor' ? 'Doctor' : 'Patient'})
                    </div>
                    {!videoEnabled && !cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                        <div className="text-center">
                          <VideoOff size={32} className="mx-auto mb-1" />
                          <p className="text-xs">Camera off</p>
                        </div>
                      </div>
                    )}
                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                        <div className="text-center">
                          <User size={32} className="mx-auto mb-1 opacity-50" />
                          <p className="text-xs">{cameraError}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-1">
              <Card className="rounded-2xl border-none shadow-lg bg-white h-[calc(100vh-180px)]" data-testid="chat-area">
                <CardContent className="p-4 h-full flex flex-col">
                  <h3 className="text-lg font-serif font-bold mb-4" data-testid="chat-title">Chat</h3>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 flex flex-col" data-testid="messages-container">
                    {hasMoreMessages && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchMoreMessages}
                        disabled={isLoadingMore}
                        className="self-center mb-2 text-xs opacity-70"
                      >
                        {isLoadingMore ? 'Loading...' : 'Load previous messages'}
                      </Button>
                    )}
                    {messages.length === 0 && !hasMoreMessages ? (
                      <p className="text-center text-muted-foreground text-sm py-8 my-auto">No messages yet</p>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={msg.id || index}
                          className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${index}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 ${msg.sender_id === user?.id
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 text-foreground'
                              }`}
                          >
                            <p className="text-xs font-medium mb-1 opacity-75">
                              {msg.sender_role === 'doctor' ? 'Doctor' : 'Patient'}
                            </p>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="rounded-full text-sm"
                      data-testid="message-input"
                    />
                    <Button type="submit" size="sm" className="rounded-full px-3" disabled={!newMessage.trim()} data-testid="send-button">
                      <Send size={16} />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
