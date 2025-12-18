from sqlalchemy import Column, BigInteger, ForeignKey, DECIMAL, Enum, String, TIMESTAMP
from sqlalchemy.sql import func
from app.db import Base

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum("IN","OUT","ADJUST", name="inv_mov_type"), nullable=False)
    qty = Column(DECIMAL(12, 3), nullable=False)
    unit = Column(Enum("kg","g","piece","pack","box","lt","ml", name="inv_mov_unit"), nullable=False, server_default="piece")
    unit_cost = Column(DECIMAL(12, 2), nullable=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
