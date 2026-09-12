import base64
import io
from typing import List

import cv2
import face_recognition
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Face Service")
MATCH_THRESHOLD = 0.55


class EncodePayload(BaseModel):
    image: str  # base64 data URL


class KnownFace(BaseModel):
    registerNumber: str
    encoding: List[float]


class RecognizePayload(BaseModel):
    image: str
    known: List[KnownFace]


def decode_image(data_url: str) -> np.ndarray:
    if not data_url or not isinstance(data_url, str):
        raise ValueError("Missing image data")
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    try:
        raw = base64.b64decode(data_url)
    except Exception:
        raise ValueError("Image is not valid base64")
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/encode")
def encode(payload: EncodePayload):
    try:
        img = decode_image(payload.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    locations = face_recognition.face_locations(img, model="hog")
    if len(locations) == 0:
        raise HTTPException(status_code=422, detail="No face detected. Look straight at the camera.")
    if len(locations) > 1:
        raise HTTPException(status_code=422, detail="Multiple faces detected. Only one person should be in frame.")

    encodings = face_recognition.face_encodings(img, locations)
    if not encodings:
        raise HTTPException(status_code=422, detail="Could not extract face features. Try better lighting.")

    return {"encoding": encodings[0].tolist()}


@app.post("/recognize")
def recognize(payload: RecognizePayload):
    try:
        img = decode_image(payload.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    locations = face_recognition.face_locations(img, model="hog")
    if len(locations) == 0:
        return {"matched": False, "reason": "No face detected"}
    if len(payload.known) == 0:
        return {"matched": False, "reason": "No registered faces"}

    encodings = face_recognition.face_encodings(img, locations)
    if not encodings:
        return {"matched": False, "reason": "Could not extract face features"}

    best_reg = None
    best_dist = MATCH_THRESHOLD

    for face_enc in encodings:
        for known in payload.known:
            known_vec = np.array(known.encoding, dtype=np.float64)
            dist = float(np.linalg.norm(known_vec - face_enc))
            if dist < best_dist:
                best_dist = dist
                best_reg = known.registerNumber

    if best_reg is None:
        return {"matched": False, "reason": "Face not recognized"}

    return {"matched": True, "registerNumber": best_reg, "distance": best_dist}