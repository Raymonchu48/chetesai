import { redirect } from "next/navigation";

export default function EspaldaPage() {
  redirect("/ejercicios/entrenamiento?grupo=espalda");
}
