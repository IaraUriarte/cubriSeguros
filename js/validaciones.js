// js/validaciones.js

export function validarMarca(marca) {
    return marca && marca.trim() !== '' ? null : 'Elegí una marca';
}

export function validarModelo(modelo) {
    if (!modelo) return 'Ingresá el modelo del equipo';
    const largo = modelo.trim().length;
    return largo >= 2 && largo <= 40 ? null : 'Ingresá el modelo del equipo (2 a 40 caracteres)';
}

export function validarValor(valor) {
    const num = Number(String(valor).replace(/\D/g, ''));
    if (isNaN(num) || num < 100000 || num > 2500000) {
        return 'El valor debe estar entre $100.000 y $2.500.000';
    }
    return null;
}

export function validarAntiguedad(antiguedad) {
    return antiguedad ? null : 'Indicá la antigüedad';
}

export function validarNombre(nombre) {
    return nombre && nombre.trim().length >= 2 ? null : 'Ingresá tu nombre';
}

export function validarApellido(apellido) {
    return apellido && apellido.trim().length >= 2 ? null : 'Ingresá tu apellido';
}

export function validarDNI(dni) {
    const valor = String(dni).trim();
    const regex = /^(?:\d{7,8}|\d{1,2}(?:\.\d{3}){2})$/;
    return regex.test(valor) ? null : 'El DNI debe tener 7 u 8 números';
}

export function validarNacimiento(fechaStr) {
    if (!fechaStr) return 'Tenés que ser mayor de edad';
    const fechaNac = new Date(fechaStr);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    return edad >= 18 ? null : 'Tenés que ser mayor de edad';
}

export function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(String(email).trim()) ? null : 'Ingresá un email válido';
}

export function validarCelular(celular) {
    const limpio = String(celular).replace(/[\s-]/g, '');
    const regex = /^\d{10}$/;
    return regex.test(limpio) ? null : 'Ej.: 11 5555-1234 (10 dígitos sin 0 ni 15)';
}

export function validarTerminos(acepto) {
    return acepto ? null : 'Tenés que aceptar los términos';
}