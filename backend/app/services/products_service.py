from sqlalchemy.orm import Session
from app.models.product import Product
from app.ml.modelo_perecedero import predecir_perecedero

def crear_producto(db: Session, payload: dict) -> Product:
    """Crea un producto en BD calculando perecedero con el modelo ML."""
    perecedero = predecir_perecedero(payload)

    nuevo = Product(
        product_name=payload["product_name"],
        category_off=payload["category_off"],
        shelf_life_pantry_days=payload.get("shelf_life_pantry_days", 0),
        shelf_life_fridge_days=payload.get("shelf_life_fridge_days", 0),
        shelf_life_freezer_days=payload.get("shelf_life_freezer_days", 0),
        perecedero=perecedero,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def listar_productos(db: Session) -> list[Product]:
    return db.query(Product)