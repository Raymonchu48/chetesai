import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalNotice, LegalPage, LegalSection, LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Términos y condiciones | Chetesaí Fitness+",
  description: "Condiciones de acceso y uso de los servicios de Chetesaí Fitness+.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones" summary="Estas condiciones regulan el acceso a la web, el portal privado y los servicios de entrenamiento, nutrición, hábitos, reservas y seguimiento de Chetesaí Fitness+.">
      <LegalNotice><strong>Información de salud:</strong> los contenidos y planes de Chetesaí son educativos y de acondicionamiento físico. No sustituyen diagnóstico, tratamiento, fisioterapia ni atención médica. Ante dolor, mareo o síntomas inusuales, interrumpe la actividad y consulta a un profesional sanitario.</LegalNotice>

      <LegalSection title="1. Titular y aceptación">
        <p>El servicio es prestado por Ramón Alberto Curbalán Vega bajo la marca Chetesaí Fitness+. Al utilizar la web, solicitar una valoración, contratar un plan o acceder al portal, aceptas estas condiciones y las políticas vinculadas.</p>
        <p>Si no estás de acuerdo, no debes utilizar la cuenta o los servicios contratados y puedes contactar mediante <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.</p>
      </LegalSection>

      <LegalSection title="2. Servicios">
        <LegalList>
          <li>Valoración inicial y planificación personalizada.</li>
          <li>Entrenamiento personal y grupos reducidos.</li>
          <li>Programación de rutinas, seguimiento técnico y registro de progreso.</li>
          <li>Orientación nutricional y hábitos dentro del ámbito profesional ofrecido.</li>
          <li>Portal privado para citas, sesiones, pagos, planes y comunicaciones.</li>
        </LegalList>
        <p>La propuesta concreta, frecuencia, lugar, precio y duración aplicables serán los mostrados o aceptados al contratar.</p>
      </LegalSection>

      <LegalSection title="3. Aptitud y responsabilidad del cliente">
        <p>Debes facilitar información veraz sobre tu estado de salud, lesiones, limitaciones, embarazo, medicación o cualquier circunstancia relevante para entrenar de forma segura, y actualizarla si cambia.</p>
        <p>Te comprometes a seguir las indicaciones técnicas, utilizar el material correctamente y comunicar cualquier molestia. Chetesaí podrá adaptar, pausar o rechazar una actividad cuando existan riesgos que requieran valoración sanitaria previa.</p>
      </LegalSection>

      <LegalSection title="4. Cuenta y acceso">
        <LegalList>
          <li>La cuenta es personal e intransferible.</li>
          <li>Debes custodiar tus credenciales y avisar si detectas un acceso no autorizado.</li>
          <li>No puedes intentar acceder a información ajena, alterar la plataforma, introducir código malicioso o utilizarla con fines ilícitos.</li>
          <li>Podremos suspender accesos por seguridad, incumplimiento grave o finalización de la relación, informando cuando corresponda.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Reservas, cambios y cancelaciones">
        <p>Las citas quedan sujetas a disponibilidad y confirmación. Salvo que la modalidad contratada indique otra cosa, las sesiones podrán reubicarse dentro del mismo mes cuando se avise con al menos 24 horas y exista disponibilidad.</p>
        <p>Las ausencias o cancelaciones tardías podrán computarse como sesión realizada. Si Chetesaí cancela una sesión, se ofrecerá una alternativa o recuperación equivalente.</p>
      </LegalSection>

      <LegalSection title="6. Precios, bonos y pagos">
        <p>El precio, impuestos aplicables, periodicidad y prestaciones se mostrarán antes de confirmar una contratación. Los planes publicados no tienen matrícula ni permanencia salvo que se informe expresamente de una condición distinta.</p>
        <p>Los pagos electrónicos pueden gestionarse mediante Stripe. Chetesaí recibe el estado y el identificador de la operación, pero no almacena los datos completos de la tarjeta. Los impagos podrán suspender temporalmente el acceso a servicios pendientes.</p>
      </LegalSection>

      <LegalSection title="7. Desistimiento y reembolsos">
        <p>Cuando resulte aplicable el derecho de desistimiento de consumidores, se informará de su plazo y forma de ejercicio antes de contratar. Si solicitas que un servicio comience durante ese plazo, podrán aplicarse las consecuencias legalmente previstas al servicio ya ejecutado.</p>
        <p>Los reembolsos, cambios de bono o devoluciones se resolverán según la modalidad contratada y la normativa de consumidores aplicable.</p>
      </LegalSection>

      <LegalSection title="8. Propiedad intelectual y contenidos">
        <p>La marca, diseño, textos, fotografías, vídeos, fichas de ejercicios, planes y demás contenidos propios están protegidos. Se concede al cliente un uso personal de los materiales asignados; no pueden venderse, difundirse o reutilizarse comercialmente sin autorización.</p>
        <p>El contenido aportado por el cliente seguirá siendo suyo. Autoriza su tratamiento únicamente para prestar el servicio, conforme a la <Link href="/privacy-policy">Política de privacidad</Link>.</p>
      </LegalSection>

      <LegalSection title="9. Disponibilidad y responsabilidad">
        <p>Trabajamos para mantener la plataforma disponible y segura, aunque pueden producirse mantenimientos, actualizaciones o incidencias ajenas. Cuando sea posible, se restaurará el servicio y la información desde las medidas de continuidad existentes.</p>
        <p>Nada de estas condiciones limita los derechos irrenunciables de consumidores ni excluye responsabilidades que legalmente no puedan excluirse.</p>
      </LegalSection>

      <LegalSection title="10. Legislación y contacto">
        <p>Estas condiciones se rigen por la legislación española. En caso de conflicto con una persona consumidora, serán competentes los órganos y tribunales que determine la normativa aplicable; no se impone una renuncia a su fuero legal.</p>
        <p>Para consultas o reclamaciones, escribe a <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. Podremos actualizar estas condiciones cuando cambien los servicios o la normativa, publicando siempre la fecha de la versión vigente.</p>
      </LegalSection>
    </LegalPage>
  );
}
