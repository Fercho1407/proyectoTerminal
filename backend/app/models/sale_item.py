from sqlalchemy import Column, BigInteger, ForeignKey, DECIMAL, Enum
from sqlalchemy.orm import relationship
from app.db import Base

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    sale_id = Column(BigInteger, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("products.id"), nullable=False)

    qty = Column(DECIMAL(12, 3), nullable=False)
    unit = Column(Enum("kg","g","piece","pack","box","lt","ml", name="sale_items_unit"), nullable=False, server_default="piece")
    unit_price = Column(DECIMAL(12, 2), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
