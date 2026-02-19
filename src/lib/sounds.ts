'use client';

const isSoundsEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('soundsEnabled') !== 'false';
};

const playBeep = (frequency: number, duration: number) => {
  if (!isSoundsEnabled()) return;
  try {
    const audioContext = new (window.AudioContext || 
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01, 
      audioContext.currentTime + duration
    );
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (err) {
    console.log('Beep failed:', err);
  }
};

export const sounds = {
  messageSent: () => playBeep(900, 0.08),
  messageReceived: () => playBeep(600, 0.12),
  notification: () => playBeep(1200, 0.2)
};
