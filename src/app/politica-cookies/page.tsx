import type { Metadata } from "next";
import { LegalList, LegalNotice, LegalPage, LegalSection, LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de cookies | Chetesaí Fitness+",
  description: "Información sobre las cookies técnicas utilizadas por Chetesaí Fitness+.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies" summary="Detallamos qué cookies utiliza Chetesaí Fitness+, para qué sirven y cómo puedes controlarlas desde tu navegador.">
      <LegalNotice><strong>Situación actual:</strong> Chetesaí utiliza cookies técnicas necesarias para el inicio de sesión, la seguridad y el funcionamiento del portal. No hemos incorporado cookies publicitarias ni cookies propias de analítica que requieran consentimiento.</LegalNotice>

      <LegalSection title="1. Qué son las cookies">
        <p>Las cookies son pequeños archivos que una web guarda o consulta en tu dispositivo. Pueden ser necesarias para recordar una sesión y proteger una cuenta, o utilizarse para otras finalidades como medición o publicidad.</p>
      </LegalSection>

      <LegalSection title="2. Cookies utilizadas">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-[#ded8cd] text-[#202724]"><th className="p-3">Cookie o categoría</th><th className="p-3">Proveedor</th><th className="p-3">Finalidad</th><th className="p-3">Duración aproximada</th></tr></thead>
            <tbody className="divide-y divide-[#e8e2d8]">
              <tr><td className="p-3 font-semibold">better-auth.session_token</td><td className="p-3">Chetesaí / Better Auth</td><td className="p-3">Mantener la sesión autenticada y proteger el acceso.</td><td className="p-3">Hasta 7 días</td></tr>
              <tr><td className="p-3 font-semibold">better-auth.session_data</td><td className="p-3">Chetesaí / Better Auth</td><td className="p-3">Caché técnica breve para validar la sesión y permisos.</td><td className="p-3">Aproximadamente 1 minuto</td></tr>
              <tr><td className="p-3 font-semibold">Cookies temporales de autenticación y seguridad</td><td className="p-3">Chetesaí / Better Auth</td><td className="p-3">Completar accesos, cierres de sesión, recuperación y protección frente a solicitudes fraudulentas.</td><td className="p-3">Sesión o periodo breve</td></tr>
            </tbody>
          </table>
        </div>
        <p>Los nombres concretos pueden incorporar prefijos técnicos o variar tras una actualización de seguridad sin alterar su finalidad.</p>
      </LegalSection>

      <LegalSection title="3. Servicios de terceros">
        <LegalList>
          <li><strong>Google:</strong> si eliges iniciar sesión con Google, el proceso se realiza en sus dominios y puede utilizar cookies propias conforme a su política.</li>
          <li><strong>Stripe:</strong> al iniciar un pago o acceder al portal de facturación, Stripe puede utilizar cookies técnicas y antifraude en sus dominios.</li>
          <li><strong>Vercel y Totalum:</strong> prestan infraestructura y servicios técnicos; podrán tratar datos técnicos estrictamente necesarios para servir y proteger la aplicación.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Consentimiento y control">
        <p>Las cookies estrictamente necesarias pueden utilizarse sin consentimiento porque permiten prestar una función solicitada, como iniciar sesión. Puedes bloquearlas o borrarlas desde tu navegador, pero el acceso al portal, los pagos o algunas funciones podrían dejar de funcionar.</p>
        <p>Si Chetesaí incorpora en el futuro cookies de analítica no exentas, personalización o publicidad, se actualizará esta política y se mostrará un panel que permita aceptar y rechazar con la misma facilidad.</p>
      </LegalSection>

      <LegalSection title="5. Cómo borrar o bloquear cookies">
        <p>Los navegadores permiten consultar, eliminar y bloquear cookies desde sus apartados de privacidad o configuración del sitio. Consulta la ayuda oficial de Chrome, Safari, Firefox, Edge o el navegador que utilices. La configuración se aplica a cada navegador y dispositivo.</p>
      </LegalSection>

      <LegalSection title="6. Contacto y cambios">
        <p>Para preguntas sobre esta política, escribe a <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. Revisaremos el documento cuando cambien las tecnologías o finalidades utilizadas.</p>
      </LegalSection>
    </LegalPage>
  );
}
