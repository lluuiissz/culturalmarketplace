"""
face_verify.py  –  Multi-mode face recognition utility
=======================================================

Modes (controlled by --mode flag):
  verify            Compare selfie vs. ID photo.
                    Returns: match, distance, confidence, selfie_embedding
  check_duplicate   Compare a new selfie embedding against a JSON list of
                    stored embeddings passed via --embeddings argument.
                    Returns: is_duplicate (bool), matched_artisan_id (int|null)

Legacy (no --mode):  original two-arg verify behaviour (backwards compat).

Usage examples
--------------
  py face_verify.py --mode verify "id.jpg" "selfie.jpg"
  py face_verify.py --mode check_duplicate "selfie.jpg" --embeddings '[{"artisan_id":1,"embedding":[...]}]'
"""

import sys
import json
import argparse
import numpy as np
import face_recognition


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_first_encoding(image_path: str):
    """Load an image and return its first face encoding, or None."""
    img = face_recognition.load_image_file(image_path)
    encodings = face_recognition.face_encodings(img)
    return encodings[0] if encodings else None


def euclidean_distance(a, b) -> float:
    return float(np.linalg.norm(np.array(a) - np.array(b)))


def confidence_from_distance(distance: float) -> float:
    """Convert Euclidean distance to a 0-1 confidence score."""
    return max(0.0, min(1.0, 1.0 - (distance / 0.8)))


# ---------------------------------------------------------------------------
# Mode: verify  (selfie vs ID photo)
# ---------------------------------------------------------------------------

def mode_verify(id_image_path: str, selfie_image_path: str):
    id_enc = load_first_encoding(id_image_path)
    if id_enc is None:
        print(json.dumps({"error": "No face found in the ID image."}))
        sys.exit(0)

    selfie_enc = load_first_encoding(selfie_image_path)
    if selfie_enc is None:
        print(json.dumps({"error": "No face found in the selfie image."}))
        sys.exit(0)

    # Compare – tolerance 0.55 (stricter than default 0.6)
    results   = face_recognition.compare_faces([id_enc], selfie_enc, tolerance=0.55)
    distances = face_recognition.face_distance([id_enc], selfie_enc)
    distance  = float(distances[0])
    conf      = confidence_from_distance(distance)

    print(json.dumps({
        "match":            bool(results[0]),
        "distance":         distance,
        "confidence":       conf,
        # Return the embedding so PHP can store it in the DB
        "selfie_embedding": selfie_enc.tolist(),
    }))


# ---------------------------------------------------------------------------
# Mode: check_duplicate  (selfie vs stored DB embeddings)
# ---------------------------------------------------------------------------

def mode_check_duplicate(selfie_image_path: str, embeddings_json: str, embeddings_file: str = ""):
    selfie_enc = load_first_encoding(selfie_image_path)
    if selfie_enc is None:
        print(json.dumps({"error": "No face found in the selfie image. Please try again with good lighting."}))
        sys.exit(0)

    try:
        if embeddings_file:
            with open(embeddings_file, 'r', encoding='utf-8') as f:
                stored = json.load(f)
        else:
            stored = json.loads(embeddings_json)
    except json.JSONDecodeError:
        print(json.dumps({"error": "System Error: Failed to check for existing accounts due to an internal data format error."}))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": f"System Error: Failed to load face data. {str(e)}"}))
        sys.exit(0)

    if not stored:
        # No registered faces yet – definitely not a duplicate
        print(json.dumps({"is_duplicate": False, "matched_artisan_id": None}))
        return

    # Threshold for duplicate detection (stricter than verify)
    DUPLICATE_THRESHOLD = 0.50

    for row in stored:
        artisan_id = row.get("artisan_id")
        stored_vec = row.get("embedding")
        if not stored_vec or len(stored_vec) != 128:
            continue
        dist = euclidean_distance(selfie_enc, stored_vec)
        if dist < DUPLICATE_THRESHOLD:
            print(json.dumps({
                "is_duplicate":       True,
                "matched_artisan_id": artisan_id,
                "distance":           dist,
            }))
            return

    print(json.dumps({"is_duplicate": False, "matched_artisan_id": None}))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    # Legacy mode: exactly 2 positional args and no --mode flag
    if len(sys.argv) == 3 and not sys.argv[1].startswith('--'):
        try:
            mode_verify(sys.argv[1], sys.argv[2])
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
        return

    parser = argparse.ArgumentParser(description="Face verification utility")
    parser.add_argument("--mode", choices=["verify", "check_duplicate"], required=True)
    parser.add_argument("images", nargs="+", help="Image path(s)")
    parser.add_argument("--embeddings", default="[]",
                        help="JSON array of stored embeddings (for check_duplicate mode)")
    parser.add_argument("--embeddings_file", default="",
                        help="Path to JSON file of stored embeddings (for check_duplicate mode)")

    args = parser.parse_args()

    try:
        if args.mode == "verify":
            if len(args.images) < 2:
                print(json.dumps({"error": "Verify mode requires 2 images: id_image and selfie_image."}))
                sys.exit(1)
            mode_verify(args.images[0], args.images[1])
        elif args.mode == "check_duplicate":
            if len(args.images) < 1:
                print(json.dumps({"error": "Check duplicate mode requires a selfie image."}))
                sys.exit(1)
            mode_check_duplicate(args.images[0], args.embeddings, args.embeddings_file)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
