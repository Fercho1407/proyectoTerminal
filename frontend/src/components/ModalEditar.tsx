import { useState } from "react";

interface Product {
  id: number;
  product_name: string;
  category_off: string;
  shelf_life_pantry_days: number;
  shelf_life_fridge_days: number;
  shelf_life_freezer_days: number;
  perecedero: number;
}

interface ModalEditarProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
}

export const ModalEditar = ({ product, onClose, onSave }: ModalEditarProps) => {
  const [formData, setFormData] = useState<Product>({ ...product });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" role="dialog" aria-modal="true">
        <button className="modal-closeBtn" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className="modal-header">
          <h2 className="modal-title">Editar producto</h2>
          <p className="modal-subtitle">Actualiza los campos y guarda los cambios.</p>
        </div>

        <div className="modal-form">
          <div className="field">
            <label className="field-label">Nombre</label>
            <input
              className="field-input"
              name="product_name"
              type="text"
              value={formData.product_name}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="field-label">Categoría</label>
            <input
              className="field-input"
              name="category_off"
              type="text"
              value={formData.category_off}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="field-label">Vida útil en Despensa</label>
            <input
              className="field-input"
              name="shelf_life_pantry_days"
              type="number"
              min={0}
              step={1}
              value={formData.shelf_life_pantry_days}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="field-label">Vida útil en Refrigeración</label>
            <input
              className="field-input"
              name="shelf_life_fridge_days"
              type="number"
              min={0}
              step={1}
              value={formData.shelf_life_fridge_days}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="field-label">Vida útil en Congelador</label>
            <input
              className="field-input"
              name="shelf_life_freezer_days"
              type="number"
              min={0}
              step={1}
              value={formData.shelf_life_freezer_days}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="json-preview">
          <div className="json-head">
            <span className="json-title">Preview JSON</span>
            <span className="muted">Solo lectura</span>
          </div>
          <pre className="json-pre">{JSON.stringify(formData, null, 2)}</pre>
        </div>

        <div className="modal-actions">
          <button className="btn btn-plain" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={() => onSave(formData)}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
