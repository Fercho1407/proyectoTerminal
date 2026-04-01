import pandas as pd
from pathlib import Path
import unicodedata

def normalize_text(texto):
    """
    Deja el texto en minúsculas, sin acentos ni caracteres raros,
    y sin espacios duplicados. Sirve para poder comparar nombres.
    """
    if pd.isna(texto):
        return ""

    # Pasar a minúsculas y quitar espacios al inicio y final
    texto = texto.lower().strip()

    # Quitar acentos
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")

    # Reemplazar algunos signos por espacio
    for rep in [",", ".", "(", ")", "-", "_"]:
        texto = texto.replace(rep, " ")

    # Quitar espacios duplicados
    texto = " ".join(texto.split())

    return texto

def month_in_range(mes, inicio, fin, todo_el_anio):
    """
    Revisa si el mes cae dentro de la temporada de un producto.
    """
    if todo_el_anio:
        return True

    if pd.isna(inicio) or pd.isna(fin):
        return False

    inicio = int(inicio)
    fin = int(fin)

    # Temporada normal, por ejemplo de mayo (5) a agosto (8)
    if inicio <= fin:
        return inicio <= mes <= fin
    else:
        # Temporada que cruza el año, por ejemplo de diciembre (12) a marzo (3)
        return mes >= inicio or mes <= fin

def generar_eventos_productos(data_dir="../../Datos", out_file="eventos_productos.csv"):
    """
    Genera el archivo eventos_productos.csv a partir de:
      - eventos_cdmx.csv
      - frutas-verduras_temporada_normalizado.csv
      - productos_clasificados.csv

    Parámetros:
        data_dir: carpeta donde están los CSV (por defecto '../datasets')
        out_file: nombre del archivo de salida dentro de esa carpeta

    Regresa:
        df_eventos_prod: DataFrame con las relaciones evento-producto
        con columnas: [event, date, producto_relacionado]
    """
    # Convertir rutas a objetos Path
    DATA_DIR = Path(data_dir)
    OUT_PATH = DATA_DIR / "eventos" / out_file

    # Cargar archivos
    df_eventos = pd.read_csv(DATA_DIR / "datasets_originales" /"eventos_cdmx.csv", parse_dates=["date"])

    df_temp = pd.read_csv(DATA_DIR / "datasets_procesados" /"frutas-verduras_temporada_normalizado.csv")

    df_prod = pd.read_csv(DATA_DIR / "datasets_procesados" /"productos_clasificados.csv")

    # Crear columnas "normalizadas" para poder comparar texto
    df_temp["key_temp"] = df_temp["nombre"].apply(normalize_text)
    df_prod["key_prod"] = df_prod["product_name"].apply(normalize_text)

    mapa_nombre_producto = {}


    for i, row_temp in df_temp.iterrows():
        key_temp = row_temp["key_temp"]

        # Buscar productos cuyo nombre normalizado contenga el nombre de la fruta/verdura
        candidatos = df_prod[df_prod["key_prod"].str.contains(key_temp, na=False)]

        if len(candidatos) == 0:
            # Si no encuentra un producto equivalente, usa el nombre de la fruta/verdura
            mapa_nombre_producto[key_temp] = row_temp["nombre"]
        else:
            producto = candidatos.iloc[0]["product_name"]
            mapa_nombre_producto[key_temp] = producto

    # Lista donde se guardan todas las filas del CSV final
    rows = []

    print("Generando relaciones evento -> frutas/verduras en temporada...")

    for i, ev in df_eventos.iterrows():
        event_name = ev["event"]
        fecha_evento = ev["date"]         
        mes_evento = fecha_evento.month

        # Para cada fruta/verdura revisa si está en temporada ese mes
        for j, row_temp in df_temp.iterrows():
            todo_el_anio = bool(row_temp.get("todo_el_anio", False))

            en_temp = month_in_range(
                mes_evento,
                row_temp["temporada_pico_inicio"],
                row_temp["temporada_pico_fin"],
                todo_el_anio
            )

            if en_temp:
                key_temp = row_temp["key_temp"]
                producto_relacionado = mapa_nombre_producto.get(key_temp, row_temp["nombre"])

                rows.append({
                    "event": event_name,
                    "date": fecha_evento,          
                    "producto_relacionado": producto_relacionado
                })

    # Si el nombre del evento contiene cierto texto, se relacionan algunas categorías
    EVENT_CATEGORY_RULES = {
        "christmas": [
            "disposable-cups", "disposable-plates", "disposable-cutlery",
            "disposable-trays", "disposable-containers", "disposable-lids",
            "beer", "whisky", "rum", "vodka", "brandy", "soda", "bottled-water"
        ],
        "new year's eve": [
            "disposable-cups", "disposable-plates", "disposable-cutlery",
            "beer", "whisky", "rum", "vodka", "brandy", "soda", "bottled-water"
        ],
        "day of the holy kings": [
            "disposable-cups", "disposable-plates",
            "soda", "bottled-water", "canned-milk"
        ],
        "children's day": [
            "soda", "bottled-water", "snacks"
        ],
        "fathers' day": [
            "beer", "whisky", "rum", "vodka", "brandy", "soda"
        ],
        "mothers' day": [
            "soda", "bottled-water"
        ],
        "independence day": [
            "disposable-plates", "disposable-cups", "disposable-cutlery", "beer", "soda"
        ],
    }

    # Palabras clave para buscar también por texto en el nombre del producto
    EXTRA_KEYWORDS = {
        "christmas": ["vasos desechables", "plato unicel", "platos desechables"],
        "new year's eve": ["vasos desechables", "plato unicel", "platos desechables"],
    }

    for i, ev in df_eventos.iterrows():
        event_name = ev["event"]
        fecha_evento = ev["date"]  
        event_lower = event_name.lower()

        # Reglas por categoría (usa la columna category_off)
        for pattern, categories in EVENT_CATEGORY_RULES.items():
            if pattern in event_lower:
                for categoria in categories:
                    # Tomar todos los productos que pertenezcan a esa categoría
                    productos_categoria = df_prod[df_prod["category_off"] == categoria]

                    for k, prod in productos_categoria.iterrows():
                        rows.append({
                            "event": event_name,
                            "date": fecha_evento,   
                            "producto_relacionado": prod["product_name"]
                        })

        # Reglas por palabras clave en el nombre del producto
        for pattern, keywords in EXTRA_KEYWORDS.items():
            if pattern in event_lower:
                for kw in keywords:
                    kw_norm = normalize_text(kw)
                    # Buscar productos cuyo nombre normalizado contenga esa palabra clave
                    productos_kw = df_prod[df_prod["key_prod"].str.contains(kw_norm, na=False)]

                    for k, prod in productos_kw.iterrows():
                        rows.append({
                            "event": event_name,
                            "date": fecha_evento,   
                            "producto_relacionado": prod["product_name"]
                        })

    df_eventos_prod = pd.DataFrame(rows)

    # Eliminar duplicados por si se repiten combinaciones event/producto
    df_eventos_prod = df_eventos_prod.drop_duplicates().reset_index(drop=True)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df_eventos_prod.to_csv(OUT_PATH, index=False, encoding="utf-8")

    return df_eventos_prod

df_eventos_prod = generar_eventos_productos()

print(df_eventos_prod.head())
