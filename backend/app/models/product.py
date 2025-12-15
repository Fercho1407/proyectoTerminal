from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Enum, func
from sqlalchemy.orm import relationship
from app.db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Datos base del producto
    product_name = Column(String(255), nullable=False)
    category_off = Column(String(120), nullable=True)
    shelf_life_pantry_days = Column(Integer, nullable=True)
    shelf_life_fridge_days = Column(Integer, nullable=True)
    shelf_life_freezer_days = Column(Integer, nullable=True)
    perecedero = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    movements = relationship("InventoryMovement", back_populates="product")
 
class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    type = Column(
        Enum("IN", "OUT", "ADJUST", name="inv_type_enum"),
        nullable=False
    )

    qty = Column(DECIMAL(12, 3), nullable=False)
    reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    product = relationship("Product", back_populates="movements")

