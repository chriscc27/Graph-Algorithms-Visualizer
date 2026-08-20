import React from "react";

const MatrizAsignacion = ({ matrix, nodeNames, matrizAsignacion }) => {
    // Verificar si nodeNames es un objeto con las propiedades fromNodes y toNodes
    if (!nodeNames || !nodeNames.fromNodes || !nodeNames.toNodes) {
        return <div></div>;
    }

    // Verificar si matrizAsignacion está definida y tiene las dimensiones correctas
    if (!matrizAsignacion || matrizAsignacion.length !== matrix.length || matrizAsignacion[0].length !== matrix[0].length) {
        
        return <div></div>;
    }

    return (
        <div className="matriz-adyacencia">
            <h1>Matriz sin ceros</h1>
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

                                return (
                                    <td
                                        key={colIndex}
                                        style={{
                                            backgroundColor: isHighlighted ? 'green' : 'transparent', // Si es parte de la asignación, se resalta en verde
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

export default MatrizAsignacion;