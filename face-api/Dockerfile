# face-api — FastAPI service wrapping scripts/face_verify.py
# Base image ships prebuilt dlib + face_recognition to avoid slow compiles.
FROM quay.io/waisbrot/face-recognition:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
# Legacy module lives at repo root/scripts — mounted/copied two levels up
COPY ../scripts/face_verify.py /repo/scripts/face_verify.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
