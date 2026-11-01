import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, LegalList, LegalNotice, LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Condiciones profesionales | Chetesaí Fitness+", description: "Acceso autorizado, confidencialidad y uso de recursos en el panel profesional." };

export default function CondicionesProfesionales() {
  return <LegalPage title="Condiciones para profesionales" summary="Normas para entrenadores, nutricionistas y otros profesionales con acceso autorizado a Chetesaí Fitness+.">
    <LegalNotice>Estas normas informativas complementan, pero no sustituyen, los contratos profesionales, acuerdos de confidencialidad o encargos de tratamiento de datos que legalmente correspondan.</LegalNotice>
    <LegalSection title="1. Acceso y permisos"><LegalList>
      <li>La cuenta es personal, no transferible, y permite consultar únicamente clientes y funciones expresamente asignados.</li>
      <li>Se prohíbe compartir credenciales, eludir controles o acceder a expedientes ajenos.</li>
      <li>El titular podrá ajustar o revocar el acceso por razones organizativas, contractuales o de seguridad.</li>
    </LegalList></LegalSection>
    <LegalSection title="2. Datos y confidencialidad">
      <p>Los profesionales deben mantener la confidencialidad de los datos personales y de salud, utilizarlos solo para fines autorizados, seguir las instrucciones documentadas pertinentes y notificar sin demora cualquier incidente de seguridad. El deber de secreto continúa tras finalizar la colaboración.</p>
      <p>Los acuerdos específicos definirán las responsabilidades de cada parte y, cuando proceda, las obligaciones de encargado del tratamiento conforme al RGPD.</p>
    </LegalSection>
    <LegalSection title="3. Propiedad intelectual">
      <p>Los materiales propios de Chetesaí Fitness+, incluidas fichas de ejercicios, planes, vídeos, fotografías, diseños y software, solo pueden utilizarse para prestar el servicio autorizado. No se permite su difusión, venta, exportación masiva o reutilización comercial sin permiso o habilitación legal.</p>
      <p>Los materiales de terceros conservan sus licencias. La titularidad de aportaciones originales de profesionales se determinará mediante acuerdos específicos, sin presumir una cesión automática.</p>
    </LegalSection>
    <LegalSection title="4. Uso responsable">
      <p>Las intervenciones profesionales deberán respetar la formación y competencias de cada persona. Los planes creados con asistencia de IA requieren revisión humana competente antes de su asignación.</p>
    </LegalSection>
    <LegalSection title="5. Finalización y documentos relacionados">
      <p>Una vez terminado el acceso deberán cesar los tratamientos no autorizados y devolver o eliminar copias cuando corresponda, respetando los deberes legales de conservación.</p>
      <p>Consulta el <Link href="/aviso-legal">aviso legal</Link>, la <Link href="/privacy-policy">política de privacidad</Link> y los <Link href="/terms-of-service">términos generales</Link>. Consultas: <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.</p>
    </LegalSection>
  </LegalPage>;
}
