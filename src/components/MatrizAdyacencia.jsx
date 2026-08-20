import React from "react";
import "../styles/MatrizAdyacencia.css"; // Asegúrate de que la ruta sea correcta

const MatrizAdyacencia = ({ matrix, nodeNames }) => {
  if (!matrix || matrix.length === 0 || !nodeNames || nodeNames.length === 0) {
    return <div>No hay datos para mostrar.</div>;
  }

  // Calcular las sumas de las filas (conversión explícita a número)
  const rowSums = matrix.map(row =>
    row.reduce((sum, value) => sum + Number(value), 0)
  );

  // Calcular las sumas de las columnas (conversión explícita a número)
  const colSums = matrix[0].map((_, colIndex) =>
    matrix.reduce((sum, row) => sum + Number(row[colIndex]), 0)
  );

  return (
    <div className="matriz-adyacencia-container">
      <h3>Matriz de Adyacencia</h3>
      <table>
        <thead>
          <tr>
            <th></th>
            {nodeNames.map((name, index) => (
              <th key={index}>{name}</th>
            ))}
            <th>Total</th> {/* Columna para la suma de filas */}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th>{nodeNames[rowIndex]}</th>
              {row.map((value, colIndex) => (
                <td key={colIndex}>{value}</td>
              ))}
              <td>{rowSums[rowIndex]}</td> {/* Suma de la fila */}
            </tr>
          ))}
          <tr>
            <th>Total</th> {/* Fila para la suma de columnas */}
            {colSums.map((sum, index) => (
              <td key={index}>{sum}</td>
            ))}
            <td>{colSums.reduce((total, sum) => total + sum, 0)}</td> {/* Suma total */}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MatrizAdyacencia;
