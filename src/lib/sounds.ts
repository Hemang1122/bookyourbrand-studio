'use client';

const isSoundsEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('soundsEnabled') !== 'false';
};

const playSound = (soundFile: string) => {
  if (!isSoundsEnabled()) return false;
  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.3;
    audio.play().catch(err => {
      // This error is expected if the file doesn't exist.
      // We return false to trigger the fallback.
      return false;
    });
    return true; // Assume it will play if the constructor doesn't throw
  } catch (err) {
    console.log('Sound error:', err);
    return false;
  }
};

// Fallback: generate beep if audio files not available
const playBeep = (frequency: number, duration: number) => {
  if (!isSoundsEnabled()) return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.005, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (err) {
    console.log('Beep generation failed:', err);
  }
};

export const sounds = {
  messageSent: () => {
    if (!playSound('/sounds/message-sent.mp3')) {
      playBeep(800, 0.05);
    }
  },
  messageReceived: () => {
    if (!playSound('/sounds/message-received.mp3')) {
      playBeep(600, 0.1);
    }
  },
  notification: () => {
    if (!playSound('/sounds/notification.mp3')) {
      playBeep(1000, 0.15);
    }
  }
};
