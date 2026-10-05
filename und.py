import edge_tts
import asyncio
import os

VOICE_ID = "id-ID-GadisNeural"

async def generate_speech(text: str, output_path: str):
    """
    Mengonversi teks menjadi file audio MP3 menggunakan Edge-TTS
    """
    communicate = edge_tts.Communicate(text, VOICE_ID)
    await communicate.save(output_path)
    return output_path

# Contoh Pengujian Asinkron
if __name__ == "__main__":
    test_text = "Halo! Aku Firefly. Ada yang bisa aku bantu hari ini?"
    asyncio.run(generate_speech(test_text, "output_test.mp3"))
