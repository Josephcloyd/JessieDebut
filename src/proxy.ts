import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

const LOGIN_PATH = "/admin/login";

/** Keeps the admin session fresh and turns away visitors with no session. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;
  if (!isSupabaseConfigured) {
    return isLoginPage ? NextResponse.next() : NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user && !isLoginPage) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
