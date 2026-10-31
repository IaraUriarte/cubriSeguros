export function formatearDNI(dni) {
    const valor = String(dni).trim();
    const digitos = valor.replace(/\./g, '');
    if (!/^\d{7,8}$/.test(digitos)) return valor;

    return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatearCelular(celular) {
    const valor = String(celular).trim();
    const digitos = valor.replace(/[\s-]/g, '');
    if (!/^\d{10}$/.test(digitos)) return valor;

    return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
}
