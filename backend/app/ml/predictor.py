from pathlib import Path
import joblib
import numpy as np
import tensorflow as tf

MODELS_DIR = Path(__file__).resolve().parents[2] / "ml_models"
MODEL_PATH = MODELS_DIR / "nn_sales_model.keras"
SCALER_PATH = MODELS_DIR / "scaler.joblib"
META_PATH = MODELS_DIR / "meta.joblib"

_model = None
_scaler = None
_meta = None

def load_artifacts():
    global _model, _scaler, _meta
    if _model is None:
        _model = tf.keras.models.load_model(MODEL_PATH)
    if _scaler is None:
        _scaler = joblib.load(SCALER_PATH)
    if _meta is None:
        _meta = joblib.load(META_PATH)
    return _model, _scaler, _meta

def predict_one(x_row: np.ndarray) -> float:
    model, scaler, meta = load_artifacts()
    X = x_row.astype("float32", copy=False).reshape(1, -1)

    num_idx = meta["num_idx"]
    X[:, num_idx] = scaler.transform(X[:, num_idx])

    y_pred_log = model.predict(X, verbose=0).ravel()[0]
    y_pred = float(np.expm1(y_pred_log))
    if y_pred < 0:
        y_pred = 0.0
    return y_pred
