from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from datetime import datetime

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.inventory_movement import InventoryMovement

def create_sale(db: Session, payload: dict) -> Sale:
    items = payload.get("items") or []
    if not items:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos 1 item.")

    sale = Sale(
        sold_at=payload.get("sold_at") or datetime.utcnow(),
        payment_method=payload.get("payment_method"),
        notes=payload.get("notes"),
        total=0,
    )

    # Transacción manual (si algo falla, rollback)
    try:
        db.add(sale)
        db.flush()  # para obtener sale.id

        total = 0.0

        for it in items:
            qty = float(it["qty"])
            unit_price = float(it["unit_price"])
            subtotal = round(qty * unit_price, 2)
            total += subtotal

            si = SaleItem(
                sale_id=sale.id,
                product_id=int(it["product_id"]),
                qty=qty,
                unit=it.get("unit", "piece"),
                unit_price=unit_price,
                subtotal=subtotal,
            )
            db.add(si)

            # registrar movimiento OUT (sin conversiones)
            mov = InventoryMovement(
                product_id=int(it["product_id"]),
                type="OUT",
                qty=qty,
                unit=it.get("unit", "piece"),
                unit_cost=None,
                reason=f"SALE #{sale.id}",
            )
            db.add(mov)

        sale.total = round(total, 2)

        db.commit()

    except Exception as e:
        db.rollback()
        raise

    # devolver con items cargados
    sale_db = (
        db.query(Sale)
        .options(joinedload(Sale.items))
        .filter(Sale.id == sale.id)
        .first()
    )
    return sale_db
