from pathlib import Path
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "ml_models"

# Cargar una sola vez (al importar el módulo)
modelo = joblib.load(MODELS_DIR / "perecedero_rf.pkl")
encoder = joblib.load(MODELS_DIR / "category_encoder.pkl")

FEATURES = [
    "category_off",
    "shelf_life_pantry_days",
    "shelf_life_fridge_days",
    "shelf_life_freezer_days",
]

def _safe_encode_category(cat: str) -> int:
    """Convierte la categoría a número; si no existe en el encoder regresa -1."""
    if cat in encoder.classes_:
        return int(encoder.transform([cat])[0])
    return -1

def predecir_perecedero(payload: dict) -> int:
    """Recibe un dict con los features y regresa 1 (perecedero) o 0 (no)."""
    df = pd.DataFrame([payload])
    df["category_off"] = df["category_off"].apply(_safe_encode_category)

    X = df[FEATURES]
    return int(modelo.predict(X)[0])
