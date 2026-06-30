import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin")) return !!token;
      if (path.startsWith("/dashboard")) return !!token;
      if (path.startsWith("/api/auth")) return true;
      if (path.startsWith("/api")) return !!token;
      return true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/profiles/:path*", "/api/tests/:path*", "/api/match/:path*", "/api/introductions/:path*"],
};
