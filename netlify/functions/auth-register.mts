import type { Context, Config } from "@netlify/functions";
import { neon } from "@netlify/neon";

// Simple hash function (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async (req: Request, context: Context) => {
  const sql = neon();

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email y contraseña requeridos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: "Formato de email inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ message: "La contraseña debe tener al menos 6 caracteres" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar si el email ya existe
    const existingUsers = await sql`
      SELECT id FROM usuarios WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ message: "El email ya está registrado" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(password);

    // Insertar usuario
    await sql`
      INSERT INTO usuarios (email, password_hash)
      VALUES (${email}, ${passwordHash})
    `;

    return new Response(
      JSON.stringify({
        message: "Registro exitoso",
        email,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return new Response(
      JSON.stringify({ message: "Error en el servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/auth/register",
};
