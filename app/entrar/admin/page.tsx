import { redirect } from "next/navigation";

// O login e unico: o Admin entra em /entrar com o Codigo Admin.
export default function EntrarAdmin() {
  redirect("/entrar");
}
