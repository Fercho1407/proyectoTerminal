from sqlalchemy import Column, BigInteger, DateTime, DECIMAL, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    sold_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    total = Column(DECIMAL(12, 2), nullable=False, server_default="0")
    payment_method = Column(String(40), nullable=True)
    notes = Column(String(255), nullable=True)

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
