"""
CLI Runner for Face Verification and Duplicate Detection.
Allows Node.js to directly invoke the OpenCV YuNet + SFace model
even when the HTTP service on port 8001 is offline or starting up.
"""

import sys
import os
import json
import numpy as np

# Ensure face-api directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import (
    _encoding,
    _cosine_to_dlib_distance,
    _confidence,
    VERIFY_THRESHOLD,
    DUPLICATE_THRESHOLD,
)
from fastapi import HTTPException


def run_verify(id_path: str, selfie_path: str):
    if not os.path.exists(id_path):
        return {"status": "error", "message": f"ID image file not found: {id_path}"}
    if not os.path.exists(selfie_path):
        return {"status": "error", "message": f"Selfie image file not found: {selfie_path}"}

    with open(id_path, "rb") as f:
        id_bytes = f.read()
    with open(selfie_path, "rb") as f:
        selfie_bytes = f.read()

    try:
        id_enc = _encoding(id_bytes, label="ID photo")
    except HTTPException as e:
        msg = e.detail.get("error", "No face found in ID photo.") if isinstance(e.detail, dict) else str(e.detail)
        return {"status": "no_face", "message": msg}
    except Exception as e:
        return {"status": "error", "message": f"ID processing error: {e}"}

    try:
        selfie_enc = _encoding(selfie_bytes, label="live selfie")
    except HTTPException as e:
        msg = e.detail.get("error", "No face found in live selfie.") if isinstance(e.detail, dict) else str(e.detail)
        return {"status": "no_face", "message": msg}
    except Exception as e:
        return {"status": "error", "message": f"Selfie processing error: {e}"}

    distance = _cosine_to_dlib_distance(id_enc, selfie_enc)
    match = bool(distance <= VERIFY_THRESHOLD)
    confidence = _confidence(distance)

    return {
        "status": "ok",
        "match": match,
        "distance": round(distance, 4),
        "confidence": round(confidence, 4),
        "selfie_embedding": [round(float(x), 6) for x in selfie_enc],
        "message": "Face matched your ID photo." if match else "Face did not match ID photo.",
    }


def run_check_duplicate(selfie_path: str, embeddings_arg: str):
    if not os.path.exists(selfie_path):
        return {"status": "error", "message": f"Selfie file not found: {selfie_path}"}

    with open(selfie_path, "rb") as f:
        selfie_bytes = f.read()

    try:
        selfie_enc = _encoding(selfie_bytes, label="live selfie")
    except HTTPException as e:
        msg = e.detail.get("error", "No face found in live selfie.") if isinstance(e.detail, dict) else str(e.detail)
        return {"status": "no_face", "message": msg}
    except Exception as e:
        return {"status": "error", "message": f"Selfie processing error: {e}"}

    try:
        if os.path.exists(embeddings_arg):
            with open(embeddings_arg, "r", encoding="utf-8") as f:
                stored = json.load(f)
        else:
            stored = json.loads(embeddings_arg)
    except Exception as e:
        return {"status": "error", "message": f"Failed to parse embeddings JSON: {e}"}

    if not stored:
        return {"status": "ok", "is_duplicate": False, "matched_artisan_id": None, "distance": None}

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

    is_duplicate = bool(best_distance <= DUPLICATE_THRESHOLD)
    return {
        "status": "ok",
        "is_duplicate": is_duplicate,
        "matched_artisan_id": best_id if is_duplicate else None,
        "distance": round(best_distance, 4) if best_distance != float("inf") else None,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "Missing command argument"}))
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "verify":
        if len(sys.argv) < 4:
            print(json.dumps({"status": "error", "message": "Usage: verify <id_path> <selfie_path>"}))
            sys.exit(1)
        res = run_verify(sys.argv[2], sys.argv[3])
        print(json.dumps(res))
    elif cmd == "check-duplicate":
        if len(sys.argv) < 4:
            print(json.dumps({"status": "error", "message": "Usage: check-duplicate <selfie_path> <embeddings>"}))
            sys.exit(1)
        res = run_check_duplicate(sys.argv[2], sys.argv[3])
        print(json.dumps(res))
    else:
        print(json.dumps({"status": "error", "message": f"Unknown command: {cmd}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
