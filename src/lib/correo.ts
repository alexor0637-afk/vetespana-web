// Correos de proveedores para particulares (Gmail, Hotmail, los de las operadoras…). En un
// directorio de clínicas suelen ser el correo personal de un veterinario autónomo, así que
// solo se publican si la propia clínica lo ha dado o confirmado (clinicas.email_confirmado).
const PERSONALES = new RegExp(
  '@(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|mac|aol|protonmail|proton|pm|gmx|' +
    'telefonica|movistar|terra|ono|orange|vodafone|jazztel|wanadoo|telecable|euskaltel|mundo-r)\\.[a-z.]+$',
  'i',
)

export const correoPersonal = (email: string) => PERSONALES.test(email.trim())
