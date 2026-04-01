from datetime import date, timedelta
from typing import Dict, List, Tuple, Set

import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.ml.predictor import load_artifacts, predict_one
from app.schemas.ml import PredictRequest, PredictResponse, PredPoint

UNITS_ALLOWED = {"piece","kg","g","pack","box","lt","ml"}

_ARTIFACTS = None

def _get_artifacts():
    global _ARTIFACTS
    if _ARTIFACTS is None:
        model, scaler, meta = load_artifacts()
        _ARTIFACTS = (model, scaler, meta)
    return _ARTIFACTS

def _ymd(d: date) -> str:
    return d.isoformat()

def _safe_mean(xs: List[float]) -> float:
    return float(sum(xs) / len(xs)) if xs else 0.0

def _rolling_mean(series: List[float], n: int) -> float:
    if n <= 0:
        return 0.0
    return _safe_mean(series[-n:])

def _factorize_lookup(values_list: List[str], key: str) -> int:
    try:
        return values_list.index(key)
    except ValueError:
        return -1

def _fetch_product(db: Session, product_id: int) -> Dict:
    row = db.execute(
        text("""
            SELECT id, product_name, category_off, perecedero
            FROM products
            WHERE id = :pid
        """),
        {"pid": product_id}
    ).mappings().first()

    if not row:
        raise ValueError(f"Producto no existe: product_id={product_id}")
    return dict(row)

def _fetch_last_price(db: Session, product_id: int, unit: str) -> float:
    row = db.execute(
        text("""
            SELECT unit_price_avg
            FROM v_sales_daily_unified
            WHERE product_id = :pid AND unit = :unit AND unit_price_avg IS NOT NULL
            ORDER BY sale_date DESC
            LIMIT 1
        """),
        {"pid": product_id, "unit": unit}
    ).mappings().first()

    return float(row["unit_price_avg"]) if row and row["unit_price_avg"] is not None else 0.0

def _fetch_event_dates(db: Session, product_id: int, start: date, end: date) -> Set[date]:
    rows = db.execute(
        text("""
            SELECT e.date AS d
            FROM events e
            JOIN event_products ep ON ep.event_id = e.id
            WHERE ep.product_id = :pid
              AND e.date BETWEEN :d1 AND :d2
        """),
        {"pid": product_id, "d1": start, "d2": end}
    ).mappings().all()

    # d normalmente ya es date; si fuera datetime, normalize:
    out = set()
    for r in rows:
        d = r["d"]
        out.add(d if isinstance(d, date) else d.date())
    return out

def _fetch_history(db: Session, product_id: int, unit: str, days_back: int = 140) -> List[Tuple[date, float]]:
    rows = db.execute(
        text("""
            SELECT sale_date, SUM(qty) AS qty
            FROM v_sales_daily_unified
            WHERE product_id = :pid
              AND unit = :unit
              AND sale_date >= (CURRENT_DATE - INTERVAL :days DAY)
            GROUP BY sale_date
            ORDER BY sale_date ASC
        """),
        {"pid": product_id, "unit": unit, "days": days_back}
    ).mappings().all()

    out = []
    for r in rows:
        sd = r["sale_date"]
        sd = sd if isinstance(sd, date) else sd.date()
        out.append((sd, float(r["qty"] or 0)))
    return out

def _dense_daily_series(hist: List[Tuple[date, float]], end_date: date, days_needed: int = 100) -> List[float]:
    if not hist:
        return []
    start_date = end_date - timedelta(days=days_needed - 1)
    dmap = {d: v for d, v in hist}

    series = []
    d = start_date
    while d <= end_date:
        series.append(float(dmap.get(d, 0.0)))
        d += timedelta(days=1)
    return series

def predict_sales(db: Session, req: PredictRequest) -> PredictResponse:
    if req.unit not in UNITS_ALLOWED:
        raise ValueError(f"Unidad inválida: {req.unit}")

    model, scaler, meta = _get_artifacts()
    features = list(meta["features"])

    prod = _fetch_product(db, req.product_id)
    product_name = prod.get("product_name") or ""
    category_off = prod.get("category_off") or ""
    perecedero = int(bool(prod.get("perecedero")))

    product_uniques = list(meta["product_uniques"])
    category_uniques = list(meta["category_uniques"])

    pid_feat = _factorize_lookup(product_uniques, product_name)
    cid_feat = _factorize_lookup(category_uniques, category_off)

    if pid_feat < 0:
        raise ValueError(
            f"Producto no existe en el mapeo del modelo (meta). product_name='{product_name}'."
        )

    used_price = float(req.price) if req.price is not None else _fetch_last_price(db, req.product_id, req.unit)

    hist = _fetch_history(db, req.product_id, req.unit, days_back=160)
    today = date.today()

    base_series = _dense_daily_series(hist, end_date=today, days_needed=120)
    if len(base_series) < 90:
        raise ValueError("No hay suficiente histórico para predecir (~90 días).")

    ev_dates = _fetch_event_dates(db, req.product_id, today + timedelta(days=1), today + timedelta(days=req.days))

    points: List[PredPoint] = []
    series = base_series[:]

    for i in range(req.days):
        d = today + timedelta(days=i + 1)

        anio = d.year
        mes = d.month
        dia_semana = d.weekday()
        es_fin_semana = 1 if dia_semana in (5, 6) else 0
        mes_sin = float(np.sin(2 * np.pi * mes / 12))
        mes_cos = float(np.cos(2 * np.pi * mes / 12))
        dow_sin = float(np.sin(2 * np.pi * dia_semana / 7))
        dow_cos = float(np.cos(2 * np.pi * dia_semana / 7))

        en_temporada = 0
        hay_evento = 1 if d in ev_dates else 0

        lag_1 = series[-1]
        lag_7 = series[-7] if len(series) >= 7 else 0.0
        lag_14 = series[-14] if len(series) >= 14 else 0.0
        media_7 = _rolling_mean(series[:-1], 7)
        media_28 = _rolling_mean(series[:-1], 28)
        media_90 = _rolling_mean(series[:-1], 90)

        row_map = {
            "product_id": float(pid_feat),
            "category_id": float(max(cid_feat, 0)),
            "perecedero": float(perecedero),
            "precio": float(used_price),
            "en_temporada": float(en_temporada),
            "hay_evento": float(hay_evento),
            "anio": float(anio),
            "mes": float(mes),
            "dia_semana": float(dia_semana),
            "es_fin_semana": float(es_fin_semana),
            "mes_sin": float(mes_sin),
            "mes_cos": float(mes_cos),
            "dow_sin": float(dow_sin),
            "dow_cos": float(dow_cos),
            "lag_1": float(lag_1),
            "lag_7": float(lag_7),
            "lag_14": float(lag_14),
            "media_7": float(media_7),
            "media_28": float(media_28),
            "media_90": float(media_90),
        }

        x = np.array([row_map[f] for f in features], dtype="float32")

        y_pred = float(predict_one(x))

        points.append(PredPoint(date=_ymd(d), y_pred=y_pred))
        series.append(y_pred)

    return PredictResponse(
        product_id=req.product_id,
        product_name=product_name,
        unit=req.unit,
        days=req.days,
        used_price=float(used_price),
        points=points,
    )
