import React from "react";

const MatrizModificada = ({ matrix, nodeNames, matrizAsignacion, originalMatrix }) => {
    // Verificar si nodeNames es un objeto con las propiedades fromNodes y toNodes
    if (!nodeNames || !nodeNames.fromNodes || !nodeNames.toNodes) {
        return <div></div>;
    }

    return (
        <div className="matriz-adyacencia">
            <h3>Matriz resultante</h3>
            <table>
                <thead>
                    <tr>
                        <th></th> {/* Celda vacía para la esquina superior izquierda */}
                        {nodeNames.toNodes.map((toNode, index) => (
                            <th key={index}>{toNode}</th> // Encabezados de las columnas (nodos 'to')
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {matrix.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            <th>{nodeNames.fromNodes[rowIndex]}</th> {/* Encabezado de la fila (nodo 'from') */}
                            {row.map((cell, colIndex) => {
                                // Verificamos si esta celda es parte de la asignación óptima
                                const isHighlighted = matrizAsignacion[rowIndex][colIndex] === 1;
                                // Verificamos si en la matriz original hay un cero en la misma posición
                                const isZeroInOriginal = originalMatrix[rowIndex][colIndex] === 0;

                                return (
                                    <td
                                        key={colIndex}
                                        style={{
                                            backgroundColor: isHighlighted ? 'yellow' : isZeroInOriginal ? 'green' : 'transparent', // Si es parte de la asignación, se resalta
                                            padding: '10px',
                                            border: '1px solid black',
                                        }}
                                    >
                                        {cell}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MatrizModificada;