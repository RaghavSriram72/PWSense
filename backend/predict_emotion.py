import os
import numpy as np
import librosa
import tensorflow as tf

# Model outputs 10 classes (indices 0-9).
EMOTIONS = {
    0: "neutral",
    1: "calm",
    2: "happy",
    3: "sad",
    4: "angry",
    5: "fearful",
    6: "disgust",
    7: "surprised",
    8: "other",
    9: "other",
}

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "Emotion_Voice_Detection_Model.h5")


def extract_mfcc(wav_path):
    X, sample_rate = librosa.load(wav_path, sr=16000, mono=True)
    max_len = int(3.5 * sample_rate)
    if len(X) > max_len:
        X = X[:max_len]  
    elif len(X) < max_len:
        X = np.pad(X, (0, max_len - len(X)), mode="constant")
    mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
    return mfccs.reshape(1, 40, 1)  # (batch, timesteps, channels)




def predict_emotion(wav_path, model):
    features = extract_mfcc(wav_path)
    probs = model.predict(features, verbose=0)[0]
    predicted_index = int(np.argmax(probs))
    max_prob = float(probs[predicted_index])
    # If model is very uncertain (max prob < 0.3), default to neutral
    if max_prob < 0.3:
        emotion = "neutral"
    else:
        emotion = EMOTIONS.get(predicted_index, f"unknown({predicted_index})")
    return emotion, probs


if __name__ == "__main__":
    import glob

    test_files = glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_audio", "*.wav"))
    if not test_files:
        print("No .wav files found in test_data/")
        raise SystemExit(1)

    print(f"Loading model from {MODEL_PATH}")
    model = tf.keras.models.load_model(MODEL_PATH)

    for wav_path in test_files:
        emotion, probs = predict_emotion(wav_path, model)
        print(f"\nFile: {os.path.basename(wav_path)}")
        print(f"Predicted emotion: {emotion}")
        print("Probabilities:")
        for i, p in enumerate(probs):
            marker = " <--" if i == np.argmax(probs) else ""
            label = EMOTIONS.get(i, f"class_{i}")
            print(f"  {label:10s}: {p:.4f}{marker}")