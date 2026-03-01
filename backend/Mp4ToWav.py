import os
from moviepy import VideoFileClip

# Make sure output folder exists
os.makedirs("./test_audio", exist_ok=True)

# Loop into the filesystem
for root, dirs, files in os.walk("./test_audio", topdown=False):
    # Loop through files
    for name in files:
        # Consider only mp4
        if name.endswith('.mp4'):
            input_path = os.path.join(root, name)
            output_path = os.path.join(root, name[:-4] + ".wav")
            
            # Convert mp4 to wav
            try:
                clip = VideoFileClip(input_path)
                if clip.audio is None:
                    print(f"Skipped {name}: no audio track")
                    clip.close()
                    continue
                clip.audio.write_audiofile(output_path)
                clip.close()
                print(f"Converted: {name}")
                
            # Skip the file in case of error
            except Exception as e:
                print(f"Skipped {name}: {e}")
                continue