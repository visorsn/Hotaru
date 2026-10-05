# Firefly Mini — AI Lokal, Cukup Buat Ngobrol

Ini versi **paling minimal** dari dokumen "Firefly Engine" yang lu upload —
gw potong bagian avatar Live2D, TTS/STT suara, dan RAG memori jangka panjang.
Yang tersisa cuma inti yang lu minta: **bisa interaksi teks sama AI lokal**.

Total ada 3 file: `app.py` (backend), `index.html` (chat UI), `requirements.txt`.

## Yang lu butuhin di komputer lu

- Python 3.10+
- Ollama (buat jalanin model AI-nya secara lokal)
- RAM minimal 8GB (buat model 7B versi quantized)

## Langkah setup

### 1. Install Ollama
Download dan install dari **https://ollama.com/download** (tersedia buat Windows/Mac/Linux).

### 2. Download model AI-nya
Buka terminal, jalankan:
```bash
ollama pull qwen2.5:7b
```
Kalau laptop lu spek-nya pas-pasan (RAM 8GB tanpa GPU dedicated), pakai model
yang lebih kecil biar ga berat:
```bash
ollama pull qwen2.5:3b
```
Kalau pakai model ini, buka `app.py` dan ganti baris:
```python
MODEL_NAME = "qwen2.5:7b"
```
jadi:
```python
MODEL_NAME = "qwen2.5:3b"
```

### 3. Pastikan Ollama jalan
```bash
ollama serve
```
(Biasanya udah otomatis jalan background setelah install, tapi kalau error
"connection refused" nanti, ini yang perlu dijalanin manual.)

### 4. Install dependency Python
Di folder ini, jalankan:
```bash
pip install -r requirements.txt
```

### 5. Jalanin server chat-nya
```bash
python app.py
```

### 6. Buka browser
Akses **http://localhost:8000** — langsung bisa ngetik dan ngobrol sama AI-nya.

---

## Kalau mau ganti kepribadian AI-nya
Edit variabel `SYSTEM_PROMPT` di `app.py`, contoh:
```python
SYSTEM_PROMPT = (
    "Kamu adalah asisten AI lokal yang ramah, santai, dan membantu. "
    "Jawab dalam Bahasa Indonesia yang natural. Jawaban ringkas dan jelas."
)
```
Ubah kalimat itu sesuai karakter yang lu mau (formal, ceria, to-the-point, dll).

## Kalau nanti mau nambah fitur lagi
Dokumen yang lu upload itu isinya lengkap banget (28 bab) — mencakup:
- Avatar visual Live2D
- Suara AI (Text-to-Speech) & AI bisa dengerin suara lu (Speech-to-Text)
- Memori jangka panjang pakai vector database (RAG)

Kalau versi mini ini udah jalan dan lu mau nambah salah satu dari itu,
tinggal bilang aja fitur mana yang mau ditambahin duluan — gw bikinin
step-nya satu-satu biar ga keteteran.

## Kalau ada masalah
- **"Ollama tidak jalan"** muncul di chat → jalankan `ollama serve` di terminal lain.
- **Balasan AI lambat banget** → coba model yang lebih kecil (`qwen2.5:3b`).
- **Port 8000 udah dipakai** → ganti `port=8000` di baris terakhir `app.py`.
