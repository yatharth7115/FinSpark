let recognitionInstance = null;
let synth = window.speechSynthesis;

export const isSpeechRecognitionSupported = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return !!SpeechRecognition;
};

export const startListening = (langCode, onResult, onEnd, onError) => {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition not supported in your browser');
    return false;
  }

  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = langCode;

    recognitionInstance.onstart = () => {
      // Recognition started
    };

    recognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    recognitionInstance.onerror = (event) => {
      const errorMessage = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Ensure that it is connected.',
        'network': 'Network error occurred.',
      }[event.error] || `Error: ${event.error}`;
      onError(errorMessage);
    };

    recognitionInstance.onend = () => {
      onEnd();
    };

    recognitionInstance.start();
    return true;
  } catch (error) {
    onError(`Error: ${error.message}`);
    return false;
  }
};

export const stopListening = () => {
  if (recognitionInstance) {
    recognitionInstance.stop();
    recognitionInstance = null;
  }
};

export const speak = (text, langCode, onEnd) => {
  if (synth.speaking) {
    synth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onend = () => {
    onEnd && onEnd();
  };

  utterance.onerror = (event) => {
    console.error('TTS Error:', event.error);
    onEnd && onEnd();
  };

  synth.speak(utterance);
};

export const stopSpeaking = () => {
  if (synth.speaking) {
    synth.cancel();
  }
};
