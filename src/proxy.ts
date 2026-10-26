import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|sw\\.js|manifest\\.webmanifest|icon\\.svg|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|css|js|json|xml)).*)",
    "/llms.txt",
    "/llms-full.txt",
    "/fr/llms.txt",
    "/fr/llms-full.txt",
  ],
};
