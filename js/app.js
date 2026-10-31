import { solicitud, actualizarPaso } from './estado.js';
import { render as renderInterfaz, renderResumen } from './render.js';
import {
    validarMarca, validarModelo, validarValor, validarAntiguedad,
    validarNombre, validarApellido, validarDNI, validarNacimiento,
    validarEmail, validarCelular, validarTerminos
} from './validaciones.js';
import { formatearValorEquipo } from './cotizador.js';
import { formatearDNI, formatearCelular } from './formato.js';

function irAPaso(paso) {
    actualizarPaso(paso);
    renderInterfaz();
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
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

    validarPasoEquipo();
    validarPasoTitular();
});

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
