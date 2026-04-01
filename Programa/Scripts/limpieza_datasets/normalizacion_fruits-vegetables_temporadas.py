import pandas as pd
import numpy as np

df_temp = pd.read_csv("../../Datos/datasets_originales/frutas_verduras_temporada.csv")
df_temp_cp = df_temp.copy()

def cambiar_valores_columna(df : pd.DataFrame, nombre_columna: str, valor: any) -> pd.DataFrame:
    """
    Reemplaza todos los valores de una columna específica en un DataFrame por un nuevo valor.

    Parametros
    ----------
    df : pandas.DataFrame
        El DataFrame que contiene la columna a modificar.
    nombre_columna : str
        El nombre de la columna cuyos valores seran reemplazados.
    valor : any
        El nuevo valor que se asignara a todos los elementos de la columna.
        Puede ser un valor escalar (str, int, float, bool, etc.).

    Retorna
    -------
    pandas.DataFrame
        Una copia del DataFrame con la columna modificada.  
        No altera el DataFrame original.
    """
    
    if nombre_columna not in df.columns:
        raise KeyError(f"La columna '{nombre_columna}' no existe en el DataFrame.")
    df_copy = df.copy()
    df_copy[nombre_columna] = valor
    return df_copy


#Se cambia solo se cambia la categoria a 'fruits-vegetables'
df_temp_cp = cambiar_valores_columna(df_temp_cp, 'tipo', 'fruits-vegetables')
df_temp_cp.tail(3)

def extraer_temporadas(df, col="temporada_pico"):
    """
    Crea tres nuevas columnas en el DataFrame con información sobre la temporada.

    - todo_el_anio: True si en el texto aparece "todo el año"
    - temporada_pico_inicio: número del mes donde inicia la temporada (1 = enero)
    - temporada_pico_fin: número del mes donde termina la temporada (12 = diciembre)
    """

    # Diccionario para convertir abreviaturas de meses a numeros
    meses = {
        "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
        "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12
    }

    # Lista donde guardar los resultados
    todo_el_anio = []
    mes_inicio = []
    mes_fin = []

    # Recorrido de cada valor de la columna
    for texto in df[col]:
        # Si el valor está vacío o es NaN
        if pd.isna(texto):
            todo_el_anio.append(False)
            mes_inicio.append(np.nan)
            mes_fin.append(np.nan)
            continue

        texto = texto.lower().replace("–", "-")  # reemplaza guiones raros
        es_todo_anio = "todo el año" in texto or "Todo el año" in texto

        # Buscar un rango con guion
        if "-" in texto:
            # Tomamos las primeras tres letras de cada mes
            partes = texto.split("-")
            mes_i = partes[0].strip()[:3]
            mes_f = partes[1].strip()[:3]
            inicio = meses.get(mes_i, np.nan)
            fin = meses.get(mes_f, np.nan)
        else:
            # En caso de no haber guion
            inicio = fin = np.nan
            for m in meses:
                if m in texto:
                    inicio = fin = meses[m]
                    break

        todo_el_anio.append(es_todo_anio)
        mes_inicio.append(inicio)
        mes_fin.append(fin)

    # Agregar las tres nuevas columnas al DataFrame
    df["todo_el_anio"] = todo_el_anio
    df["temporada_pico_inicio"] = mes_inicio
    df["temporada_pico_fin"] = mes_fin

    return df


df = extraer_temporadas(df_temp_cp)
df.to_csv("../../Datos/datasets_procesados/frutas-verduras_temporada_normalizado.csv")