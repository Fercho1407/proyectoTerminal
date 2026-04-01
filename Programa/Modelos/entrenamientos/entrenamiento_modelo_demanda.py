import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import unicodedata
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from datetime import timedelta, datetime
import joblib
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# Ruta base de los datasets
DATA_DIR = Path("../../Datos") 

# Cargar ventas y eventos
df_ventas = pd.read_csv(DATA_DIR / "datasets_procesados" /"ventas_normalizado.csv")
df_eventos = pd.read_csv(DATA_DIR / "eventos" /"eventos_productos.csv")

def normalize_text(texto: str) -> str:
    """
    Deja el texto en minúsculas, sin acentos y sin espacios duplicados.
    """
    if pd.isna(texto):
        return ""
    texto = str(texto).lower().strip()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = " ".join(texto.split())
    return texto

# Asegurar tipos de fecha
df_ventas["fecha"] = pd.to_datetime(df_ventas["fecha"])
df_eventos["date"] = pd.to_datetime(df_eventos["date"])

# Claves normalizadas de producto
df_ventas["product_key"] = df_ventas["product_name"].apply(normalize_text)
df_eventos["product_key"] = df_eventos["producto_relacionado"].apply(normalize_text)

# Merge left para marcar eventos por (fecha, producto)
df_eventos_reduc = df_eventos[["event", "date", "product_key"]].drop_duplicates()

df_ventas_evt = df_ventas.merge(
    df_eventos_reduc,
    left_on=["fecha", "product_key"],
    right_on=["date", "product_key"],
    how="left"
)

# hay_evento = 1 si existe un evento para ese producto en esa fecha
df_ventas_evt["hay_evento"] = df_ventas_evt["event"].notna().astype(int)

# Ya no se necesita la columna date del merge
df_ventas_evt = df_ventas_evt.drop(columns=["date"])

ventas = df_ventas_evt.copy()

# Calendario
ventas["anio"] = ventas["fecha"].dt.year
ventas["mes"] = ventas["fecha"].dt.month
ventas["dia"] = ventas["fecha"].dt.day
ventas["dia_semana"] = ventas["fecha"].dt.weekday
ventas["es_fin_semana"] = ventas["dia_semana"].isin([5, 6]).astype(int)

# Codificacion ciclica de mes y día de semana
ventas["mes_sin"] = np.sin(2 * np.pi * ventas["mes"] / 12)
ventas["mes_cos"] = np.cos(2 * np.pi * ventas["mes"] / 12)
ventas["dow_sin"] = np.sin(2 * np.pi * ventas["dia_semana"] / 7)
ventas["dow_cos"] = np.cos(2 * np.pi * ventas["dia_semana"] / 7)

# IDs de producto y categoría
ventas["product_id"], product_uniques = pd.factorize(ventas["product_name"])
ventas["category_id"], category_uniques = pd.factorize(ventas["category_off"])

n_products = len(product_uniques)
n_categories = len(category_uniques)
print("n_products:", n_products, "n_categories:", n_categories)

ventas = ventas.sort_values(["product_id", "fecha"])

ventas = ventas.sort_values(["product_id", "fecha"])

def crear_ventanas(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea variables con información de ventas pasadas para cada producto.

    La función agrega:
    - Ventas de días anteriores (1, 7 y 14 días atrás).
    - Promedios de ventas recientes (7, 28 y 90 días),
      usando solo datos del pasado para no afectar el entrenamiento.

    Estas variables ayudan al modelo a aprender patrones
    como tendencias y comportamientos semanales o mensuales.

    Parámetros:
    df : DataFrame con columnas `product_id` y `ventas`.

    Retorna:
    El mismo DataFrame con nuevas columnas de apoyo para predicción.
    """
    df = df.copy()
    g = df.groupby("product_id")["ventas"]
    df["lag_1"] = g.shift(1)
    df["lag_7"] = g.shift(7)
    df["lag_14"] = g.shift(14)
    df["media_7"] = g.shift(1).rolling(7).mean()
    df["media_28"] = g.shift(1).rolling(28).mean()
    df["media_90"] = g.shift(1).rolling(90).mean()
    return df

ventas = crear_ventanas(ventas)

# Eliminar filas sin historial suficiente
ventas_modelo = ventas.dropna(subset=[
    "lag_1", "lag_7", "lag_14",
    "media_7", "media_28", "media_90"
]).copy()

fecha_corte_test = pd.to_datetime("2025-06-01")
VAL_DAYS = 60
fecha_inicio_val = fecha_corte_test - pd.Timedelta(days=VAL_DAYS)

mask_train = ventas_modelo["fecha"] < fecha_inicio_val
mask_val   = (ventas_modelo["fecha"] >= fecha_inicio_val) & (ventas_modelo["fecha"] < fecha_corte_test)
mask_test  = ventas_modelo["fecha"] >= fecha_corte_test

df_train = ventas_modelo.loc[mask_train].copy()
df_val   = ventas_modelo.loc[mask_val].copy()
df_test  = ventas_modelo.loc[mask_test].copy()

features = [
    "product_id", "category_id", "perecedero",
    "precio", "en_temporada", "hay_evento",
    "anio", "mes", "dia_semana", "es_fin_semana",
    "mes_sin", "mes_cos", "dow_sin", "dow_cos",
    "lag_1", "lag_7", "lag_14", "media_7", "media_28", "media_90"
]
target_col = "ventas"

# Asegurar numérico básico
for c in features:
    df_train[c] = pd.to_numeric(df_train[c], errors="coerce")
    df_val[c]   = pd.to_numeric(df_val[c], errors="coerce")
    df_test[c]  = pd.to_numeric(df_test[c], errors="coerce")

df_train[target_col] = pd.to_numeric(df_train[target_col], errors="coerce")
df_val[target_col]   = pd.to_numeric(df_val[target_col], errors="coerce")
df_test[target_col]  = pd.to_numeric(df_test[target_col], errors="coerce")

# Quitar filas con NaN en lo necesario
df_train = df_train.dropna(subset=features + [target_col])
df_val   = df_val.dropna(subset=features + [target_col])
df_test  = df_test.dropna(subset=features + [target_col])

X_train = df_train[features].astype("float32").to_numpy()
X_val   = df_val[features].astype("float32").to_numpy()
X_test  = df_test[features].astype("float32").to_numpy()

y_train = df_train[target_col].astype("float32").to_numpy()
y_val   = df_val[target_col].astype("float32").to_numpy()
y_test  = df_test[target_col].astype("float32").to_numpy()

# Escalar tod menos los id's (product_id y category_id)
id_idx = [features.index("product_id"), features.index("category_id")]
num_idx = [i for i in range(len(features)) if i not in id_idx]

scaler = StandardScaler()
X_train[:, num_idx] = scaler.fit_transform(X_train[:, num_idx])
X_val[:, num_idx]   = scaler.transform(X_val[:, num_idx])
X_test[:, num_idx]  = scaler.transform(X_test[:, num_idx])

# Target en log
y_train_t = np.log1p(y_train)
y_val_t   = np.log1p(y_val)
y_test_t  = np.log1p(y_test)

input_dim = X_train.shape[1]

model = keras.Sequential([
    layers.Input(shape=(input_dim,)),
    layers.Dense(256, activation="relu"),
    layers.Dropout(0.25),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.25),
    layers.Dense(64, activation="relu"),
    layers.Dense(1)
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=3e-4),
    loss=keras.losses.Huber(delta=0.5),
    metrics=["mae"]
)

model.summary()

callbacks = [
    keras.callbacks.EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True),
    keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6, verbose=1),
]

history = model.fit(
    X_train, y_train_t,
    validation_data=(X_val, y_val_t),
    epochs=200,
    batch_size=256,
    callbacks=callbacks,
    verbose=1
)

# 1. Predicción y transformación inversa
y_pred_log = model.predict(X_test, verbose=0).ravel()
y_pred = np.expm1(y_pred_log)

# Evitar predicciones negativas
y_pred = np.clip(y_pred, 0, None)

# 2. Métricas Base (Unidades absolutas)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

# 3. WAPE (Weighted Absolute Percentage Error)
suma_errores = np.sum(np.abs(y_test - y_pred))
suma_ventas_reales = np.sum(y_test)
wape = suma_errores / suma_ventas_reales if suma_ventas_reales != 0 else 0

# 4. sMAPE (Symmetric Mean Absolute Percentage Error)
denominador_smape = (np.abs(y_test) + np.abs(y_pred)) / 2.0
# Máscara para evitar división por cero cuando tanto predicción como real son 0
smape_mask = denominador_smape != 0
smape = np.mean(np.abs(y_test[smape_mask] - y_pred[smape_mask]) / denominador_smape[smape_mask])

# 5. R2 Score (Coeficiente de determinación)
r2 = r2_score(y_test, y_pred)

print(f"MAE (Error Promedio)          : {mae:.4f} unidades")
print(f"RMSE (Penalización atípicos)  : {rmse:.4f} unidades")
print(f"WAPE (Error Porcentual Global): {wape * 100:.2f}%")
print(f"sMAPE (Error Simétrico)       : {smape * 100:.2f}%")
print(f"R2 Score                      : {r2:.4f}")

# Carpeta destino de modelos
OUT_DIR = Path("../")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 1) Guardar modelo Keras (recomendado .keras)
model_path = OUT_DIR / "nn_sales_model.keras"
model.save(model_path)

# 2) Guardar scaler
scaler_path = OUT_DIR / "scaler.joblib"
joblib.dump(scaler, scaler_path)

# 3) Guardar metadata necesaria para inferencia
meta = {
    "features": features,
    "target_col": target_col,
    "id_idx": id_idx,
    "num_idx": num_idx,
    "product_uniques": list(product_uniques),   
    "category_uniques": list(category_uniques), 
}

meta_path = OUT_DIR / "meta.joblib"
joblib.dump(meta, meta_path)