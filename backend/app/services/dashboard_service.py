from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import text


def get_dashboard_summary(db: Session) -> dict:
    """
    KPIs del día actual + alertas rápidas
    (sin merma estimada)
    """
    today = date.today()

    # Ventas del día (usa sales.total)
    row = db.execute(
        text("""
            SELECT
                COALESCE(SUM(s.total), 0) AS sales_mxn,
                COUNT(DISTINCT s.id) AS tickets,
                COALESCE(SUM(si.qty), 0) AS items_sold
            FROM sales s
            LEFT JOIN sale_items si ON si.sale_id = s.id
            WHERE DATE(s.sold_at) = :today
        """),
        {"today": today}
    ).mappings().first() or {
        "sales_mxn": 0,
        "tickets": 0,
        "items_sold": 0,
    }

    # Alertas: stock crítico (por producto, no por unidad)
    critical_stock = db.execute(
        text("""
            SELECT COUNT(*) AS n
            FROM (
                SELECT v.product_id
                FROM v_stock_actual v
                GROUP BY v.product_id
                HAVING SUM(v.stock_actual) <= 0
            ) t
        """)
    ).scalar() or 0

    # Reorden sugerido (stock bajo por producto)
    reorder_suggested = db.execute(
        text("""
            SELECT COUNT(*) AS n
            FROM (
                SELECT v.product_id
                FROM v_stock_actual v
                GROUP BY v.product_id
                HAVING SUM(v.stock_actual) > 0
                   AND SUM(v.stock_actual) <= 5
            ) t
        """)
    ).scalar() or 0

    # Productos en temporada hoy (si sales_daily tiene datos)
    in_season = db.execute(
        text("""
            SELECT COUNT(DISTINCT sd.product_id) AS n
            FROM sales_daily sd
            WHERE sd.sale_date = :today
              AND sd.en_temporada = 1
        """),
        {"today": today}
    ).scalar() or 0

    return {
        "date": today.isoformat(),
        "sales_mxn": float(row["sales_mxn"] or 0),
        "tickets": int(row["tickets"] or 0),
        "items_sold": float(row["items_sold"] or 0),
        "alerts": {
            "critical_stock": int(critical_stock),
            "reorder_suggested": int(reorder_suggested),
            "in_season": int(in_season),
        },
    }


def get_dashboard_trend(db: Session, days: int = 7) -> list:
    """
    Serie diaria de ventas (MXN)
    """
    rows = db.execute(
        text("""
            SELECT
                DATE(s.sold_at) AS d,
                COALESCE(SUM(s.total), 0) AS value
            FROM sales s
            WHERE s.sold_at >= (CURRENT_DATE - INTERVAL :days DAY)
            GROUP BY DATE(s.sold_at)
            ORDER BY d ASC
        """),
        {"days": days}
    ).mappings().all()

    return [
        {
            "date": r["d"].isoformat(),
            "value": float(r["value"] or 0)
        }
        for r in rows
    ]
