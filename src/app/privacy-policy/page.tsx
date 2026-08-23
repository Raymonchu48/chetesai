import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection, LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidad | Chetesaí Fitness+",
  description: "Información sobre el tratamiento de datos personales en Chetesaí Fitness+.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Política de privacidad" summary="Explicamos qué datos tratamos, para qué los utilizamos y cómo puedes ejercer tus derechos cuando utilizas la web y el portal Chetesaí Fitness+.">
      <LegalSection title="1. Responsable del tratamiento">
        <p><strong>Responsable:</strong> Ramón Alberto Curbalán Vega, titular de Chetesaí Fitness+.</p>
        <p><strong>Ámbito de actividad:</strong> Mallorca, Islas Baleares, España.</p>
        <p><strong>Contacto:</strong> <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> o mediante el formulario disponible en la página principal.</p>
      </LegalSection>

      <LegalSection title="2. Datos que podemos tratar">
        <LegalList>
          <li><strong>Identificación y contacto:</strong> nombre, correo electrónico, teléfono y datos incluidos en solicitudes o comunicaciones.</li>
          <li><strong>Cuenta y autenticación:</strong> credenciales cifradas, identificadores de usuario, rol, sesiones y, si eliges ese método, información básica facilitada por Google.</li>
          <li><strong>Valoración y salud:</strong> objetivos, antecedentes relevantes, lesiones, limitaciones, peso, medidas, composición corporal y otra información necesaria para adaptar el servicio.</li>
          <li><strong>Entrenamiento, nutrición y hábitos:</strong> rutinas, series, cargas, RPE, asistencia, planificación alimentaria, hábitos, progreso, observaciones y fotografías que decidas aportar.</li>
          <li><strong>Reservas y pagos:</strong> citas, bonos, facturación, estado de cobros e identificadores de transacción. Chetesaí no almacena los datos completos de tu tarjeta.</li>
          <li><strong>Datos técnicos y de seguridad:</strong> dirección IP, dispositivo, navegador, registros de acceso, incidencias y cookies técnicas de sesión.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Finalidades y bases jurídicas">
        <LegalList>
          <li><strong>Atender solicitudes y gestionar reservas:</strong> medidas precontractuales y ejecución del servicio solicitado.</li>
          <li><strong>Crear y mantener tu cuenta:</strong> ejecución de la relación contractual.</li>
          <li><strong>Diseñar y seguir planes personalizados:</strong> ejecución del servicio y, cuando se traten datos de salud, tu consentimiento explícito.</li>
          <li><strong>Gestionar cobros, facturación y obligaciones contables:</strong> ejecución contractual y cumplimiento de obligaciones legales.</li>
          <li><strong>Proteger la plataforma y prevenir accesos indebidos:</strong> interés legítimo en garantizar la seguridad del servicio.</li>
          <li><strong>Enviar comunicaciones comerciales:</strong> únicamente cuando exista consentimiento o una base legal aplicable; podrás darte de baja en cualquier momento.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Destinatarios y proveedores">
        <p>No vendemos tus datos. Podrán acceder a ellos proveedores necesarios para prestar el servicio, sujetos a contratos y deberes de confidencialidad: infraestructura y alojamiento en Vercel, plataforma de datos Totalum, autenticación, correo, Stripe para pagos y Google cuando se utilice su acceso.</p>
        <p>También podrán comunicarse datos a Administraciones, juzgados o autoridades cuando exista una obligación legal. Si un proveedor tratara datos fuera del Espacio Económico Europeo, se aplicarán las garantías previstas por el RGPD.</p>
      </LegalSection>

      <LegalSection title="5. Conservación">
        <p>Los datos se conservarán mientras exista una cuenta o relación activa y durante los plazos necesarios para atender responsabilidades legales, fiscales, mercantiles o contractuales. Los datos basados exclusivamente en el consentimiento se suprimirán o anonimizarán cuando lo retires, salvo que deban conservarse bloqueados por una obligación legal.</p>
      </LegalSection>

      <LegalSection title="6. Tus derechos">
        <p>Puedes solicitar el acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos, así como retirar el consentimiento sin que ello afecte a la licitud del tratamiento anterior.</p>
        <p>Para ejercerlos, escribe a <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> indicando el derecho solicitado y la información necesaria para verificar tu identidad. También puedes presentar una reclamación ante la <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos</a>.</p>
      </LegalSection>

      <LegalSection title="7. Menores de edad">
        <p>Las cuentas o servicios para menores deberán gestionarse con la intervención de su madre, padre o representante legal. Cuando sea necesario tratar datos de un menor de 14 años, se solicitará el consentimiento de quien ejerza la patria potestad o tutela.</p>
      </LegalSection>

      <LegalSection title="8. Seguridad y actualización">
        <p>Aplicamos medidas técnicas y organizativas orientadas a proteger la confidencialidad, integridad y disponibilidad de la información. Ningún sistema conectado a Internet es infalible, por lo que revisamos las medidas de seguridad y limitamos el acceso según las funciones de cada usuario.</p>
        <p>Esta política podrá actualizarse cuando cambie la normativa, los proveedores o las funciones de la plataforma. La versión vigente estará siempre disponible en esta dirección.</p>
        <p>Consulta también la <Link href="/politica-cookies">Política de cookies</Link> y los <Link href="/terms-of-service">Términos y condiciones</Link>.</p>
      </LegalSection>
    </LegalPage>
  );
}
