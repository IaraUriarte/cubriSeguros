import { solicitud } from './estado.js';
import { cargarPlanes, calcularCuota, formatearValorEquipo } from './cotizador.js';
import { formatearDNI, formatearCelular } from './formato.js';

let planesData = [];

cargarPlanes()
    .then((planes) => {
        planesData = planes;
        const error = document.getElementById('planes-error');
        error.hidden = true;
        render();
    })
    .catch((error) => {
        console.error('Error al cargar los planes:', error);
        const mensaje = document.getElementById('planes-error');
        mensaje.textContent = 'No pudimos cargar los planes. Revisá tu conexión e intentá nuevamente.';
        mensaje.hidden = false;
        const continuar = document.getElementById('btn-paso-2-siguiente');
        if (continuar) continuar.disabled = true;
    });

export function render() {
    const pasoActual = solicitud.paso;

    restaurarFormularios();

    document.querySelectorAll('[data-paso]').forEach((seccion) => {
        seccion.hidden = Number(seccion.dataset.paso) !== pasoActual;
    });

    document.getElementById('checkout-shell').hidden = pasoActual < 1 || pasoActual > 4;
    const resumen = document.getElementById('resumen-lateral');
    resumen.hidden = pasoActual < 1 || pasoActual > 4;

    renderStepper();

    if (pasoActual === 2) {
        renderPlanes();
    }

    renderResumen();

    if (pasoActual === 5) {
        renderExito();
    } else if (pasoActual === 6) {
        document.getElementById('error-pago-mensaje').textContent =
            solicitud.pago.motivo || 'La tarjeta fue rechazada. Podés reintentar o cambiar el medio de pago.';
    }

}

function renderStepper() {
    const stepperContainer = document.getElementById('stepper-container');
    const pasoActual = solicitud.paso;
    const estaEnCheckout = pasoActual >= 1 && pasoActual <= 4;

    stepperContainer.classList.toggle('hidden', !estaEnCheckout);
    stepperContainer.querySelectorAll('[data-step]').forEach((item) => {
        const numeroPaso = Number(item.dataset.step);
        const completado = numeroPaso < pasoActual;
        const activo = numeroPaso === pasoActual;

        item.classList.toggle('is-complete', completado);
        item.classList.toggle('is-active', activo);
        item.classList.toggle('text-emerald-600', completado);
        item.classList.toggle('text-indigo-600', activo);
        item.classList.toggle('text-slate-400', !completado && !activo);
        item.classList.toggle('font-bold', completado || activo);
        if (activo) {
            item.setAttribute('aria-current', 'step');
        } else {
            item.removeAttribute('aria-current');
        }

        const indicador = item.querySelector('span');
        indicador.textContent = completado ? '✓' : String(numeroPaso);
        indicador.classList.toggle('border-emerald-600', completado);
        indicador.classList.toggle('bg-emerald-600', completado);
        indicador.classList.toggle('border-indigo-600', activo);
        indicador.classList.toggle('bg-indigo-600', activo);
        indicador.classList.toggle('border-slate-200', !completado && !activo);
        indicador.classList.toggle('text-slate-400', !completado && !activo);
        indicador.classList.toggle('text-white', completado || activo);
    });
}

function renderPlanes() {
    const contenedor = document.getElementById('contenedor-planes');
    const botonSiguiente = document.getElementById('btn-paso-2-siguiente');

    if (!planesData.length) {
        contenedor.replaceChildren();
        botonSiguiente.disabled = true;
        return;
    }

    const formatoMoneda = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    });

    contenedor.innerHTML = planesData.map((plan) => {
        const cuota = calcularCuota(
            solicitud.equipo.valor,
            plan.tasaAnual,
            solicitud.equipo.antiguedad
        );
        const seleccionado = solicitud.plan === plan.id;
        const recomendado = plan.recomendado
            ? '<span class="badge plan-badge rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Recomendado</span>'
            : '';

        return `
            <label class="plan-card card cursor-pointer rounded-xl border p-5 transition-all ${seleccionado ? 'is-selected border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}">
                <input type="radio" name="plan" value="${plan.id}" ${seleccionado ? 'checked' : ''} aria-label="Plan ${plan.nombre}">
                ${recomendado}
                <h2>${plan.nombre}</h2>
                <p class="plan-price">${formatoMoneda.format(cuota)} <span>/mes</span></p>
                <ul>${plan.coberturas.map((cobertura) => `<li>${cobertura}</li>`).join('')}</ul>
            </label>
        `;
    }).join('');

    botonSiguiente.disabled = !planesData.some((plan) => plan.id === solicitud.plan);
}

export function renderResumen() {
    const contenedor = document.getElementById('resumen-lateral');
    const formatoMoneda = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    });
    const planElegido = planesData.find((plan) => plan.id === solicitud.plan);
    const cuota = planElegido
        ? calcularCuota(solicitud.equipo.valor, planElegido.tasaAnual, solicitud.equipo.antiguedad)
        : 0;

    contenedor.replaceChildren();

    const encabezado = document.createElement('header');
    const titulo = document.createElement('h2');
    titulo.id = 'summary-title';
    titulo.textContent = solicitud.paso === 4 ? 'Resumen final' : 'Resumen de tu seguro';
    encabezado.append(titulo);
    contenedor.append(encabezado);

    const contenido = document.createElement('section');
    contenido.className = 'summary-content';
    contenido.setAttribute('aria-label', 'Detalle del resumen');
    contenedor.append(contenido);

    agregarItem(contenido, 'Seguro', 'Celular');

    if (solicitud.equipo.marca) {
        agregarItem(contenido, 'Equipo', `${solicitud.equipo.marca} ${solicitud.equipo.modelo}`);
        agregarNota(contenido, `Valor: ${formatoMoneda.format(solicitud.equipo.valor)}`);
    } else {
        agregarNota(contenido, 'Completá los datos del equipo para comenzar.');
    }

    if (solicitud.paso >= 2 && planElegido) {
        agregarItem(contenido, 'Plan', planElegido.nombre);
        agregarNota(contenido, `${formatoMoneda.format(cuota)} por mes`);
    }

    if (solicitud.paso >= 4 && solicitud.titular.nombre) {
        agregarItem(contenido, 'Asegurado', `${solicitud.titular.nombre} ${solicitud.titular.apellido}`);
        agregarNota(contenido, `DNI: ${solicitud.titular.dni} · Email: ${solicitud.titular.email}`);
    }

    if (solicitud.paso === 4 && planElegido) {
        agregarItem(contenido, 'Total mensual', formatoMoneda.format(cuota));
    }
}

function agregarItem(contenedor, etiqueta, valor) {
    const item = document.createElement('div');
    item.className = 'summary-item';

    const titulo = document.createElement('p');
    titulo.className = 'summary-label';
    titulo.textContent = etiqueta;

    const texto = document.createElement('p');
    texto.className = 'summary-value';
    texto.textContent = valor;

    item.append(titulo, texto);
    contenedor.append(item);
}

function agregarNota(contenedor, texto) {
    const nota = document.createElement('p');
    nota.className = 'summary-note';
    nota.textContent = texto;
    contenedor.append(nota);
}

function renderExito() {
    const formatoMoneda = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    });
    const planElegido = planesData.find((plan) => plan.id === solicitud.plan);
    const cuota = planElegido
        ? calcularCuota(solicitud.equipo.valor, planElegido.tasaAnual, solicitud.equipo.antiguedad)
        : 0;

    document.getElementById('exito-mensaje').textContent =
        `Gracias, ${solicitud.titular.nombre}. Enviamos el comprobante a ${solicitud.titular.email}.`;
    document.getElementById('exito-poliza').textContent = `Póliza Nº: ${solicitud.poliza}`;

    const detalle = document.getElementById('exito-detalle');
    detalle.textContent = [
        'Seguro: Celular',
        `Asegurado: ${solicitud.titular.nombre} ${solicitud.titular.apellido}`,
        `Equipo: ${solicitud.equipo.marca} ${solicitud.equipo.modelo}`,
        `Plan: ${planElegido ? planElegido.nombre : solicitud.plan}`,
        `Cuota mensual: ${formatoMoneda.format(cuota)}`
    ].join('\n');
}

function restaurarFormularios() {
    const formEquipo = document.getElementById('form-paso-1');
    const formTitular = document.getElementById('form-paso-3');
    const formPago = document.getElementById('form-paso-4');

    formEquipo.elements.marca.value = solicitud.equipo.marca;
    formEquipo.elements.modelo.value = solicitud.equipo.modelo;
    formEquipo.elements.valor.value = solicitud.equipo.valor
        ? formatearValorEquipo(solicitud.equipo.valor)
        : '';
    formEquipo.querySelectorAll('input[name="antiguedad"]').forEach((radio) => {
        radio.checked = radio.value === solicitud.equipo.antiguedad;
    });

    formTitular.elements.nombre.value = solicitud.titular.nombre;
    formTitular.elements.apellido.value = solicitud.titular.apellido;
    formTitular.elements.dni.value = formatearDNI(solicitud.titular.dni);
    formTitular.elements.nacimiento.value = solicitud.titular.nacimiento;
    formTitular.elements.email.value = solicitud.titular.email;
    formTitular.elements.celular.value = formatearCelular(solicitud.titular.celular);
    formTitular.elements.terminos.checked = solicitud.titular.terminos;

    formPago.elements.metodo.value = solicitud.pago.metodo;
    formPago.elements.tarjeta.value = solicitud.pago.tarjeta;
    formPago.elements.vencimiento.value = solicitud.pago.vencimiento;
    formPago.elements.cvv.value = solicitud.pago.cvv;
    formPago.elements.titular.value = solicitud.pago.titular;
}
