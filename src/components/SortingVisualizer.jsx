import { useState, useCallback, useEffect, useRef } from 'react';
import '../styles/SortingVisualizer.css';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

// Configuración de audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const playTone = (frequency = 440, duration = 0.1) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

const SortingVisualizer = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  const askSortOrder = async () => {
    const { value: order } = await Swal.fire({
      title: 'Seleccionar orden',
      input: 'select',
      inputOptions: {
        asc: 'Ascendente (menor a mayor)',
        desc: 'Descendente (mayor a menor)'
      },
      inputPlaceholder: 'Seleccione el orden',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    });
    return order;
  };
  // Función para iniciar el cronómetro
  const startTimer = () => {
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  // Función para detener el cronómetro
  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const resetBarColors = () => {
    setTimeout(() => {
      const bars = document.getElementsByClassName('array-bar');
      for (let bar of bars) {
        bar.style.backgroundColor = '#4a90e2';
        bar.classList.remove('sorted');
      }
    }, 0);
  };

  const handleGenerateArray = useCallback(async () => {
    stopTimer();
    setElapsedTime(0);
    // Pedir tamaño del array
    const { value: size } = await Swal.fire({
      title: 'Tamaño del array',
      input: 'number',
      inputLabel: 'Ingrese la cantidad de elementos',
      inputAttributes: {
        min: 2,
        max: 70,
        step: 1
      },
      inputValue: 20,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debe ingresar un número!';
        const numericValue = Number(value);
        if (isNaN(numericValue)) return 'Debe ser un número válido';
        if (numericValue < 2) return 'El tamaño debe ser mayor a 1';
        return null;
      }
    });

    if (!size) return;

    // Pedir método de generación
    const { value: method } = await Swal.fire({
      title: 'Método de creación',
      input: 'select',
      inputOptions: {
        random: 'Generación Aleatoria',
        manual: 'Ingreso Manual'
      },
      inputPlaceholder: 'Seleccione método',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    });

    if (!method) return;



    if (method === 'random') {
      const newArray = Array.from({ length: size }, () =>
        Math.floor(Math.random() * 999) + 1
      );
      setArray(newArray);
      resetBarColors();
    } else {
      let values = [];
      let currentIndex = 0;

      while (currentIndex < size) {
        const { value: number } = await Swal.fire({
          title: `Ingrese el valor ${currentIndex + 1} de ${size}`,
          input: 'number',
          inputAttributes: {
            min: 1,
            max: 1000,
            step: 1
          },
          showCancelButton: true,
          confirmButtonText: 'Agregar',
          cancelButtonText: 'Cancelar',
          allowOutsideClick: false,
          inputValidator: (value) => {
            if (value === "" || value === null) return 'Debe ingresar un número!';
            if (isNaN(value)) return 'Solo números válidos!';
            if (value < 1 || value > 1000) return 'Entre 1 y 1000!';
          }
        });

        if (number === undefined) {
          const { isConfirmed } = await Swal.fire({
            title: '¿Cancelar ingreso manual?',
            text: 'Se generará un array aleatorio',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'Continuar ingresando'
          });

          if (isConfirmed) {
            // Generar array aleatorio si confirma cancelación
            const newArray = Array.from({ length: size }, () =>
              Math.floor(Math.random() * 999) + 1
            );
            setArray(newArray);
            resetBarColors();
            break;
          } else {
            currentIndex--; // Permite corregir el valor anterior
            continue;
          }
        }

        values.push(Number(number));
        currentIndex++;
      }

      if (values.length == size) {
        setArray(values);
        resetBarColors();
      } else {
        const newArray = Array.from({ length: size }, () =>
          Math.floor(Math.random() * 999) + 1
        );
        setArray(newArray);
        resetBarColors();
      }
    }
  }, []);

  // Modificación en sleep para incluir sonido
  const sleep = async (ms, frequency) => {
    if (frequency) playTone(frequency);
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Algoritmo Shell Sort
  const shellSort = async (order = 'asc') => {
    resetBarColors();
    setSorting(true);
    startTimer(); // Iniciar cronómetro
    // Pedir el gap inicial
    const { value: gapInput } = await Swal.fire({
      title: 'Seleccionar distancia (gap)',
      input: 'number',
      inputLabel: 'Ingrese el gap inicial (≥1)',
      inputAttributes: {
        min: 1,
        max: array.length,
        step: 1
      },
      inputValue: Math.floor(array.length / 2),
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debe ingresar un número!';
        if (value < 1 || value > array.length) return `El gap debe estar entre 1 y ${array.length}`;
      }
    });

    if (!gapInput) return;

    setSorting(true);
    const startTime = performance.now();
    let steps = 0;
    const arr = [...array];
    const len = arr.length;
    let gap = Math.min(parseInt(gapInput), len);

    while (gap > 0) {
      for (let i = gap; i < len; i++) {
        const temp = arr[i];
        let j = i;

        // Obtener elementos DOM
        const currentBar = document.getElementsByClassName('array-bar')[j];
        const compareBar = document.getElementsByClassName('array-bar')[j - gap];

        while (j >= gap && (
          order === 'asc' ? arr[j - gap] > temp : arr[j - gap] < temp
        )) {
          // Resaltar barras
          currentBar.style.backgroundColor = 'red';
          compareBar.style.backgroundColor = 'red';
          await sleep(100, 500 + (arr[j] * 5)); // Sonido durante comparación

          steps++;
          arr[j] = arr[j - gap];
          setArray([...arr]);

          // Restaurar colores
          currentBar.style.backgroundColor = '#4a90e2';
          compareBar.style.backgroundColor = '#4a90e2';

          j -= gap;

          await sleep(100, 600 + (arr[j] * 5));
        }

        arr[j] = temp;
        setArray([...arr]);

        // Resaltar la posición final
        const finalBar = document.getElementsByClassName('array-bar')[j];
        finalBar.style.backgroundColor = 'red';
        await sleep(50, 800 + (temp * 5));
        finalBar.style.backgroundColor = '#4a90e2';
      }

      gap = Math.floor(gap / 2);
    }

    const endTime = performance.now();
    const timeTaken = (endTime - startTime).toFixed(2);
    setSorting(false);
    stopTimer(); // Detener cronómetro al finalizar
    setSorting(false);


    // Efecto final de barras verdes
    const bars = document.getElementsByClassName('array-bar');
    for (let bar of bars) {
      bar.style.backgroundColor = '#00ff00';
      playTone(300 + (bar.clientHeight * 2), 0.3);
      await sleep(50);
    }





    await Swal.fire({
      title: 'Shell Sort completado',
      html: `Tiempo: ${timeTaken} ms<br>Pasos: ${steps}<br>Gap final: ${gap}`,
      icon: 'success'
    });

  };

  // Función para desordenar el array
  const shuffleArray = () => {
    stopTimer();
    setElapsedTime(0);
    const bars = document.getElementsByClassName('array-bar');
    for (let bar of bars) bar.style.backgroundColor = '#4a90e2';
    const shuffledArray = [...array].sort(() => Math.random() - 0.5);
    setArray(shuffledArray);
  };


  // Función para verificar si el array está ordenado
  const isArraySorted = (order) => {
    if (order === 'asc') {
      for (let i = 0; i < array.length - 1; i++) {
        if (array[i] > array[i + 1]) return false;
      }
    } else {
      for (let i = 0; i < array.length - 1; i++) {
        if (array[i] < array[i + 1]) return false;
      }
    }
    return true;
  };

  // Handlers para los botones
  const handleShellSort = async () => {
    const order = await askSortOrder();
    if (!order) return;

    if (isArraySorted(order)) {
      await Swal.fire('El array ya está ordenado', '', 'info');
      return;
    }

    await shellSort(order);
  };

  const handleQuickSort = async () => {
    const order = await askSortOrder();
    if (!order) return;

    if (isArraySorted(order)) {
      await Swal.fire('El array ya está ordenado', '', 'info');
      return;
    }

    await quickSort(order);
  };

  // Handlers para redimensionamiento
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth > 100 && newWidth < 500) {
          setLeftPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => setIsResizingLeft(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingLeft]);

  // Función generadora para Merge Sort
  function* mergeSortGenerator(arr, order, l = 0, r = arr.length - 1) {
    if (l >= r) return;
    const m = l + Math.floor((r - l) / 2);
    yield* mergeSortGenerator(arr, order, l, m);
    yield* mergeSortGenerator(arr, order, m + 1, r);
    yield* merge(arr, order, l, m, r);
  }

  function* merge(arr, order, l, m, r) {
    const n1 = m - l + 1;
    const n2 = r - m;
    const L = new Array(n1);
    const R = new Array(n2);

    for (let i = 0; i < n1; i++) L[i] = arr[l + i];
    for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

    let i = 0, j = 0, k = l;

    while (i < n1 && j < n2) {
      const leftIndex = l + i;
      const rightIndex = m + 1 + j;
      yield { array: [...arr], comparing: [leftIndex, rightIndex] };

      if (order === 'asc' ? L[i] <= R[j] : L[i] >= R[j]) {
        arr[k] = L[i];
        i++;
      } else {
        arr[k] = R[j];
        j++;
      }
      yield { array: [...arr], merging: k };
      k++;
    }

    while (i < n1) {
      arr[k] = L[i];
      yield { array: [...arr], merging: k };
      i++;
      k++;
    }

    while (j < n2) {
      arr[k] = R[j];
      yield { array: [...arr], merging: k };
      j++;
      k++;
    }
  }


  // Algoritmo Merge Sort
  const mergeSort = async (order = 'asc') => {
    resetBarColors();
    setSorting(true);
    startTimer(); // Iniciar cronómetro
    setSorting(true);
    const startTime = performance.now();
    let steps = 0;
    const arr = [...array];
    const generator = mergeSortGenerator(arr, order);

    let done = false;
    while (!done) {
      const { value, done: generatorDone } = generator.next();
      done = generatorDone;

      if (!done && value) {
        steps++;

        if (value.comparing) {
          const [left, right] = value.comparing;
          const bars = document.getElementsByClassName('array-bar');

          // Resaltar comparación
          bars[left].style.backgroundColor = 'red';
          bars[right].style.backgroundColor = 'red';
          await sleep(35, 500 + (arr[left] * 5));

          setArray([...value.array]);
          await sleep(35, 600 + (arr[right] * 5));

          // Restaurar colores
          bars[left].style.backgroundColor = '#4a90e2';
          bars[right].style.backgroundColor = '#4a90e2';
        } else if (value.merging !== undefined) {
          const bar = document.getElementsByClassName('array-bar')[value.merging];

          // Resaltar merge
          bar.style.backgroundColor = 'green';
          await sleep(35, 800 + (arr[value.merging] * 5));

          setArray([...value.array]);
          await sleep(35);

          bar.style.backgroundColor = '#4a90e2';
        }
      }
    }

    const endTime = performance.now();
    const timeTaken = (endTime - startTime).toFixed(2);
    setSorting(false);
    stopTimer(); // Detener cronómetro al finalizar
    setSorting(false);

    // Animación final cuando termina
    const bars = document.getElementsByClassName('array-bar');
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.backgroundColor = '#00ff00';
      playTone(300 + (arr[i] * 5), 0.1);
      await sleep(50);
    }

    await Swal.fire({
      title: 'Merge Sort completado',
      html: `Tiempo: ${timeTaken} ms<br>Pasos: ${steps}`,
      icon: 'success'
    });

  };

  const handleSelectionSort = async () => {
    const order = await askSortOrder();
    if (!order) return;

    if (isArraySorted(order)) {
      await Swal.fire('El array ya está ordenado', '', 'info');
      return;
    }

    await selectionSort(order);
  };

  // Algoritmo Selection Sort
  const selectionSort = async (order = 'asc') => {
    resetBarColors();
    setSorting(true);
    startTimer(); // Iniciar cronómetro
    setSorting(true);
    const startTime = performance.now();
    let steps = 0;
    const arr = [...array];
    const len = arr.length;

    for (let i = 0; i < len - 1; i++) {
      let extremeIndex = i;

      // Resaltar la posición inicial
      const initialBar = document.getElementsByClassName('array-bar')[extremeIndex];
      initialBar.style.backgroundColor = 'yellow';
      await sleep(50, 300 + (arr[extremeIndex] * 5));

      for (let j = i + 1; j < len; j++) {
        // Resaltar comparación actual
        const currentBar = document.getElementsByClassName('array-bar')[j];
        const extremeBar = document.getElementsByClassName('array-bar')[extremeIndex];

        currentBar.style.backgroundColor = 'orange';
        extremeBar.style.backgroundColor = 'yellow';
        await sleep(50, 500 + (arr[j] * 5));

        if (order === 'asc' ? arr[j] < arr[extremeIndex] : arr[j] > arr[extremeIndex]) {
          extremeIndex = j;

          // Actualizar barra extrema
          extremeBar.style.backgroundColor = '#4a90e2';
          const newExtremeBar = document.getElementsByClassName('array-bar')[extremeIndex];
          newExtremeBar.style.backgroundColor = 'yellow';
          await sleep(50, 600 + (arr[extremeIndex] * 5));
        }

        // Restaurar color de la barra comparada
        currentBar.style.backgroundColor = '#4a90e2';
      }

      if (extremeIndex !== i) {
        // Resaltar swap
        const barI = document.getElementsByClassName('array-bar')[i];
        const barExtreme = document.getElementsByClassName('array-bar')[extremeIndex];

        barI.style.backgroundColor = 'red';
        barExtreme.style.backgroundColor = 'red';
        await sleep(50, 800 + (arr[i] * 5));

        // Realizar swap
        [arr[i], arr[extremeIndex]] = [arr[extremeIndex], arr[i]];
        steps++;
        setArray([...arr]);

        // Sonido de swap
        playTone(1000 + (arr[extremeIndex] * 10), 0.3);
        await sleep(50);

        // Restaurar colores
        barI.style.backgroundColor = '#4a90e2';
        barExtreme.style.backgroundColor = '#4a90e2';
      } else {
        // Restaurar color si no hay swap
        initialBar.style.backgroundColor = '#4a90e2';
      }
    }

    const endTime = performance.now();
    const timeTaken = (endTime - startTime).toFixed(2);
    setSorting(false);
    stopTimer(); // Detener cronómetro al finalizar
    setSorting(false);

    // Animación final
    const bars = document.getElementsByClassName('array-bar');
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.backgroundColor = '#00ff00';
      playTone(300 + (arr[i] * 5), 0.2);
      await sleep(50);
    }



    await Swal.fire({
      title: 'Selection Sort completado',
      html: `Tiempo: ${timeTaken} ms<br>Pasos: ${steps}`,
      icon: 'success'
    });

  };

  // Handler para Merge Sort
  const handleMergeSort = async () => {
    const order = await askSortOrder();
    if (!order) return;

    if (isArraySorted(order)) {
      await Swal.fire('El array ya está ordenado', '', 'info');
      return;
    }

    await mergeSort(order);
  };

  const insertionSort = async (order = 'asc') => {
    resetBarColors();
    setSorting(true);
    startTimer(); // Iniciar cronómetro
    setSorting(true);
    const startTime = performance.now();
    let steps = 0;
    const arr = [...array];
    const len = arr.length;

    for (let i = 1; i < len; i++) {
      let current = arr[i];
      let j = i - 1;

      while (j >= 0 && (order === 'asc' ? arr[j] > current : arr[j] < current)) {
        const barJ = document.getElementsByClassName('array-bar')[j];
        const barJPlus1 = document.getElementsByClassName('array-bar')[j + 1];

        // Resaltar y sonido de comparación
        barJ.style.backgroundColor = 'red';
        barJPlus1.style.backgroundColor = 'red';
        await sleep(50, 500 + (arr[j] * 5));  // Sonido agudo para comparación

        // Intercambiar valores
        arr[j + 1] = arr[j];
        steps++;
        setArray([...arr]);

        // Sonido de movimiento y restauración de colores
        barJ.style.backgroundColor = '#4a90e2';
        barJPlus1.style.backgroundColor = '#4a90e2';
        await sleep(50, 600 + (current * 5));  // Sonido diferente para movimiento

        j--;
      }

      // Insertar elemento en posición correcta
      arr[j + 1] = current;
      setArray([...arr]);

      // Feedback visual y sonido de inserción
      const insertedBar = document.getElementsByClassName('array-bar')[j + 1];
      insertedBar.style.backgroundColor = 'green';
      await sleep(50, 800 + (current * 10));  // Tono más alto para inserción
      insertedBar.style.backgroundColor = '#4a90e2';
    }

    const endTime = performance.now();
    const timeTaken = (endTime - startTime).toFixed(2);
    setSorting(false);
    stopTimer(); // Detener cronómetro al finalizar
    setSorting(false);

    // Animación final con sonido
    const bars = document.getElementsByClassName('array-bar');
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.backgroundColor = '#00ff00';
      playTone(300 + (arr[i] * 5), 0.2);  // Escala musical ascendente
      await sleep(30);
    }



    await Swal.fire({
      title: 'Insertion Sort completado',
      html: `Tiempo: ${timeTaken} ms<br>Pasos: ${steps}`,
      icon: 'success'
    });

  };
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Formatear el tiempo en formato MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInsertionSort = async () => {
    const order = await askSortOrder();
    if (!order) return;

    if (isArraySorted(order)) {
      await Swal.fire('El array ya está ordenado', '', 'info');
      return;
    }

    await insertionSort(order);
  };

  return (
    <div className="contenedor">
      <motion.div
        className="panel-izquierdo"
        style={{ width: leftPanelWidth }}
        initial="open"
        animate="open"
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="contenido-panel">
          <h3>Métodos de Ordenamiento</h3>

          <button
            className="button frutigeri-button generate-button"
            onClick={handleGenerateArray}
            disabled={sorting}
          >
            🔄 Generar Nuevo Array
          </button>

          <button
            className="button frutigeri-button shuffle-button"
            onClick={shuffleArray}
            disabled={sorting}
          >
            Desordenar Array
          </button>

          <button
            className="button frutigeri-button merge-button"
            onClick={handleMergeSort}
            disabled={sorting}
          >
            Merge Sort
          </button>

          <button
            className="button frutigeri-button shell-button"
            onClick={handleShellSort}
            disabled={sorting}
          >
            Shell Sort
          </button>



          <button
            className="button frutigeri-button insertion-button"
            onClick={handleInsertionSort}
            disabled={sorting}
          >
            Insertion Sort
          </button>
          <button
            className="button frutigeri-button selection-button"
            onClick={handleSelectionSort}
            disabled={sorting}
          >
            Selection Sort
          </button>


        </div>

        <div
          className="resize-handle"
          onMouseDown={() => setIsResizingLeft(true)}
        ></div>
      </motion.div>

      <div className="array-container">
        {array.map((value, index) => {
          const maxValue = Math.max(...array); // Encuentra el valor máximo para escalar
          const barWidth = 100 / array.length; // Calcula el ancho en porcentaje según la cantidad de elementos

          return (
            <div
              key={index}
              className="array-bar"
              style={{
                height: `${(value / maxValue) * 100}%`, // Mantiene la proporción
                width: `${barWidth}%` // Ajusta el ancho de la barra según el número de elementos
              }}
            >
              <span className="bar-value">{value}</span>
            </div>
          );
        })}
      </div>
      <div className="timer-container">
        <div className="timer">
          <span className="timer-icon">⏱️</span>
          <span className="timer-text">{formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );


};

export default SortingVisualizer;