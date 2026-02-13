import os
import subprocess
import whisperx
import json
import boto3
import time
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import traceback
from openai import OpenAI

app = Flask(__name__)

# Initialize Firebase
# Make sure to place your service account JSON file in the worker directory
try:
    cred = credentials.Certificate("firebase-adminsdk.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase not initialized: {e}. Ensure firebase-adminsdk.json is present.")

# R2 Client Initialization
S3_ENDPOINT = os.getenv("R2_ENDPOINT")
S3_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("R2_SECRET_KEY")
S3_BUCKET = os.getenv("R2_BUCKET", "fp2p-content")

s3 = boto3.client('s3',
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY
)

def format_vtt_time(seconds):
    """Formats seconds into WEBVTT timestamp: HH:MM:SS.mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}".replace(',', '.')

def generate_vtt(segments, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for i, seg in enumerate(segments):
            start = format_vtt_time(seg['start'])
            end = format_vtt_time(seg['end'])
            text = seg['text'].strip()
            # Handle potential empty text
            if not text:
                continue
            f.write(f"{i+1}\n{start} --> {end}\n{text}\n\n")

def cleanup_captions(video_id, raw_vtt_path):
    """Uses LLM to clean up the transcript while keeping timestamps intact."""
    print(f"[{video_id}] Starting LLM Cleanup Phase...")
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print(f"[{video_id}] OPENAI_API_KEY missing. Skipping cleanup.")
            return raw_vtt_path

        client = OpenAI(api_key=api_key)
        
        with open(raw_vtt_path, 'r', encoding='utf-8') as f:
            vtt_content = f.read()

        prompt = f"""
        You are a professional subtitle editor. Clean up the following WebVTT content for a gaming masterclass.
        
        STRICT RULES:
        1. Keep timestamps EXACTLY the same.
        2. Do NOT merge, skip, or split blocks.
        3. Remove filler words (uh, um, you know, basically, so yeah).
        4. Fix grammar, capitalization, and punctuation.
        5. Preserve technical/gaming terms (e.g., piece control, box fight, tunneling, 90s).
        6. Return ONLY the valid WebVTT content. No explanations.
        
        VTT CONTENT:
        {vtt_content}
        """

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        cleaned_content = response.choices[0].message.content.strip()
        
        # Ensure it starts with WEBVTT
        if not cleaned_content.startswith("WEBVTT"):
            cleaned_content = "WEBVTT\n\n" + cleaned_content

        cleaned_vtt_path = f"{video_id}_en.vtt"
        with open(cleaned_vtt_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        
        return cleaned_vtt_path
    except Exception as e:
        print(f"[{video_id}] Cleanup Error: {e}")
        return raw_vtt_path

def translate_captions(video_id, en_vtt_path, lang_code, lang_name):
    """Translates the VTT content to a target language using LLM."""
    print(f"[{video_id}] Translating to {lang_name}...")
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None

        client = OpenAI(api_key=api_key)
        
        with open(en_vtt_path, 'r', encoding='utf-8') as f:
            vtt_content = f.read()

        prompt = f"""
        Translate the following WebVTT content from English to {lang_name}.
        
        STRICT RULES:
        1. Keep timestamps EXACTLY the same.
        2. Do NOT merge, skip, or split blocks.
        3. The tone should be natural and professional, suitable for a gaming masterclass.
        4. Preserve technical/gaming terms that are standard in {lang_name} or use native equivalents.
        5. Return ONLY the valid WebVTT content in {lang_name}. No explanations.
        
        VTT CONTENT:
        {vtt_content}
        """

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        translated_content = response.choices[0].message.content.strip()
        
        if not translated_content.startswith("WEBVTT"):
            translated_content = "WEBVTT\n\n" + translated_content

        translated_vtt_path = f"{video_id}_{lang_code}.vtt"
        with open(translated_vtt_path, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        
        return translated_vtt_path
    except Exception as e:
        print(f"[{video_id}] Translation Error ({lang_code}): {e}")
        return None

def upload_to_r2(video_id, vtt_paths):
    """Uploads the VTT files to R2 and returns their public keys/paths."""
    print(f"[{video_id}] Uploading VTTs to R2...")
    r2_paths = {}
    try:
        for lang, local_path in vtt_paths.items():
            key = f"captions/{video_id}/{lang}.vtt"
            s3.upload_file(
                local_path, 
                S3_BUCKET, 
                key, 
                ExtraArgs={'ContentType': 'text/vtt'}
            )
            r2_paths[lang] = key
            print(f"[{video_id}] Uploaded {lang} to {key}")
        return r2_paths
    except Exception as e:
        print(f"[{video_id}] R2 Upload Error: {e}")
        return None

@app.route('/process', methods=['POST'])
def process_video_route():
    data = request.json
    video_id = data.get('videoId')
    video_url = data.get('videoUrl')
    
    if not video_id or not video_url:
        return jsonify({"error": "Missing videoId or videoUrl"}), 400
    
    # Run task in background thread
    import threading
    threading.Thread(target=process_task, args=(video_id, video_url)).start()
    
    return jsonify({"message": f"Job for {video_id} received and started background processing."}), 200

def process_task(video_id, video_url):
    video_path = f"video_{video_id}.mp4"
    vtt_path = f"raw_{video_id}_en.vtt"
    
    try:
        print(f"[{video_id}] Starting process for {video_url}")
        
        # 1. Download video
        subprocess.run(["curl", "-L", "-o", video_path, video_url], check=True)
        
        # 2. Run WhisperX
        device = "cuda" if os.getenv("USE_CUDA") == "true" else "cpu"
        batch_size = 16 # reduce if low on GPU mem
        compute_type = "float16" if device == "cuda" else "int8"
        
        print(f"[{video_id}] Loading model (large-v3) on {device}...")
        model = whisperx.load_model("large-v3", device, compute_type=compute_type)
        
        print(f"[{video_id}] Transcribing...")
        audio = whisperx.load_audio(video_path)
        result = model.transcribe(audio, batch_size=batch_size)
        
        # Alignment (optional but recommended for better timing)
        print(f"[{video_id}] Aligning results...")
        model_a, metadata = whisperx.load_align_model(language_code="en", device=device)
        result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)
        
        # 3. Export to VTT
        print(f"[{video_id}] Saving Raw VTT...")
        generate_vtt(result["segments"], vtt_path)
        
        # 4. Phase 4: LLM Cleanup
        db.collection('videoCaptions').document(video_id).update({
            'captionStatus': 'cleaning'
        })
        
        clean_vtt_path = cleanup_captions(video_id, vtt_path)
        
        # 5. Phase 5: Translation
        db.collection('videoCaptions').document(video_id).update({
            'captionStatus': 'translating'
        })
        
        languages = {
            'es': 'Spanish (Latin American)',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese',
            'it': 'Italian'
        }
        
        paths = {'en': clean_vtt_path}
        for lang_code, lang_name in languages.items():
            t_path = translate_captions(video_id, clean_vtt_path, lang_code, lang_name)
            if t_path:
                paths[lang_code] = t_path
        
        db.collection('videoCaptions').document(video_id).update({
            'captionStatus': 'uploading',
            'vttFilesLocal': paths
        })
        
        if not paths:
            raise Exception("No caption files generated")

        r2_vtt_paths = upload_to_r2(video_id, paths)
        
        if r2_vtt_paths:
            db.collection('videoCaptions').document(video_id).update({
                'captionStatus': 'ready',
                'vttFiles': r2_vtt_paths,
                'completedAt': firestore.SERVER_TIMESTAMP
            })
            print(f"[{video_id}] Job Complete! Status: ready")
        else:
            raise Exception("R2 upload failed for all files")

        # Final Cleanup
        if os.path.exists(video_path):
            os.remove(video_path)
        for p in paths.values():
            if os.path.exists(p):
                os.remove(p)

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[{video_id}] CRITICAL ERROR: {e}\n{error_trace}")
        try:
            db.collection('videoCaptions').document(video_id).update({
                'captionStatus': 'error',
                'error': str(e),
                'errorTrace': error_trace,
                'failedAt': firestore.SERVER_TIMESTAMP
            })
        except:
            pass

if __name__ == '__main__':
    # Default port 5000
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", 5000)))
