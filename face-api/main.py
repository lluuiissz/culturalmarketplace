# FastAPI face-verification service — keeps the exact legacy contract
# (verify: selfie-vs-ID; check_duplicate: embedding match) while running on
# OpenCV YuNet (detection) + SFace (recognition) instead of dlib/face_recognition,
# which has no Windows wheels for Python 3.12.
#
# Distance convention: SFace gives cosine similarity; we map it to the dlib-style
# Euclidean distance dist = sqrt(2*(1-cos)) so the legacy thresholds still hold:
#   verify   match if distance <= 0.55 (confidence = 1 - distance/0.8)
#   duplicate if distance <= 0.50
# Embeddings are 128-d, same dimension the app stores in face_embeddings.

import io
import os
import json
import urllib.request
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import cv2

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
YUNET_PATH = os.path.join(MODEL_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
SFACE_PATH = os.path.join(MODEL_DIR, "face_recognition_sface_2021dec.onnx")

VERIFY_THRESHOLD = 0.55      # legacy tolerance (stricter than dlib default 0.6)
DUPLICATE_THRESHOLD = 0.50   # legacy duplicate threshold

app = FastAPI(title="Cultural Marketplace — Face Verification API")

_yunet = None
_sface = None


def _download(url: str, dest: str) -> None:
    os.makedirs(MODEL_DIR, exist_ok=True)
    tmp = dest + ".tmp"
    with urllib.request.urlopen(url, timeout=60) as r, open(tmp, "wb") as f:
        f.write(r.read())
    os.replace(tmp, dest)


def _models():
    global _yunet, _sface
    if _yunet is None:
        if not os.path.exists(YUNET_PATH):
            _download(YUNET_URL, YUNET_PATH)
        if not os.path.exists(SFACE_PATH):
            _download(SFACE_URL, SFACE_PATH)
        _yunet = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), score_threshold=0.6)
        _sface = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
    return _yunet, _sface


def _encoding(image_bytes: bytes) -> np.ndarray:
    """First face embedding in an image, or HTTP 422 if none found."""
    yunet, sface = _models()
    buf = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=422, detail={"error": "Image could not be decoded."})
    h, w = img.shape[:2]
    if h < 20 or w < 20:
        raise HTTPException(status_code=422, detail={"error": "Image too small to contain a face."})
    yunet.setInputSize((w, h))
    ok, faces = yunet.detect(img)
    if not ok or faces is None or len(faces) == 0:
        raise HTTPException(status_code=422, detail={"error": "No face found in image."})
    aligned = sface.alignCrop(img, faces[0])
    feat = sface.feature(aligned).flatten()  # 128-d, L2-normalized by SFace
    return feat.astype(float)


def _cosine_to_dlib_distance(a: np.ndarray, b: np.ndarray) -> float:
    cos = float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))
    return float(np.sqrt(max(0.0, 2.0 * (1.0 - cos))))


def _confidence(distance: float) -> float:
    return max(0.0, min(1.0, 1.0 - (distance / 0.8)))


@app.get("/health")
def health():
    return {"status": "ok", "service": "face-api", "engine": "opencv-yunet-sface"}


@app.post("/verify")
async def verify(
    id_image: UploadFile = File(...),
    selfie: UploadFile = File(...),
):
    """Selfie vs ID photo. Returns match, distance, confidence, selfie_embedding."""
    id_enc = _encoding(await id_image.read())
    selfie_enc = _encoding(await selfie.read())

    distance = _cosine_to_dlib_distance(id_enc, selfie_enc)
    match = distance <= VERIFY_THRESHOLD

    return JSONResponse({
        "match": bool(match),
        "distance": distance,
        "confidence": _confidence(distance),
        "selfie_embedding": [float(x) for x in selfie_enc],
    })


@app.post("/check-duplicate")
async def check_duplicate(
    selfie: UploadFile = File(...),
    embeddings: str = Form(...),  # JSON: [{"artisan_id": 1, "embedding": [...]}]
):
    """Duplicate-face check against stored artisan embeddings."""
    selfie_enc = _encoding(await selfie.read())

    try:
        stored = json.loads(embeddings)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail={"error": "embeddings is not valid JSON."})

    if not stored:
        return JSONResponse({"is_duplicate": False, "matched_artisan_id": None, "distance": None})

    best_distance = float("inf")
    best_id = None
    for row in stored:
        emb = np.array(row.get("embedding") or [], dtype=float)
        if emb.size != 128:
            continue
        d = _cosine_to_dlib_distance(emb, selfie_enc)
        if d < best_distance:
            best_distance = d
            best_id = row.get("artisan_id")

    is_duplicate = best_distance <= DUPLICATE_THRESHOLD
    return JSONResponse({
        "is_duplicate": bool(is_duplicate),
        "matched_artisan_id": best_id if is_duplicate else None,
        "distance": best_distance if best_distance != float("inf") else None,
    })
