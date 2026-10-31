import { solicitud, actualizarPaso } from './estado.js';
import { render as renderInterfaz, renderResumen } from './render.js';
import {
    validarMarca, validarModelo, validarValor, validarAntiguedad,
    validarNombre, validarApellido, validarDNI, validarNacimiento,
    validarEmail, validarCelular, validarTerminos,
    validarTarjeta, validarVencimiento, validarCVV, validarTitularPago
} from './validaciones.js';
import { formatearValorEquipo } from './cotizador.js';
import { formatearDNI, formatearCelular } from './formato.js';
import { simularPago, generarPoliza } from './pago.js';

const TEMA_STORAGE_KEY = 'cubri-tema';

function aplicarTema(tema) {
    document.documentElement.dataset.theme = tema;
    const boton = document.getElementById('theme-toggle');
    const activarOscuro = tema !== 'dark';
    const etiqueta = activarOscuro ? 'Activar modo noche' : 'Activar modo claro';

    boton.setAttribute('aria-label', etiqueta);
    boton.setAttribute('title', etiqueta);
    boton.setAttribute('aria-pressed', String(!activarOscuro));
    document.querySelector('meta[name="theme-color"]')
        .setAttribute('content', tema === 'dark' ? '#0b1120' : '#f5f7fb');
}

const temaGuardado = localStorage.getItem(TEMA_STORAGE_KEY);
document.documentElement.dataset.theme = temaGuardado === 'dark' ? 'dark' : 'light';

function irAPaso(paso) {
    actualizarPaso(paso);
    renderInterfaz();
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    const botonTema = document.getElementById('theme-toggle');
    aplicarTema(document.documentElement.dataset.theme);
    botonTema.addEventListener('click', () => {
        const temaNuevo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(TEMA_STORAGE_KEY, temaNuevo);
        aplicarTema(temaNuevo);
    });

    renderInterfaz();

    document.querySelectorAll('#btn-iniciar-celular, #btn-iniciar-celular-card')
        .forEach((boton) => boton.addEventListener('click', () => irAPaso(1)));

    document.querySelectorAll('.btn-volver').forEach((boton) => {
        boton.addEventListener('click', () => irAPaso(Math.max(0, solicitud.paso - 1)));
    });

    const formEquipo = document.getElementById('form-paso-1');
    const botonEquipo = document.getElementById('btn-paso-1-siguiente');
    const camposEquipoVisitados = new Set();
    const camposEquipo = [
        { id: 'marca', validar: validarMarca, valor: () => formEquipo.elements.marca.value },
        { id: 'modelo', validar: validarModelo, valor: () => formEquipo.elements.modelo.value },
        { id: 'valor', validar: validarValor, valor: () => formEquipo.elements.valor.value },
        {
            id: 'antiguedad',
            validar: validarAntiguedad,
            valor: () => formEquipo.elements.antiguedad.value
        }
    ];

    function guardarEquipo() {
        solicitud.equipo.marca = formEquipo.elements.marca.value;
        solicitud.equipo.modelo = formEquipo.elements.modelo.value.trim();
        solicitud.equipo.valor = Number(formEquipo.elements.valor.value.replace(/\D/g, ''));
        solicitud.equipo.antiguedad = formEquipo.elements.antiguedad.value;
    }

    function validarPasoEquipo(mostrarTodos = false) {
        guardarEquipo();
        let primerError = null;
        let esValido = true;

        camposEquipo.forEach(({ id, validar, valor }) => {
            const mensaje = validar(valor());
            if (mensaje) {
                esValido = false;
                primerError ??= id;
            }
            if (mostrarTodos || camposEquipoVisitados.has(id)) {
                mostrarError(id, `${id}-error`, mensaje);
            }
        });

        botonEquipo.disabled = !esValido;
        document.getElementById('paso-1-ayuda').textContent = esValido
            ? 'Tu equipo está listo para cotizar.'
            : 'Completá todos los campos para ver los planes.';
        return { esValido, primerError };
    }

    formEquipo.addEventListener('input', () => {
        validarPasoEquipo();
        renderResumen();
    });
    formEquipo.addEventListener('change', () => {
        validarPasoEquipo();
        renderResumen();
    });

    camposEquipo.forEach(({ id }) => {
        const entrada = id === 'antiguedad'
            ? formEquipo.querySelector('input[name="antiguedad"]')
            : document.getElementById(id);

        if (id === 'valor') {
            entrada.addEventListener('focus', () => {
                entrada.value = entrada.value.replace(/\D/g, '');
            });
        }

        if (id !== 'antiguedad') {
            entrada.addEventListener('blur', () => {
                camposEquipoVisitados.add(id);
                if (id === 'valor') {
                    entrada.value = formatearValorEquipo(entrada.value);
                }
                validarPasoEquipo();
                renderResumen();
            });
        }
    });

    const antiguedad = formEquipo.querySelector('.age-choice-group');
    antiguedad.addEventListener('focusout', (evento) => {
        if (!antiguedad.contains(evento.relatedTarget)) {
            camposEquipoVisitados.add('antiguedad');
            validarPasoEquipo();
            renderResumen();
        }
    });

    botonEquipo.addEventListener('click', () => {
        const resultado = validarPasoEquipo(true);
        if (!resultado.esValido) {
            enfocarCampo(resultado.primerError);
            return;
        }
        irAPaso(2);
    });

    const contenedorPlanes = document.getElementById('contenedor-planes');
    const botonPlan = document.getElementById('btn-paso-2-siguiente');
    botonPlan.disabled = true;

    contenedorPlanes.addEventListener('change', (evento) => {
        if (evento.target instanceof HTMLInputElement && evento.target.name === 'plan') {
            solicitud.plan = evento.target.value;
            renderInterfaz();
        }
    });

    botonPlan.addEventListener('click', () => {
        if (botonPlan.disabled || !solicitud.plan) return;
        irAPaso(3);
    });

    const formTitular = document.getElementById('form-paso-3');
    const botonTitular = document.getElementById('btn-paso-3-siguiente');
    const camposTitularVisitados = new Set();
    const camposTitular = [
        { id: 'nombre', validar: validarNombre },
        { id: 'apellido', validar: validarApellido },
        { id: 'dni', validar: validarDNI },
        { id: 'nacimiento', validar: validarNacimiento },
        { id: 'email', validar: validarEmail },
        { id: 'celular', validar: validarCelular }
    ];

    function guardarTitular() {
        solicitud.titular.nombre = formTitular.elements.nombre.value.trim();
        solicitud.titular.apellido = formTitular.elements.apellido.value.trim();
        solicitud.titular.dni = formTitular.elements.dni.value.replace(/\./g, '').trim();
        solicitud.titular.nacimiento = formTitular.elements.nacimiento.value;
        solicitud.titular.email = formTitular.elements.email.value.trim();
        solicitud.titular.celular = formTitular.elements.celular.value
            .replace(/[\s-]/g, '').trim();
        solicitud.titular.terminos = formTitular.elements.terminos.checked;
    }

    function validarPasoTitular(mostrarTodos = false) {
        guardarTitular();
        let primerError = null;
        let esValido = true;

        camposTitular.forEach(({ id, validar }) => {
            const mensaje = validar(formTitular.elements[id].value);
            if (mensaje) {
                esValido = false;
                primerError ??= id;
            }
            if (mostrarTodos || camposTitularVisitados.has(id)) {
                mostrarError(id, `${id}-error`, mensaje);
            }
        });

        const errorTerminos = validarTerminos(formTitular.elements.terminos.checked);
        if (errorTerminos) {
            esValido = false;
            primerError ??= 'terminos';
        }
        if (mostrarTodos || camposTitularVisitados.has('terminos')) {
            mostrarError('terminos', 'terminos-error', errorTerminos);
        }

        botonTitular.disabled = !esValido;
        document.getElementById('paso-3-ayuda').textContent = esValido
            ? 'Tus datos están completos.'
            : 'Completá los datos y aceptá los términos para continuar.';
        return { esValido, primerError };
    }

    camposTitular.forEach(({ id }) => {
        const entrada = formTitular.elements[id];
        const formateadores = { dni: formatearDNI, celular: formatearCelular };

        entrada.addEventListener('input', () => {
            validarPasoTitular();
            renderResumen();
        });
        entrada.addEventListener('blur', () => {
            camposTitularVisitados.add(id);
            if (formateadores[id]) {
                entrada.value = formateadores[id](entrada.value);
            }
            validarPasoTitular();
            renderResumen();
        });
    });

    formTitular.elements.terminos.addEventListener('change', () => {
        camposTitularVisitados.add('terminos');
        validarPasoTitular();
        renderResumen();
    });

    botonTitular.addEventListener('click', () => {
        const resultado = validarPasoTitular(true);
        if (!resultado.esValido) {
            enfocarCampo(resultado.primerError);
            return;
        }
        irAPaso(4);
    });

    const formPago = document.getElementById('form-paso-4');
    const botonPagar = document.getElementById('btn-pagar');
    const camposPagoVisitados = new Set();
    const camposPago = [
        { id: 'tarjeta', validar: validarTarjeta },
        { id: 'vencimiento', validar: validarVencimiento },
        { id: 'cvv', validar: validarCVV },
        { id: 'titular', validar: validarTitularPago }
    ];

    function guardarPago() {
        solicitud.pago.metodo = formPago.elements.metodo.value;
        solicitud.pago.tarjeta = formPago.elements.tarjeta.value.trim();
        solicitud.pago.vencimiento = formPago.elements.vencimiento.value.trim();
        solicitud.pago.cvv = formPago.elements.cvv.value.trim();
        solicitud.pago.titular = formPago.elements.titular.value.trim();
    }

    function formatearEntradaNumerica(entrada, longitud, formatear) {
        const posicion = entrada.selectionStart ?? entrada.value.length;
        const digitosAntesDelCursor = entrada.value.slice(0, posicion).replace(/\D/g, '').length;
        const digitos = entrada.value.replace(/\D/g, '').slice(0, longitud);
        entrada.value = formatear(digitos);
        const nuevaPosicion = formatear(digitos.slice(0, digitosAntesDelCursor)).length;
        entrada.setSelectionRange(nuevaPosicion, nuevaPosicion);
    }

    function validarPasoPago(mostrarTodos = false) {
        guardarPago();
        let primerError = null;
        let esValido = true;

        camposPago.forEach(({ id, validar }) => {
            const mensaje = validar(formPago.elements[id].value);
            if (mensaje) {
                esValido = false;
                primerError ??= id;
            }
            if (mostrarTodos || camposPagoVisitados.has(id)) {
                mostrarError(id, `${id}-error`, mensaje);
            }
        });

        botonPagar.disabled = !esValido;
        document.getElementById('pago-ayuda').textContent = esValido
            ? 'Datos completos. Podés confirmar el pago de prueba.'
            : 'Completá los datos con una tarjeta de prueba para contratar.';
        return { esValido, primerError };
    }

    formPago.addEventListener('input', (evento) => {
        if (evento.target === formPago.elements.tarjeta) {
            formatearEntradaNumerica(formPago.elements.tarjeta, 16, (digitos) =>
                digitos.replace(/(\d{4})(?=\d)/g, '$1 ')
            );
        } else if (evento.target === formPago.elements.vencimiento) {
            formatearEntradaNumerica(formPago.elements.vencimiento, 4, (digitos) =>
                digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos
            );
        } else if (evento.target === formPago.elements.cvv) {
            formPago.elements.cvv.value = formPago.elements.cvv.value.replace(/\D/g, '').slice(0, 3);
        }
        validarPasoPago();
    });

    formPago.querySelectorAll('input[name="metodo"]').forEach((opcion) => {
        opcion.addEventListener('change', () => {
            guardarPago();
            validarPasoPago();
        });
    });

    camposPago.forEach(({ id }) => {
        formPago.elements[id].addEventListener('blur', () => {
            camposPagoVisitados.add(id);
            validarPasoPago();
        });
    });

    botonPagar.addEventListener('click', async () => {
        const validacion = validarPasoPago(true);
        if (!validacion.esValido) {
            enfocarCampo(validacion.primerError);
            return;
        }

        botonPagar.disabled = true;
        botonPagar.textContent = 'Procesando…';

        let pasoResultado = 6;
        try {
            const resultado = await simularPago(solicitud.pago.tarjeta);
            if (resultado.ok) {
                solicitud.poliza = generarPoliza();
                solicitud.pago.motivo = '';
                pasoResultado = 5;
            } else {
                solicitud.pago.motivo = resultado.motivo;
            }
        } catch (error) {
            console.error('No se pudo completar el pago simulado:', error);
            solicitud.pago.motivo =
                'No se pudo completar el pago. Podés reintentar o cambiar el medio de pago.';
        } finally {
            botonPagar.textContent = 'Pagar y contratar';
            botonPagar.disabled = pasoResultado !== 6;
        }

        irAPaso(pasoResultado);
    });

    document.getElementById('btn-reintentar-pago').addEventListener('click', () => {
        solicitud.pago.motivo = '';
        validarPasoPago();
        irAPaso(4);
    });

    document.getElementById('btn-cambiar-medio-pago').addEventListener('click', () => {
        solicitud.pago.metodo = solicitud.pago.metodo === 'credito' ? 'debito' : 'credito';
        solicitud.pago.motivo = '';
        formPago.elements.metodo.value = solicitud.pago.metodo;
        validarPasoPago();
        irAPaso(4);
    });

    document.getElementById('btn-descargar-poliza').addEventListener('click', () => {
        const mensajeError = document.getElementById('error-descarga-poliza');

        try {
            if (solicitud.paso !== 5 || !solicitud.poliza) {
                throw new Error('No hay una póliza confirmada para descargar.');
            }

            const documento = crearDocumentoPoliza();
            const archivo = new Blob([documento], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(archivo);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `poliza-${solicitud.poliza}.html`;
            document.body.append(enlace);
            enlace.click();
            enlace.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            mensajeError.hidden = true;
        } catch (error) {
            console.error('No se pudo descargar la póliza:', error);
            mensajeError.textContent = 'No pudimos descargar la póliza. Intentá nuevamente.';
            mensajeError.hidden = false;
        }
    });

    document.getElementById('btn-volver-inicio').addEventListener('click', () => {
        solicitud.equipo = { marca: '', modelo: '', valor: 0, antiguedad: '' };
        solicitud.plan = 'plus';
        solicitud.titular = {
            nombre: '', apellido: '', dni: '', nacimiento: '',
            email: '', celular: '', terminos: false
        };
        solicitud.pago = {
            metodo: 'credito', tarjeta: '', vencimiento: '',
            cvv: '', titular: '', motivo: ''
        };
        solicitud.poliza = null;
        formEquipo.reset();
        formTitular.reset();
        formPago.reset();
        camposEquipoVisitados.clear();
        camposTitularVisitados.clear();
        camposPagoVisitados.clear();
        validarPasoEquipo();
        validarPasoTitular();
        validarPasoPago();
        irAPaso(0);
    });

    validarPasoEquipo();
    validarPasoTitular();
    validarPasoPago();
});

function crearDocumentoPoliza() {
    const escaparHTML = (valor) => String(valor).replace(/[&<>"']/g, (caracter) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caracter]);
    const numero = escaparHTML(solicitud.poliza);
    const detalle = escaparHTML(document.getElementById('exito-detalle').textContent);
    const fecha = new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'long'
    }).format(new Date());

    return `<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Póliza ${numero} | Cubrí Seguros</title>
    <style>
        body { margin: 0; padding: 48px 20px; color: #172033; background: #f5f7fb; font: 16px/1.6 Arial, sans-serif; }
        main { max-width: 720px; margin: 0 auto; padding: 40px; background: #fff; border: 1px solid #dce3ee; border-radius: 16px; }
        .brand { color: #5145ed; font-size: 24px; font-weight: 700; }
        h1 { margin: 32px 0 8px; font-size: 28px; }
        .number { color: #5145ed; font-size: 20px; font-weight: 700; }
        pre { margin: 28px 0; padding: 20px; overflow-wrap: anywhere; white-space: pre-wrap; background: #f8faff; border: 1px solid #dce3ee; border-radius: 12px; font: inherit; }
        .notice { color: #64748b; font-size: 13px; }
        @media print { body { padding: 0; background: #fff; } main { border: 0; } }
    </style>
</head>
<body>
    <main>
        <div class="brand">Cubrí Seguros</div>
        <h1>Constancia de contratación</h1>
        <div class="number">Póliza Nº: ${numero}</div>
        <p>Fecha de emisión: ${escaparHTML(fecha)}</p>
        <pre>${detalle}</pre>
        <p class="notice">Documento generado para la consigna. El pago es simulado y esta constancia no tiene validez comercial.</p>
    </main>
</body>
</html>`;
}

function mostrarError(campoId, errorId, mensaje) {
    const campo = document.getElementById(`${campoId}-field`);
    const entrada = campoId === 'antiguedad'
        ? document.querySelector('input[name="antiguedad"]')
        : document.getElementById(campoId);
    const error = document.getElementById(errorId);

    error.textContent = mensaje || '';
    error.hidden = !mensaje;
    campo.toggleAttribute('data-invalid', Boolean(mensaje));

    if (mensaje) {
        entrada.setAttribute('aria-invalid', 'true');
    } else {
        entrada.removeAttribute('aria-invalid');
    }
}

function enfocarCampo(campoId) {
    const selector = campoId === 'antiguedad'
        ? 'input[name="antiguedad"]'
        : `#${campoId}`;
    document.querySelector(selector)?.focus();
}
