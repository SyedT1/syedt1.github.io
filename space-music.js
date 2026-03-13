// Super Mario Bros Theme Synthesizer
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
    const tempo = 0.15;

    // Classic Super Mario Bros Theme - Main Theme
    const melody = [
      // Main iconic opening: E-E-E-C-E-G
      { freq: 329.63, duration: tempo }, // E4
      { freq: 329.63, duration: tempo }, // E4
      { freq: 329.63, duration: tempo }, // E4
      { freq: 261.63, duration: tempo }, // C4
      { freq: 329.63, duration: tempo }, // E4
      { freq: 392, duration: tempo * 2 }, // G4 - held
      
      // Second part: G3-C4 continuing
      { freq: 196, duration: tempo * 2 }, // G3
      
      // Ascending section
      { freq: 261.63, duration: tempo }, // C4
      { freq: 329.63, duration: tempo }, // E4
      { freq: 392, duration: tempo }, // G4
      { freq: 523.25, duration: tempo * 2 }, // C5 - climax
      
      // Descending
      { freq: 392, duration: tempo }, // G4
      { freq: 349.23, duration: tempo }, // F4
      { freq: 329.63, duration: tempo }, // E4
      { freq: 293.66, duration: tempo }, // D4
      { freq: 261.63, duration: tempo }, // C4
      
      // Bridge section
      { freq: 329.63, duration: tempo }, // E4
      { freq: 392, duration: tempo }, // G4
      { freq: 523.25, duration: tempo }, // C5
      { freq: 587.33, duration: tempo * 2 }, // D5
      
      // Another descent
      { freq: 523.25, duration: tempo }, // C5
      { freq: 493.88, duration: tempo }, // B4
      { freq: 466.16, duration: tempo }, // A#4
      { freq: 440, duration: tempo }, // A4
      { freq: 392, duration: tempo * 2 }, // G4
    ];

    let currentTime = now;
    melody.forEach((note) => {
      // Main melody with square wave for chiptune effect
      this.playNote(note.freq, note.duration, currentTime, 'square');
      // Simple harmony an octave below
      this.playNote(note.freq * 0.5, note.duration * 0.8, currentTime, 'triangle');
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
    console.log('� Super Mario Bros! 🎵');
  }

  stop() {
    this.isPlaying = false;
    this.masterGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    console.log('🎮 Game Over!');
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
