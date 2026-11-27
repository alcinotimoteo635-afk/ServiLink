import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Guarda a foto com nome novo e aleatorio (nunca o nome original) no bucket publico "fotos".
export async function guardarFoto(
  admin: SupabaseClient,
  pasta: string,
  userId: string,
  f: { bytes: Buffer; ext: string; mime: string }
): Promise<string | null> {
  const caminho = `${pasta}/${userId}/${crypto.randomUUID()}.${f.ext}`;
  const { error } = await admin.storage.from("fotos").upload(caminho, f.bytes, {
    contentType: f.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[fotos] upload falhou:", error.message);
    return null;
  }
  return admin.storage.from("fotos").getPublicUrl(caminho).data.publicUrl;
}
