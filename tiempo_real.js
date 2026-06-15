// =====================================================================
// CONEXIÓN EN TIEMPO REAL Y SINCRONIZACIÓN DE RELOJES (ESTILO LICHESS)
// ARCHIVO: tiempo_real.js
// =====================================================================

// Base de datos de respaldo global y gratuita para desarrollo libre
const firebaseConfig = {
    databaseURL: "https://ajedrez-modular-default-rtdb.firebaseio.com"
};

// Inicializamos Firebase de forma segura
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

const urlParams = new URLSearchParams(window.location.search);
let idPartida = urlParams.get('partida');
let miColor = 'w'; // Por defecto el creador es Blancas

document.addEventListener("DOMContentLoaded", () => {
    // Inyectamos el botón de Reto en la barra superior automáticamente
    const barra = document.querySelector('.barra-superior-carga');
    if (barra) {
        const btnCrear = document.createElement('button');
        btnCrear.className = "btn-nav";
        btnCrear.style = "flex:none; width:auto; padding: 8px 15px; background-color: #007bff; font-weight: bold;";
        btnCrear.innerText = "CREAR RETO EN VIVO ⚔️";
        btnCrear.onclick = crearNuevaSalaJuego;
        barra.appendChild(btnCrear);
    }

    if (idPartida) {
        conectarPartidaEnVivo(idPartida);
    }
});

function crearNuevaSalaJuego() {
    idPartida = "partida_" + Math.floor(Math.random() * 100000);
    miColor = 'w'; // El que crea el botón va con Blancas
    
    // Obtenemos el tiempo configurado en el selector de tu menú para mandarlo al servidor
    let selectorModo = document.getElementById('select-tiempo-modo');
    let valorTiempo = selectorModo ? selectorModo.value : "analisis";
    
    let tiempoInicialSg = 600; // 10 min por defecto
    let analLibre = false;
    
    if (valorTiempo === "analisis") analLibre = true;
    else if (valorTiempo === "1") tiempoInicialSg = 60;
    else if (valorTiempo === "3") tiempoInicialSg = 180;
    else if (valorTiempo === "5") tiempoInicialSg = 300;
    else if (valorTiempo === "10") tiempoInicialSg = 600;
    else if (valorTiempo === "30") tiempoInicialSg = 1800;

    // Subimos la configuración inicial limpia al servidor
    database.ref('partidas/' + idPartida).set({
        ultimoFen: chess.fen(),
        tiempoB: tiempoInicialSg,
        tiempoN: tiempoInicialSg,
        modoAnalisisLibre: analLibre,
        turnoActual: 'w',
        creado: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        const enlaceUnico = window.location.origin + window.location.pathname + "?partida=" + idPartida;
        navigator.clipboard.writeText(enlaceUnico);
        alert("¡ÉXITO REAL!\n\nEnlace de juego copiado automáticamente. Pégaselo a tu amigo por WhatsApp.\nTú juegas con BLANCAS.");
        window.location.href = enlaceUnico;
    });
}

function conectarPartidaEnVivo(id) {
    // Si entramos por enlace y no somos el creador original, asumimos que somos las Negras ('b')
    // Guardamos en la memoria local quiénes somos
    if (!sessionStorage.getItem('color_' + id)) {
        // El primero que entra es Blancas, el segundo por el link es Negras
        database.ref('partidas/' + id).once('value', (snapshot) => {
            let d = snapshot.val();
            if (d) {
                miColor = 'b'; // Rival invitado
                sessionStorage.setItem('color_' + id, 'b');
                if (typeof girarTablero === 'function' && !tableroInvertido) girarTablero(); // Gira el tablero automáticamente al rival
                alert("¡Te has unido a la partida! Juegas con piezas NEGRAS. Espera el tiro de tu amigo.");
            }
        });
    } else {
        miColor = sessionStorage.getItem('color_' + id);
        if (miColor === 'b' && typeof girarTablero === 'function' && !tableroInvertido) girarTablero();
    }

    // OÍDO EN LA LÍNEA: Escuchar cambios de tablero y de relojes desde el servidor
    database.ref('partidas/' + id).on('value', (snapshot) => {
        const datos = snapshot.val();
        if (!datos) return;

        // 1. Sincronizar tablero si el rival movió
        if (datos.ultimoFen && datos.ultimoFen !== chess.fen()) {
            chess.load(datos.ultimoFen);
            
            if (typeof historialArbol !== 'undefined') {
                historialArbol.push({
                    fen: chess.fen(),
                    comentario: "📡 Movimiento recibido del servidor en vivo.",
                    san: chess.turn() === 'b' ? "Blancas" : "Negras",
                    lineaMovs: ""
                });
                indiceHistorial = historialArbol.length - 1;
            }
            
            if (typeof redibujarTablero === 'function') redibujarTablero();
            if (typeof reproducirSonidoTac === 'function') reproducirSonidoTac();
            if (typeof actualizarNavegacionYComentarios === 'function') actualizarNavegacionYComentarios();
        }

        // 2. Sincronizar variables de tiempo de los relojes con los del servidor
        if (typeof tiempoBlancas !== 'undefined') {
            tiempoBlancas = datos.tiempoB;
            tiempoNegras = datos.tiempoN;
            modoAnalisisLibre = datos.modoAnalisisLibre;
            
            if (typeof refrescarRelojesEnPantalla === 'function') refrescarRelojesEnPantalla();
            if (typeof controlarRelojDelTurno === 'function') controlarRelojDelTurno();
        }
    });
}

// Envía el estado exacto cada vez que tú haces un tiro válido
function enviarEstadoALaNube() {
    if (typeof idPartida !== 'undefined' && idPartida) {
        database.ref('partidas/' + idPartida).update({
            ultimoFen: chess.fen(),
            tiempoB: typeof tiempoBlancas !== 'undefined' ? tiempoBlancas : 600,
            tiempoN: typeof tiempoNegras !== 'undefined' ? tiempoNegras : 600,
            turnoActual: chess.turn()
        });
    }
}

// Modificación del bucle de tu reloj original en relojes.js para que el turno activo le reste tiempo al servidor
setInterval(() => {
    if (typeof idPartida !== 'undefined' && idPartida && typeof modoAnalisisLibre !== 'undefined' && !modoAnalisisLibre) {
        // Solo el jugador dueño de su turno descuenta su propio reloj local y lo sube al servidor para evitar desfases
        if (chess.turn() === miColor && !chess.game_over()) {
            if (miColor === 'w' && tiempoBlancas > 0) {
                tiempoBlancas--;
                enviarEstadoALaNube();
            } else if (miColor === 'b' && tiempoNegras > 0) {
                tiempoNegras--;
                enviarEstadoALaNube();
            }
        }
    }
}, 1000);

window.enviarEstadoALaNube = enviarEstadoALaNube;