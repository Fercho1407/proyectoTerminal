from sqlalchemy import Column, BigInteger, Enum, DECIMAL, String, ForeignKey, TIMESTAMP, func
from app.db import Base

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    product_id = Column(
        BigInteger,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    type = Column(Enum("IN", "OUT", "ADJUST"), nullable=False)

    qty = Column(DECIMAL(12, 3), nullable=False)

    unit = Column(
        Enum("kg", "g", "piece", "pack", "box", "lt", "ml"),
        nullable=False,
        server_default="piece",
    )

    unit_cost = Column(DECIMAL(12, 2), nullable=True)
    reason = Column(String(255), nullable=True)

    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
