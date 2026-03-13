// Retro Space Music Synthesizer
class RetroSpaceMusic {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
    this.oscillators = [];
    this.gains = [];
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.1;
    this.masterGain.connect(this.audioContext.destination);
  }

  playNote(frequency, duration, startTime, waveType = 'sine') {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = waveType;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.8);
    gain.gain.setValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);

    return { osc, gain };
  }

  playMelody() {
    if (!this.isPlaying) return;

    const now = this.audioContext.currentTime;
    const tempo = 0.35;

    // Lush, melodious space symphony with rich harmonies
    const melody = [
      { freq: 246.94, duration: tempo }, // B3 - opening
      { freq: 293.66, duration: tempo }, // D4
      { freq: 349.23, duration: tempo * 1.5 }, // F4 - sustained
      { freq: 392, duration: tempo }, // G4 - rise
      { freq: 440, duration: tempo }, // A4 - peak
      { freq: 493.88, duration: tempo * 2 }, // B4 - beautiful hold
      { freq: 440, duration: tempo }, // A4 - descent
      { freq: 392, duration: tempo }, // G4 
      { freq: 349.23, duration: tempo * 1.5 }, // F4
      { freq: 329.63, duration: tempo }, // E4
      { freq: 293.66, duration: tempo }, // D4
      { freq: 261.63, duration: tempo * 2 }, // C4 - resolve
      { freq: 392, duration: tempo }, // G4 - second phrase
      { freq: 440, duration: tempo }, // A4
      { freq: 493.88, duration: tempo }, // B4
      { freq: 523.25, duration: tempo * 2 }, // C5 - climax
      { freq: 493.88, duration: tempo }, // B4 - drift
      { freq: 440, duration: tempo }, // A4
      { freq: 392, duration: tempo }, // G4
      { freq: 349.23, duration: tempo * 1.5 }, // F4 - close
    ];

    let currentTime = now;
    melody.forEach((note, idx) => {
      // Main melody - rich sine wave
      this.playNote(note.freq, note.duration, currentTime, 'sine');
      
      // Lush trio harmonies
      if (idx % 3 === 0) {
        this.playNote(note.freq * 0.5, note.duration, currentTime, 'sine'); // Deep bass harmony
        this.playNote(note.freq * 1.25, note.duration * 0.9, currentTime, 'sine'); // Mid harmony
      } else if (idx % 3 === 1) {
        this.playNote(note.freq * 0.75, note.duration, currentTime, 'sine'); // Mid-low harmony
        this.playNote(note.freq * 1.5, note.duration * 0.85, currentTime, 'sine'); // High harmony
      } else {
        this.playNote(note.freq * 1.25, note.duration, currentTime, 'sine'); // Active harmony
      }
      currentTime += note.duration;
    });

    // Schedule next loop
    const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
    if (this.isPlaying) {
      setTimeout(() => this.playMelody(), totalDuration * 1000);
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.masterGain.gain.value = 0.1;
    this.playMelody();
    console.log('🎵 Melodious retro music started');
  }

  stop() {
    this.isPlaying = false;
    this.masterGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    console.log('🎵 Retro music stopped');
  }

  toggleMusic() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }
}

// Initialize music player
let spaceMusic = null;

function initSpaceMusic() {
  if (!spaceMusic) {
    spaceMusic = new RetroSpaceMusic();
    console.log('Space music synthesizer initialized');
  }
}

// Auto-init on user interaction
document.addEventListener('click', () => {
  if (!spaceMusic) initSpaceMusic();
}, { once: true });

// Also expose global function
window.toggleSpaceMusic = function() {
  if (!spaceMusic) initSpaceMusic();
  spaceMusic.toggleMusic();
};
