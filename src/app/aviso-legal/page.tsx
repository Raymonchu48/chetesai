import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalNotice, LegalPage, LegalSection, LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Aviso legal | Chetesaí Fitness+",
  description: "Datos del titular y condiciones generales de acceso a Chetesaí Fitness+.",
};

export default function LegalNoticePage() {
  return (
    <LegalPage title="Aviso legal" summary="Información general sobre el titular, la finalidad y las normas de acceso a la web y al portal Chetesaí Fitness+.">
      <LegalNotice><strong>Dato pendiente:</strong> para completar plenamente la identificación exigida al prestador deben incorporarse el NIF y el domicilio profesional completo del titular. No se han inventado ni publicado esos datos sin tu confirmación.</LegalNotice>

      <LegalSection title="1. Identificación del titular">
        <LegalList>
          <li><strong>Titular:</strong> Ramón Alberto Curbalán Vega.</li>
          <li><strong>Nombre comercial:</strong> Chetesaí Fitness+.</li>
          <li><strong>Sitio web:</strong> <a href="https://www.chetesaifitness.com">www.chetesaifitness.com</a>.</li>
          <li><strong>Actividad:</strong> entrenamiento personal, grupos reducidos, orientación nutricional, hábitos y plataforma digital de seguimiento.</li>
          <li><strong>Ubicación:</strong> Mallorca, Islas Baleares, España.</li>
          <li><strong>Contacto:</strong> <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.</li>
          <li><strong>NIF y domicilio profesional:</strong> pendientes de incorporación tras confirmación del titular.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. Objeto y acceso">
        <p>Este sitio informa sobre los servicios de Chetesaí Fitness+ y facilita solicitudes de valoración, reservas y acceso a un portal privado. El acceso público es gratuito, sin perjuicio del precio de los servicios contratados.</p>
        <p>El usuario se compromete a utilizar la web de forma lícita, diligente y respetuosa, sin dañar sistemas, acceder a cuentas ajenas, introducir código malicioso ni vulnerar derechos de terceros.</p>
      </LegalSection>

      <LegalSection title="3. Propiedad intelectual e industrial">
        <p>La marca, identidad visual, textos, diseños, fotografías, vídeos, fichas, software y demás contenidos propios pertenecen a su titular o se utilizan con autorización. La navegación no concede derechos de explotación más allá del uso personal necesario para recibir el servicio.</p>
        <p>No se permite reproducir, modificar, distribuir o explotar comercialmente estos contenidos sin autorización, salvo en los supuestos permitidos por la ley.</p>
      </LegalSection>

      <LegalSection title="4. Responsabilidad">
        <p>Chetesaí procura mantener la información actualizada y el servicio disponible, pero no garantiza la ausencia absoluta de errores, interrupciones o elementos dañinos. Se aplican medidas razonables de seguridad y mantenimiento.</p>
        <p>Las indicaciones de entrenamiento y nutrición se adaptan a la información disponible y no sustituyen atención médica. El usuario debe comunicar limitaciones relevantes y actuar conforme a las recomendaciones de seguridad.</p>
      </LegalSection>

      <LegalSection title="5. Enlaces y servicios externos">
        <p>La web puede enlazar a proveedores como Google o Stripe. Chetesaí no controla sus contenidos o políticas y cada tercero responde de sus propios servicios. La inclusión de un enlace no implica aprobación de todo su contenido.</p>
      </LegalSection>

      <LegalSection title="6. Privacidad, cookies y contratación">
        <p>El tratamiento de datos se explica en la <Link href="/privacy-policy">Política de privacidad</Link>; las tecnologías de almacenamiento, en la <Link href="/politica-cookies">Política de cookies</Link>; y la relación de servicio, en los <Link href="/terms-of-service">Términos y condiciones</Link>.</p>
      </LegalSection>

      <LegalSection title="7. Legislación y contacto">
        <p>Este sitio se rige por la legislación española. Las controversias se someterán a los órganos competentes que determine la normativa aplicable, respetando en todo caso los derechos y el fuero legal de las personas consumidoras.</p>
        <p>Para comunicar una incidencia relacionada con contenidos, derechos o seguridad, escribe a <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
