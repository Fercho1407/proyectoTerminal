import requests
import pandas as pd
from pathlib import Path
import datetime

def obtener_feriados_calendarific(
        api_key: str,
        country: str = "MX",
        year: int = None,
        out_file: str = "../../Datos/datasets_originales/eventos_cdmx.csv",
        base_url: str = "https://calendarific.com/api/v2/holidays"
    ):
    
    """
    Descarga los dias feriados de Calendarific y los guarda en un CSV con formato:
    date,event,scope

    Parámetros:
        api_key (str): API Key de Calendarific.
        country (str): Código de país (por defecto 'MX').
        year (int): Año a consultar (por defecto año actual).
        out_file (str): Ruta donde guardar el CSV.
        base_url (str): URL base de la API (no modificar normalmente).

    Retorna:
        pd.DataFrame con los feriados obtenidos.
    """

    if year is None:
        year = datetime.datetime.now().year

    out_path = Path(out_file)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    #  Llamada a la APICalendarific
    params = {
        "api_key": api_key,
        "country": country,
        "year": year,
    }

    response = requests.get(base_url, params=params)

    if response.status_code != 200:
        raise RuntimeError(f"Error en API ({response.status_code}): {response.text}")

    data = response.json()

    if "response" not in data or "holidays" not in data["response"]:
        raise ValueError(f"Formato inesperado de respuesta: {data}")

    holidays = data["response"]["holidays"]

    # Procesamiento de los Datos 

    rows = []
    for holiday in holidays:
        name = holiday.get("name", "")
        date_iso = holiday.get("date", {}).get("iso", "")
        types = holiday.get("type", [])
        type_str = ", ".join(types) if isinstance(types, list) else str(types)

        rows.append({
            "date": date_iso[:10],  # yyyy-mm-dd
            "event": name,
            "scope": type_str or "holiday"
        })

    df = pd.DataFrame(rows)

    # Guardar en formato csv 

    df.to_csv(out_path, index=False, encoding="utf-8")
    print(f"Se guardaron {len(df)} feriados en: {out_path}")
    print(df.head())

    return df

obtener_feriados_calendarific(
    api_key="bvEJzyh0h4J3czQcdJXHzasOSLbL9Bsr",
    year=datetime.datetime.now().year
)