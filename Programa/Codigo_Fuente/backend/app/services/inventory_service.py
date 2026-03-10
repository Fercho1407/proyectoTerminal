from sqlalchemy.orm import Session
from sqlalchemy import func, case
from fastapi import HTTPException

from app.models.product import Product
from app.models.inventory_movement import InventoryMovement

def crear_movimiento(db: Session, payload: dict) -> InventoryMovement:
    prod = db.query(Product).filter(Product.id == payload["product_id"]).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    mov = InventoryMovement(
        product_id=payload["product_id"],
        type=payload["type"],
        qty=payload["qty"],
        unit=payload.get("unit", "piece"),
        unit_cost=payload.get("unit_cost"),
        reason=payload.get("reason"),
    )

    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov

def obtener_stock(db: Session):
    """
    Stock por product.
    stock = IN + ADJUST - OUT
    """

    signed_qty = case(
        (InventoryMovement.type.in_(["IN", "ADJUST"]), InventoryMovement.qty),
        (InventoryMovement.type == "OUT", -InventoryMovement.qty),
        else_=0
    )

    rows = (
        db.query(
            Product.id.label("product_id"),
            Product.product_name,
            Product.category_off,
            Product.perecedero,
            InventoryMovement.unit.label("unit"),
            func.coalesce(func.sum(signed_qty), 0).label("stock_actual"),
        )
        .outerjoin(InventoryMovement, InventoryMovement.product_id == Product.id)
        .group_by(
            Product.id,
            Product.product_name,
            Product.category_off,
            Product.perecedero,
            InventoryMovement.unit,
        )
        .order_by(Product.product_name.asc())
        .all()
    )

    result = []
    for r in rows:
        if r.unit is None:
            # producto sin movimientos aún
            result.append({
                "product_id": int(r.product_id),
                "product_name": r.product_name,
                "category_off": r.category_off,
                "perecedero": int(r.perecedero),
                "unit": "piece",
                "stock_actual": 0.0,
            })
        else:
            result.append({
                "product_id": int(r.product_id),
                "product_name": r.product_name,
                "category_off": r.category_off,
                "perecedero": int(r.perecedero),
                "unit": r.unit,
                "stock_actual": float(r.stock_actual or 0),
            })

    return result
