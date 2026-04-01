import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib
from pathlib import Path
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.metrics import confusion_matrix, classification_report


#Apertura del dataset
df = pd.read_json('../../Datos/datasets_originales/shelflife.json')

#Preparando el dataset para hacer la clasificacion 
df_clasificado = df.copy()
columnas_usar = ['product_name', 'category_off', 'shelf_life_pantry_days', 'shelf_life_fridge_days', 'shelf_life_freezer_days']
df_clasificado = df_clasificado[columnas_usar]

#Rellenar los valores null con ceros
columnas_numericas = ['shelf_life_pantry_days', 'shelf_life_fridge_days', 'shelf_life_freezer_days']
df_clasificado[columnas_usar] = df_clasificado[columnas_usar].fillna(0)

# Clasificacion en perecedero = 1 o no_perecedero = 0

def clasificar_perecedero(fila):
    """
    Clasifica un producto como perecedero (1) o no perecedero (0) según su categoría y vida útil.

    Evalúa si un producto pertenece a una categoría no perecedera o si requiere refrigeración/
    congelación. También se considera perecedero si su vida útil en despensa es muy corta.

    Args:
        fila (pd.Series): Fila del DataFrame con información del producto. Debe contener las siguientes columnas:
            - 'category_off' (str): Categoría del producto.
            - 'shelf_life_fridge_days' (int): Días de vida útil si se guarda en refrigeración.
            - 'shelf_life_freezer_days' (int): Días de vida útil si se guarda en congelación.
            - 'shelf_life_pantry_days' (int): Días de vida útil si se guarda en despensa.

    Returns:
        int: 1 si el producto es perecedero, 0 si no lo es.
    """
    
    categorias_no_perecederas = [
        'juice-box', 'canned-fish', 'beans-dry', 'sugar-white', 'salt',
        'soft-drinks', 'tea-bags', 'oil-vegetable', 'chips', 'rice-white-dry',
        'pasta-dry', 'canned-tomato', 'canned-meat', 'cookies', 'cereal-box',
        'coffee-ground', 'milk-uht', 'bottled-water', 'salsa-jarred',
        'toothpaste', 'shampoo', 'household-detergent'
    ]

    # Si pertenece a una categoría no perecedera 0
    if fila['category_off'] in categorias_no_perecederas:
        return 0
    # Si requiere de estar en un ambiente frio es 1
    elif (fila['shelf_life_fridge_days'] > 0 or fila['shelf_life_freezer_days'] > 0):
        return 1  # Perecedero (Se beneficia del frío)

    #El producto no va en frío pero su vida útil en despensa es muy corta
    elif fila['shelf_life_pantry_days'] < 20:
        return 1  # Perecedero por vida util muy corta
    else:
        return 0

# Aplicar la clasificación
df_clasificado['perecedero'] = df.apply(clasificar_perecedero, axis=1)
df_clasificado.to_csv("../../Datos/datasets_procesados/productos_clasificados.csv")

df_clasificado = pd.read_csv('../../Datos/datasets_procesados/productos_clasificados.csv')


X = df_clasificado[['category_off', 'shelf_life_pantry_days', 'shelf_life_fridge_days', 'shelf_life_freezer_days']]
y = df_clasificado['perecedero']

# Conversion de categorias a numeros para que el modelo pueda ejecutar el algoritmo
encoder = LabelEncoder()
X['category_off'] = encoder.fit_transform(X['category_off'])

# Separar los datos para entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# Entrenar modelo
modelo = RandomForestClassifier(n_estimators=500, random_state=42)
modelo.fit(X_train, y_train)

# Evaluar modelo
score = modelo.score(X_test, y_test)
print(f"Precisión: {score:.2f}")

#Matriz de confusion
y_pred = modelo.predict(X_test)

#Generacion de la matriz
matriz_confusion = confusion_matrix(y_test, y_pred)
print('Matriz de confusin :')
print(matriz_confusion)

#Haciendo pruebas del modelo con datos nnunca vistos (completamnete nuevos)

# Los nuevos productos
productos_nuevos = [
    ["Plátano tabasco 1 kg", "fruit-fresh", 5, 0, 0],
    ["Tomate saladet 1 kg", "vegetable-fresh", 4, 0, 0],
    ["Limón agrio 1 kg", "fruit-fresh", 7, 0, 0],
    ["Aguacate hass 1 kg", "fruit-fresh", 3, 0, 0],
    ["Pan dulce 1 pza", "bakery-fresh", 3, 0, 0],
    ["Tortillas de maíz 1 kg", "tortilla", 5, 10, 30],
    ["Jamón de pavo 250 g", "meat-processed", 0, 10, 60],
    ["Yogur de fresa 1L", "yogurt", 0, 15, 0],
    ["Queso panela 400 g", "cheese-soft", 0, 14, 90],
    ["Refresco de cola 600 ml", "soda", 365, 0, 0],
    ["Aceite vegetal 1L", "oil-vegetable", 730, 0, 0],
    ["Café molido 250 g", "coffee-ground", 540, 0, 0],
    ["Sal yodada 1 kg", "salt", 1825, 0, 0],
    ["Harina de trigo 1 kg", "flour", 365, 0, 0],
    ["Frijol negro 1 kg", "beans-dry", 365, 0, 0],
    ["Pollo entero crudo 1 kg", "meat-raw", 0, 5, 180],
    ["Pescado mojarra 1 kg", "fish-fresh", 0, 3, 150],
    ["Atún enlatado 140 g", "canned-fish", 720, 0, 0],
    ["Cereal de maíz 500 g", "cereal", 365, 0, 0],
    ["Mantequilla 200 g", "butter", 0, 90, 180],
]

df_nuevos = pd.DataFrame(productos_nuevos, columns=[
    "product_name", "category_off", "shelf_life_pantry_days",
    "shelf_life_fridge_days", "shelf_life_freezer_days"
])

X_nuevos = df_nuevos[['category_off', 'shelf_life_pantry_days', 'shelf_life_fridge_days', 'shelf_life_freezer_days']]

X_nuevos['category_off'] = encoder.fit_transform(X_nuevos['category_off'])

predicciones = modelo.predict(X_nuevos)
df_nuevos['perecedero_prediccion'] = predicciones

# Agregar las etiquetas reales
etiquetas_reales = [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,0,0,1]
df_nuevos['perecedero_real'] = etiquetas_reales

# Comparar
df_nuevos['acierto'] = df_nuevos['perecedero_prediccion'] == df_nuevos['perecedero_real']

# Calcular precision con productos nuevos
precision_nuevos = df_nuevos['acierto'].mean()
print(f"Precisión con productos nuevos: {precision_nuevos:.2f}")

df_nuevos_guardar = df_nuevos[['product_name', 'category_off', 'shelf_life_pantry_days', 'shelf_life_fridge_days', 'shelf_life_freezer_days', 'perecedero_real']]
ultimo_indice = pd.read_csv('../../Datos/datasets_procesados/productos_clasificados.csv', usecols=['Unnamed: 0']).iloc[-1, 0]
df_nuevos_guardar.index = range(ultimo_indice + 1, ultimo_indice + 1 + len(df_nuevos))
df_nuevos_guardar.to_csv('../../Datos/datasets_procesados/productos_clasificados.csv', mode='a', header=False, index=True)

df_nuevos.head(20)


#En esta seccion se guardan los modelos ya entrenados
# Directorio de este script
BASE_DIR = Path.cwd()

# Subir un nivel y entrar a Modelos/
MODELS_DIR = BASE_DIR.parent / ".." / "Modelos"

# Crear carpeta si no existe
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Guardar modelo y encoder
joblib.dump(modelo, MODELS_DIR / "perecedero_rf.pkl")
joblib.dump(encoder, MODELS_DIR / "category_encoder.pkl")