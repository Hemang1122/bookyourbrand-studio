'use client';

const isSoundsEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('soundsEnabled') !== 'false';
};

const playSound = (soundFile: string): boolean => {
  if (!isSoundsEnabled()) return false;
  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.5;
    audio.play().catch(err => {
      // This will log if the browser blocks autoplay or if the file isn't found.
      // We can't synchronously return false here, but the beep fallback will
      // be triggered if the Audio object itself can't be created.
      console.log(`Could not play sound ${soundFile}:`, err);
    });
    return true;
  } catch (err) {
    // This catches errors if e.g. the Audio API isn't supported.
    console.log(`Could not create audio for ${soundFile}:`, err);
    return false;
  }
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
  messageSent: () => {
    const played = playSound('/sounds/message-sent.mp3');
    if (!played) {
      playBeep(900, 0.08);
    }
  },
  messageReceived: () => {
    const played = playSound('/sounds/message-received.mp3');
    if (!played) {
      playBeep(600, 0.12);
    }
  },
  notification: () => {
    const played = playSound('/sounds/notification.mp3');
    if (!played) {
      playBeep(1200, 0.2);
    }
  }
};
