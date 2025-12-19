from datetime import date, datetime, timedelta
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product


def _parse_range(from_date: date | None, to_date: date | None):
    """
    Convertimos from/to (DATE) a rango DATETIME:
    - desde: 00:00:00 del día
    - hasta: EXCLUSIVO (día siguiente 00:00:00) para que 'to' sea inclusivo
    """
    dt_from = datetime.min
    dt_to_excl = datetime.max

    if from_date:
        dt_from = datetime.combine(from_date, datetime.min.time())

    if to_date:
        dt_to_excl = datetime.combine(to_date + timedelta(days=1), datetime.min.time())

    return dt_from, dt_to_excl


def get_sales_history(
    db: Session,
    from_date: date | None = None,
    to_date: date | None = None,
    q: str | None = None,
    limit: int = 200,
    offset: int = 0,
):
    dt_from, dt_to_excl = _parse_range(from_date, to_date)

    stmt = (
        select(
            Sale.id.label("sale_id"),
            SaleItem.id.label("item_id"),
            Sale.sold_at.label("sold_at"),
            Product.id.label("product_id"),
            Product.product_name.label("product_name"),
            SaleItem.qty.label("qty"),
            SaleItem.unit.label("unit"),
            SaleItem.unit_price.label("unit_price"),
            SaleItem.subtotal.label("subtotal"),
        )
        .join(SaleItem, SaleItem.sale_id == Sale.id)
        .join(Product, Product.id == SaleItem.product_id)
        .where(Sale.sold_at >= dt_from)
        .where(Sale.sold_at < dt_to_excl)
        .order_by(Sale.sold_at.desc(), SaleItem.id.desc())
        .limit(limit)
        .offset(offset)
    )

    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Product.product_name.ilike(term),
                Product.category_off.ilike(term),
            )
        )

    rows = db.execute(stmt).mappings().all()
    # mappings() => dict por fila, perfecto para Pydantic
    return rows
