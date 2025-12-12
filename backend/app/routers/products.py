from fastapi import APIRouter, Query
from typing import Optional, List, Dict
from app.services.data_loader import get_ventas

router = APIRouter()

@router.get("/products")
def list_products(
    q: Optional[str] = Query(None, description="Búsqueda por texto (contiene)"),
    category: Optional[str] = Query(None, description="Filtrar por category_off"),
    limit: int = Query(200, ge=1, le=2000)
) -> Dict:
    df = get_ventas()

    # Columnas base
    cols = ["product_name", "category_off", "perecedero"]
    sub = df[cols].dropna()

    # Q: búsqueda simple (case-insensitive)
    if q:
        q_low = q.strip().lower()
        sub = sub[sub["product_name"].str.lower().str.contains(q_low, na=False)]

    # Filtrar por categoría
    if category:
        cat_low = category.strip().lower()
        sub = sub[sub["category_off"].str.lower() == cat_low]

    # Unicos
    unique = (
        sub.drop_duplicates(subset=["product_name", "category_off", "perecedero"])
           .sort_values(["category_off", "product_name"])
           .head(limit)
    )

    items: List[dict] = unique.to_dict(orient="records")
    return {"count": len(items), "items": items}
