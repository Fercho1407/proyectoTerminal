from sqlalchemy.orm import Session
from sqlalchemy import text

RANGE_TO_DAYS = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}

def _resolve_product_id(db: Session, product_id: int | None, product_name: str | None) -> tuple[int, str]:
    if product_id is not None:
        row = db.execute(
            text("SELECT id, product_name FROM products WHERE id=:id LIMIT 1"),
            {"id": product_id},
        ).mappings().first()
        if not row:
            raise ValueError("Producto no encontrado por id")
        return int(row["id"]), row["product_name"]

    if product_name:
        row = db.execute(
            text("SELECT id, product_name FROM products WHERE product_name=:name LIMIT 1"),
            {"name": product_name},
        ).mappings().first()
        if not row:
            raise ValueError("Producto no encontrado por nombre")
        return int(row["id"]), row["product_name"]

    raise ValueError("Debes enviar product_id o product_name")


def get_product_stats(
    db: Session,
    product_id: int | None,
    product_name: str | None,
    unit: str = "piece",
    range_: str = "30d",
    metric: str = "sales",
):
    days = RANGE_TO_DAYS.get(range_, 30)

    pid, pname = _resolve_product_id(db, product_id, product_name)

    # value por día (sales = qty, revenue = qty * price)
    if metric == "revenue":
        value_expr = "SUM(qty * COALESCE(unit_price_avg, 0))"
    else:
        value_expr = "SUM(qty)"

    rows = db.execute(
        text(f"""
            SELECT
              sale_date,
              {value_expr} AS value
            FROM v_sales_daily_unified
            WHERE product_id = :pid
              AND unit = :unit
              AND sale_date >= (CURRENT_DATE - INTERVAL :days DAY)
            GROUP BY sale_date
            ORDER BY sale_date ASC
        """),
        {"pid": pid, "unit": unit, "days": days},
    ).mappings().all()

    series = [{"date": str(r["sale_date"]), "value": float(r["value"] or 0.0)} for r in rows]

    # KPIs
    values = [p["value"] for p in series]
    total = float(sum(values))
    n = len(values)
    avg = float(total / n) if n else 0.0

    if n:
        mean = avg
        var = sum((x - mean) ** 2 for x in values) / n
        volatility = float(var ** 0.5)
    else:
        volatility = 0.0

    return {
        "product_id": pid,
        "product_name": pname,
        "unit": unit,
        "range": range_,
        "metric": metric,
        "total": total,
        "avg_per_day": avg,
        "volatility": volatility,
        "series": series,
    }
