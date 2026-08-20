export const aplicarMetodoHungaro = (matriz, isMax) => {
    let costMatrix = matriz.map(row => [...row]);
    const n = costMatrix.length;

    if (isMax) {
        const maxVal = Math.max(...costMatrix.flat());
        costMatrix = costMatrix.map(row => row.map(val => maxVal - val));
    }

    // Paso 1: Restar mínimo de cada fila
    for (let i = 0; i < n; i++) {
        const minRow = Math.min(...costMatrix[i]);
        costMatrix[i] = costMatrix[i].map(val => val - minRow);
    }

    // Paso 2: Restar mínimo de cada columna
    for (let j = 0; j < n; j++) {
        const minCol = Math.min(...costMatrix.map(row => row[j]));
        for (let i = 0; i < n; i++) {
            costMatrix[i][j] -= minCol;
        }
    }

    const findMaxMatching = (matrix) => {
        const zeroPositions = matrix.map(row => 
            row.map((val, j) => val === 0 ? j : -1).filter(j => j !== -1)
        );
        
        const matchRow = new Array(n).fill(-1);
        const matchCol = new Array(n).fill(-1);
        
        const dfs = (u, visited) => {
            for (const v of zeroPositions[u]) {
                if (!visited[v]) {
                    visited[v] = true;
                    if (matchCol[v] === -1 || dfs(matchCol[v], visited)) {
                        matchRow[u] = v;
                        matchCol[v] = u;
                        return true;
                    }
                }
            }
            return false;
        };

        for (let u = 0; u < n; u++) {
            dfs(u, new Array(n).fill(false));
        }

        const maxMatching = [];
        for (let i = 0; i < n; i++) {
            if (matchRow[i] !== -1) {
                maxMatching.push([i, matchRow[i]]);
            }
        }

        return { matchRow, matchCol, maxMatching };
    };

    const findVertexCover = (matrix, matchRow, matchCol) => {
        const rowVisited = new Array(n).fill(false);
        const colVisited = new Array(n).fill(false);
        const queue = [];

        // Filas expuestas (no emparejadas)
        for (let i = 0; i < n; i++) {
            if (matchRow[i] === -1) {
                queue.push({ type: 'row', index: i });
                rowVisited[i] = true;
            }
        }

        // BFS para nodos alcanzables
        while (queue.length > 0) {
            const node = queue.shift();
            if (node.type === 'row') {
                const i = node.index;
                for (let j = 0; j < n; j++) {
                    if (matrix[i][j] === 0 && matchRow[i] !== j && !colVisited[j]) {
                        colVisited[j] = true;
                        queue.push({ type: 'col', index: j });
                    }
                }
            } else {
                const j = node.index;
                const i = matchCol[j];
                if (i !== -1 && !rowVisited[i]) {
                    rowVisited[i] = true;
                    queue.push({ type: 'row', index: i });
                }
            }
        }

        // Construir cobertura
        const rows = [];
        const cols = [];
        for (let i = 0; i < n; i++) {
            if (!rowVisited[i]) rows.push(i);
        }
        for (let j = 0; j < n; j++) {
            if (colVisited[j]) cols.push(j);
        }

        return { rows, cols };
    };

    let assignment = new Array(n).fill(-1);
    let steps = 0;

    while (true) {
        // Corregido: capturar matchCol desde findMaxMatching
        const { matchRow, matchCol, maxMatching } = findMaxMatching(costMatrix);
        if (maxMatching.length === n) {
            assignment = matchRow;
            break;
        }

        // Corregido: pasar matchCol real
        const vertexCover = findVertexCover(costMatrix, matchRow, matchCol);
        
        let minUncovered = Infinity;
        for (let i = 0; i < n; i++) {
            if (!vertexCover.rows.includes(i)) {
                for (let j = 0; j < n; j++) {
                    if (!vertexCover.cols.includes(j)) {
                        if (costMatrix[i][j] < minUncovered) {
                            minUncovered = costMatrix[i][j];
                        }
                    }
                }
            }
        }

        // Ajustar la matriz
        for (let i = 0; i < n; i++) {
            if (!vertexCover.rows.includes(i)) {
                for (let j = 0; j < n; j++) {
                    costMatrix[i][j] -= minUncovered;
                }
            }
        }

        for (let j = 0; j < n; j++) {
            if (vertexCover.cols.includes(j)) {
                for (let i = 0; i < n; i++) {
                    costMatrix[i][j] += minUncovered;
                }
            }
        }

        if (steps++ > 100) break; // Prevenir bucle
    }

    let costo = 0;
    const matrizAsignacion = new Array(n).fill().map(() => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        const j = assignment[i];
        if (j !== -1) {
            costo += matriz[i][j];
            matrizAsignacion[i][j] = 1;
        }
    }

    return {
        matrizAsignacion: matrizAsignacion,
        costo: costo,
        matrizModificada: costMatrix,
    };
};