import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin")) return token?.role === "admin";
      if (path.startsWith("/dashboard")) return token?.role === "user";
      if (path.startsWith("/wall")) return token?.role === "user";
      if (path.startsWith("/mbti")) return token?.role === "user";
      if (path.startsWith("/api/auth")) return true;
      if (path.startsWith("/api")) return !!token;
      return true;
    },
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/wall/:path*",
    "/mbti/:path*",
    "/introduction/:path*",
    "/api/profiles/:path*",
    "/api/tests/:path*",
    "/api/match/:path*",
    "/api/match-requests/:path*",
    "/api/introductions/:path*",
    "/api/user/:path*",
    "/api/upload/:path*",
    "/api/wall/:path*",
  ],
};
