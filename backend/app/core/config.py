from pathlib import Path

# backend/app/core/config.py
BACKEND_DIR = Path(__file__).resolve().parents[2]   # .../backend
PROJECT_DIR = BACKEND_DIR.parent                    # .../proyectoTerminal
DATASETS_DIR = PROJECT_DIR / "datasets"             # .../proyectoTerminal/datasets

VENTAS_CSV = DATASETS_DIR / "ventas_normalizado.csv"
EVENTOS_CSV = DATASETS_DIR / "eventos_productos.csv"
