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

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Simple JWT-like token (in production, use proper JWT library)
function generateToken(userId: number, email: string): string {
  const payload = {
    userId,
    email,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return btoa(JSON.stringify(payload));
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

    // Buscar usuario
    const users = await sql`
      SELECT id, email, password_hash FROM usuarios WHERE email = ${email}
    `;

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ message: "Credenciales inválidas" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const user = users[0];
    const validPassword = await verifyPassword(password, user.password_hash);

    if (!validPassword) {
      return new Response(
        JSON.stringify({ message: "Credenciales inválidas" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generar token
    const token = generateToken(user.id, user.email);

    return new Response(
      JSON.stringify({
        token,
        email: user.email,
        message: "Login exitoso",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en login:", error);
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
  path: "/api/auth/login",
};
