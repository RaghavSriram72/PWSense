import os
from moviepy import VideoFileClip


def convert_mp4_to_wav(input_path, output_path):
    """
    Convert an MP4 file to WAV by extracting the audio track.
    Raises ValueError if the file has no audio track.
    """
    clip = VideoFileClip(input_path)
    if clip.audio is None:
        clip.close()
        raise ValueError("No audio track in video")
    clip.audio.write_audiofile(output_path)
    clip.close()


if __name__ == "__main__":
    # Make sure output folder exists
    os.makedirs("./test_audio", exist_ok=True)

    # Loop into the filesystem
    for root, dirs, files in os.walk("./test_audio", topdown=False):
        for name in files:
            if name.endswith(".mp4"):
                input_path = os.path.join(root, name)
                output_path = os.path.join(root, name[:-4] + ".wav")
                try:
                    convert_mp4_to_wav(input_path, output_path)
                    print(f"Converted: {name}")
                except Exception as e:
                    print(f"Skipped {name}: {e}")