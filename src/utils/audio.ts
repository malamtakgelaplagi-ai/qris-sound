import { VoiceCharacter, VoiceCharacterId } from '../types';

export const VOICE_CHARACTERS: Record<VoiceCharacterId, VoiceCharacter> = {
  laras: {
    id: 'laras',
    name: 'Kak Laras',
    tagline: 'Ramah & Standar',
    avatar: '👩‍💼',
    pitch: 1.0,
    rate: 0.95,
    description: 'Suara wanita jernih, intonasi formal bersahabat, cocok untuk ritel & cafe.',
    samplePhrase: 'QRIS sukses diterima, sebesar, lima puluh ribu rupiah.',
  },
  amoy: {
    id: 'amoy',
    name: 'Ci Amoy',
    tagline: 'Ceria & Cepat',
    avatar: '👧',
    pitch: 1.4,
    rate: 1.1,
    description: 'Nada tinggi energetik dengan tempo lincah, khas kasir toko kelontong & boba.',
    samplePhrase: 'QRIS sukses diterima, sebesar, dua puluh lima ribu rupiah.',
  },
  slamet: {
    id: 'slamet',
    name: 'Pakde Slamet',
    tagline: 'Mantap & Berat',
    avatar: '🧔',
    pitch: 0.7,
    rate: 0.85,
    description: 'Vokal bass tebal dan tempo santai berwibawa, cocok untuk rumah makan & bengkel.',
    samplePhrase: 'QRIS sukses diterima, sebesar, seratus ribu rupiah.',
  },
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a two-tone chime sound (Ding-Dong) similar to GoPay/ShopeePay soundbox
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      const now = ctx.currentTime;
      // Tone 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Tone 2: 1320Hz (E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.38);

      setTimeout(() => {
        resolve();
      }, 350);
    } catch {
      resolve();
    }
  });
}

/**
 * Speak text with character settings and optional chime
 */
export async function speakAnnouncement(
  text: string,
  characterId: VoiceCharacterId = 'laras',
  options: {
    playChimeFirst?: boolean;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
): Promise<void> {
  const { playChimeFirst = true, volume = 1.0, onStart, onEnd } = options;

  if (playChimeFirst) {
    await playChime();
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this device/browser');
    onEnd?.();
    return;
  }

  try {
    // Cancel any active utterance to prevent queue pile-up
    window.speechSynthesis.cancel();

    const charConfig = VOICE_CHARACTERS[characterId] || VOICE_CHARACTERS.laras;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'id-ID';
    utterance.pitch = charConfig.pitch;
    utterance.rate = charConfig.rate;
    utterance.volume = Math.max(0.1, Math.min(1.0, volume));

    // Try finding an Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(
      (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis event error:', e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Failed to run speech synthesis:', err);
    onEnd?.();
  }
}

/**
 * Format IDR currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate natural Indonesian speech phrase for transaction amount
 * Menggunakan angka nominal murni agar Text-to-Speech browser membaca 'dua puluh lima ribu'
 * bukan 'dua puluh lima titik nol nol nol'
 */
export function getSpokenPhrase(nominal: number): string {
  return `QRIS sukses diterima, sebesar, ${nominal}, rupiah.`;
}
