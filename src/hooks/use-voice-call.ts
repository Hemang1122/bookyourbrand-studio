import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useFirebaseServices } from '@/firebase';

export function useVoiceCall(chatId: string | null, currentUserId: string) {
  const [isInCall, setIsInCall] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  
  const { firestore } = useFirebaseServices();
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callDocRef = useRef<string | null>(null);

  // WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = async (event) => {
      if (event.candidate && callDocRef.current && firestore) {
        const callDoc = doc(firestore, 'calls', callDocRef.current);
        // Store candidate using user-specific key
        await updateDoc(callDoc, {
          [`candidates_${currentUserId}`]: arrayUnion(event.candidate.toJSON())
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (!remoteAudioRef.current) {
          remoteAudioRef.current = new Audio();
          remoteAudioRef.current.autoplay = true;
        }
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  // Start outgoing call
  const startCall = async (recipientId: string) => {
    if (!firestore || !chatId) return;

    try {
      setCallStatus('calling');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Save call to Firestore with serialized offer
      const callDoc = await addDoc(collection(firestore, 'calls'), {
        chatId,
        callerId: currentUserId,
        recipientId,
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        status: 'ringing',
        timestamp: new Date(),
        [`candidates_${currentUserId}`]: [],
        [`candidates_${recipientId}`]: []
      });

      callDocRef.current = callDoc.id;
      setIsInCall(true);
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Microphone access denied or error starting call');
      endCall();
    }
  };

  // Answer incoming call
  const answerCall = async (callId: string) => {
    if (!firestore) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const callDoc = doc(firestore, 'calls', callId);
      const callData = incomingCall;

      if (callData?.offer) {
        // Explicitly reconstruct offer
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: callData.offer.type,
          sdp: callData.offer.sdp
        }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Save serialized answer
        await updateDoc(callDoc, {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          },
          status: 'connected'
        });
      }

      callDocRef.current = callId;
      setIsInCall(true);
      setIsRinging(false);
      setCallStatus('connected');
    } catch (error) {
      console.error('Failed to answer call:', error);
      alert('Failed to answer call');
      rejectCall(callId);
    }
  };

  // Reject incoming call
  const rejectCall = async (callId: string) => {
    if (!firestore) return;
    
    const callDoc = doc(firestore, 'calls', callId);
    await updateDoc(callDoc, { status: 'rejected' });
    
    setIsRinging(false);
    setIncomingCall(null);
    setCallStatus('idle');
  };

  // End call
  const endCall = async () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Update call status in Firestore
    if (callDocRef.current && firestore) {
      const callDoc = doc(firestore, 'calls', callDocRef.current);
      await updateDoc(callDoc, { status: 'ended' });
      callDocRef.current = null;
    }

    setIsInCall(false);
    setCallStatus('idle');
  };

  // Listen for incoming calls and call status
  useEffect(() => {
    if (!firestore || !chatId) return;

    const callsRef = collection(firestore, 'calls');
    const unsubscribe = onSnapshot(callsRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const callData = { id: change.doc.id, ...change.doc.data() as any };

        // Incoming call
        if (
          change.type === 'added' &&
          callData.recipientId === currentUserId &&
          callData.status === 'ringing' &&
          !isInCall
        ) {
          setIncomingCall(callData);
          setIsRinging(true);
          setCallStatus('ringing');
        }

        // Call answered
        if (
          change.type === 'modified' &&
          callData.id === callDocRef.current &&
          callData.status === 'connected' &&
          callData.answer &&
          peerConnectionRef.current &&
          !peerConnectionRef.current.remoteDescription
        ) {
          // Explicitly reconstruct answer
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription({
              type: callData.answer.type,
              sdp: callData.answer.sdp
            })
          );
          setCallStatus('connected');
        }

        // Handle remote ICE candidates
        if (change.type === 'modified' && callData.id === callDocRef.current && peerConnectionRef.current) {
          const remoteId = callData.callerId === currentUserId ? callData.recipientId : callData.callerId;
          const remoteCandidates = callData[`candidates_${remoteId}`] || [];
          
          remoteCandidates.forEach(async (candidateData: any) => {
            try {
              await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidateData));
            } catch (e) {
              console.error('Error adding received ice candidate', e);
            }
          });
        }

        // Call ended or rejected
        if (
          change.type === 'modified' &&
          (callData.status === 'ended' || callData.status === 'rejected') &&
          (callData.id === callDocRef.current || (callData.recipientId === currentUserId && isRinging))
        ) {
          endCall();
          setIsRinging(false);
          setIncomingCall(null);
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, chatId, currentUserId, isInCall, isRinging]);

  return {
    isInCall,
    isRinging,
    incomingCall,
    callStatus,
    startCall,
    answerCall,
    rejectCall,
    endCall
  };
}