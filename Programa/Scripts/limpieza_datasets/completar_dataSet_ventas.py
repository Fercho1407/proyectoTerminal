import pandas as pd
from pathlib import Path
import unicodedata

#Apertura de los datasets en un DataFrame
DATA_DIR = Path("../../Datos")

df_ventas = pd.read_csv(DATA_DIR / "datasets_originales" /'ventas.csv')
df_clasificados = pd.read_csv(DATA_DIR / "datasets_procesados" /'productos_clasificados.csv')

#Del DataFrame donde estan los productos clasificados solo se usaran las siguientes dos columnas
df_clasificados = df_clasificados[['product_name', 'perecedero']]
df_clasificados.head(3)

#Se hace una copia del DataFrame de las ventas
df_ventas_cp = df_ventas.copy()

#Se Hace la union del DataFrame de perecederos, es decir a cada producto se le asigna si es perecedero o no
df_ventas_perecederos = pd.merge(df_ventas_cp, df_clasificados, how="left", on= "product_name")
df_ventas_perecederos.loc[df_ventas_perecederos['category_off'] == 'fruits-vegetables', 'perecedero'] = 1
df_ventas_perecederos[df_ventas_perecederos['perecedero'].isna()]

#Se crean las siguientes tres columnas con valores por defecto
df_ventas_perecederos['en_temporada'] = 0
df_ventas_perecederos['temp_inicio_mes'] = 1 
df_ventas_perecederos['temp_fin_mes'] = 12

#Se abre el DataFrame con las temporadas de todas las frutas y verduras
df_frutas_verduras_temp = pd.read_csv(DATA_DIR / "datasets_procesados" /'frutas-verduras_temporada_normalizado.csv')

#Funcion que se encarga de acer una normalizacion simple de los nombres de los productos
def normalizar(texto):
    """
    La funcion realiza lo siguiente:
    - Convierte el texto a minúsculas.
    - Elimina espacios en blanco al inicio y al final.
    - Quita acentos y caracteres diacríticos (normalización Unicode NFD).
    - Convierte valores NaN en una cadena vacía.

    Parámetros
    ----------
    texto : str o cualquier tipo convertible a string
        Texto original a normalizar.
    """
    
    if pd.isna(texto):
        return ""
    texto = str(texto).lower().strip()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")  # quita acentos
    return texto

# Crear columnas normalizadas
df_frutas_verduras_temp['nombre'] = df_frutas_verduras_temp['nombre'].apply(normalizar)
df_ventas_perecederos['product_name'] = df_ventas_perecederos['product_name'].apply(normalizar)

#De todas las frutas y verduras las busca en el dataFrame de ventas para poder asignar el inicio y final de la temporada
for _, row in df_frutas_verduras_temp.iterrows():
    nombre = row['nombre'] 

    # Buscar los product_name que contengan ese nombre
    mask = df_ventas_perecederos['product_name'].str.contains(nombre, na=False)

    # Asignar inicio y fin de temporada
    df_ventas_perecederos.loc[mask, 'temp_inicio_mes'] = row['temporada_pico_inicio']
    df_ventas_perecederos.loc[mask, 'temp_fin_mes']    = row['temporada_pico_fin']
    
#Calcula si un producto está en temporada según el mes de la venta y los meses de inicio y fin de su temporada.
df_ventas_perecederos['fecha'] = pd.to_datetime(df_ventas_perecederos['fecha'])
mes = df_ventas_perecederos['fecha'].dt.month
ini = df_ventas_perecederos['temp_inicio_mes']
fin = df_ventas_perecederos['temp_fin_mes']

#temporada normal (inicio <= fin)
caso_1 = (ini <= fin) & (mes >= ini) & (mes <= fin)

#temporada que cruza año (inicio > fin)
caso_2 = (ini > fin) & ((mes >= ini) | (mes <= fin))

df_ventas_perecederos['en_temporada'] = 0
df_ventas_perecederos.loc[caso_1 | caso_2, 'en_temporada'] = 1


'''
Debido a que hay productos disponibles todo el año (del mes 1 al 12),
la temporada de inicio y la temporada de fin aparecen con valores nulos.
Para garantizar que estos productos sean considerados como disponibles
durante cualquier mes, se asignan valores por defecto:
- temp_inicio_mes = 1  (enero)
- temp_fin_mes   = 12 (diciembre)
'''
df_ventas_perecederos['temp_inicio_mes'] = df_ventas_perecederos['temp_inicio_mes'].fillna(1)
df_ventas_perecederos['temp_fin_mes'] = df_ventas_perecederos['temp_fin_mes'].fillna(12)


#Calcula si un producto está en temporada según el mes de la venta y los meses de inicio y fin de su temporada. 

df_ventas_perecederos['fecha'] = pd.to_datetime(df_ventas_perecederos['fecha'])
mes = df_ventas_perecederos['fecha'].dt.month
ini = df_ventas_perecederos['temp_inicio_mes']
fin = df_ventas_perecederos['temp_fin_mes']

#temporada normal (inicio <= fin)
caso_1 = (ini <= fin) & (mes >= ini) & (mes <= fin)

#temporada que cruza año (inicio > fin)
caso_2 = (ini > fin) & ((mes >= ini) | (mes <= fin))

df_ventas_perecederos['en_temporada'] = 0
df_ventas_perecederos.loc[caso_1 | caso_2, 'en_temporada'] = 1

df_ventas_perecederos.to_csv(DATA_DIR/ "datasets_procesados" /'ventas_normalizado.csv')
