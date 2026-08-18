let bancoPreguntas = null;
let preguntasPartida = [];
let indiceActual = 0;
let contadorAciertos = 0;
let contadorErrores = 0;

// Configuración de la partida (10 preguntas por juego)
const TOTAL_PREGUNTAS_PARTIDA = 10;
let categoriaActual = '';

// Arranca el juego cargando el JSON dinámicamente según el botón pulsado
async function iniciarJuego(categoria) {
    categoriaActual = categoria;
    
    // El archivo físico siempre se buscará en minúsculas (Ej: 'provincias.json')
    const archivoALeer = `${categoria.toLowerCase()}.json`;

    try {
        const respuesta = await fetch(archivoALeer);
        if (!respuesta.ok) {
            throw new Error(`Error en servidor: ${respuesta.status} ${respuesta.statusText}`);
        }
        bancoPreguntas = await respuesta.json();
    } catch (error) {
        alert(`Error crítico: No se pudo cargar "${archivoALeer}". Asegúrate de que el archivo JSON esté guardado exactamente en la misma carpeta que tu HTML.`);
        console.error(error);
        return;
    }

    // ADAPTACIÓN DE ESTRUCTURA MULTI-FICHERO:
    // Intenta buscar la lista de preguntas tanto en MAYÚSCULAS como en minúsculas o si viene como Array directo.
    let poolPreguntas = null;
    if (Array.isArray(bancoPreguntas)) {
        poolPreguntas = bancoPreguntas;
    } else {
        poolPreguntas = bancoPreguntas[categoria.toUpperCase()] || bancoPreguntas[categoria.toLowerCase()];
    }
    
    if (!poolPreguntas || !Array.isArray(poolPreguntas)) {
        alert(`Error: No se encontró la lista de preguntas dentro del archivo para la categoría "${categoria}".`);
        return;
    }

    // Selecciona un máximo de 10 preguntas aleatorias de este archivo
    preguntasPartida = prepararPreguntasAleatorias(poolPreguntas, TOTAL_PREGUNTAS_PARTIDA);
    
    // Resetear estados de control del juego
    indiceActual = 0;
    contadorAciertos = 0;
    contadorErrores = 0;

    // Actualizar marcadores visuales en tiempo real
    if (document.getElementById('vivo-aciertos')) document.getElementById('vivo-aciertos').innerText = '0';
    if (document.getElementById('vivo-errores')) document.getElementById('vivo-errores').innerText = '0';

    // Transición visual obligatoria entre pantallas
    document.getElementById('pantalla-inicio').classList.add('oculto');
    document.getElementById('pantalla-resultados').classList.add('oculto');
    document.getElementById('pantalla-test').classList.remove('oculto');

    mostrarPregunta();
}

// Baraja las preguntas disponibles de forma aleatoria y recorta el número
function prepararPreguntasAleatorias(lista, cantidadMaxima) {
    const listaBarajada = [...lista].sort(() => Math.random() - 0.5);
    return listaBarajada.slice(0, Math.min(cantidadMaxima, listaBarajada.length));
}

// Muestra el enunciado y desordena las respuestas en pantalla
function mostrarPregunta() {
    document.getElementById('btn-siguiente').classList.add('oculto');
    
    const datosPregunta = preguntasPartida[indiceActual];
    
    // Actualizar barra de progreso del alumno
    document.getElementById('info-progreso').innerText = `Pregunta ${indiceActual + 1} de ${preguntasPartida.length}`;
    const porcentajeProgreso = (indiceActual / preguntasPartida.length) * 100;
    document.getElementById('linea-progreso').style.width = `${porcentajeProgreso}%`;

    // Inyectar el texto del enunciado
    document.getElementById('texto-pregunta').innerText = datosPregunta.pregunta;

    // Convertir el índice 'correcta' (que en tu JSON es un texto "0" o "1") a número entero
    const indiceCorrecto = parseInt(datosPregunta.correcta, 10);
    const textoCorrecto = datosPregunta.opciones[indiceCorrecto];

    // Mapear y desordenar el set de respuestas
    const opcionesEstructuradas = datosPregunta.opciones.map(texto => ({
        texto: texto,
        esCorrecta: texto === textoCorrecto
    }));

    // Barajar opciones de respuesta de forma aleatoria
    opcionesEstructuradas.sort(() => Math.random() - 0.5);

    // Limpiar e inyectar botones nuevos en la interfaz gráfica
    const contenedor = document.getElementById('contenedor-opciones');
    contenedor.innerHTML = '';

    opcionesEstructuradas.forEach(opcion => {
        const boton = document.createElement('button');
        boton.className = 'btn-opcion';
        boton.innerText = opcion.texto;
        boton.onclick = () => verificarRespuesta(boton, opcion.esCorrecta, textoCorrecto);
        contenedor.appendChild(boton);
    });
}

// Evalúa si el alumno pulsó la opción correcta o incorrecta
function verificarRespuesta(botonSeleccionado, esCorrecta, textoCorrecto) {
    const todosLosBotones = document.querySelectorAll('.btn-opcion');
    
    // Bloquear el resto de opciones inmediatamente
    todosLosBotones.forEach(btn => btn.disabled = true);

    if (esCorrecta) {
        botonSeleccionado.classList.add('correcta');
        contadorAciertos++;
        if (document.getElementById('vivo-aciertos')) document.getElementById('vivo-aciertos').innerText = contadorAciertos;
    } else {
        botonSeleccionado.classList.add('incorrecta');
        contadorErrores++;
        if (document.getElementById('vivo-errores')) document.getElementById('vivo-errores').innerText = contadorErrores;

        // Revelar cuál era la respuesta correcta
        todosLosBotones.forEach(btn => {
            if (btn.innerText === textoCorrecto) {
                btn.classList.add('correcta');
            }
        });
    }

    document.getElementById('btn-siguiente').classList.remove('oculto');
}

// Avanza a la siguiente pregunta de la partida o finaliza
function siguientePregunta() {
    indiceActual++;
    if (indiceActual < preguntasPartida.length) {
        mostrarPregunta();
    } else {
        finalizarEvaluacion();
    }
}

// Calcula la nota final y la muestra en la pantalla de resultados
function finalizarEvaluacion() {
    document.getElementById('pantalla-test').classList.add('oculto');
    document.getElementById('pantalla-resultados').classList.remove('oculto');

    document.getElementById('aciertos').innerText = contadorAciertos;
    document.getElementById('errores').innerText = contadorErrores;

    const nota = (contadorAciertos / preguntasPartida.length) * 10;
    document.getElementById('nota-num').innerText = nota.toFixed(2);
}

// Redirige al alumno a la pantalla de inicio para poder escoger otra categoría
function volverAlInicio() {
    document.getElementById('pantalla-resultados').classList.add('oculto');
    document.getElementById('pantalla-test').classList.add('oculto');
    document.getElementById('pantalla-inicio').classList.remove('oculto');
}
