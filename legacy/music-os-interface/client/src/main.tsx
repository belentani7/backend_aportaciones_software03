import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const showBootstrapFailure = (error: unknown) => {
  const root = document.getElementById("root");
  console.error("[MUSIC OS bootstrap error]", error);
  if (!root) return;
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:2rem;background:#020703;color:#f5fff7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">
      <section style="width:min(100%,36rem);border:1px solid rgba(29,185,84,.45);border-radius:1rem;padding:2rem;background:rgba(8,24,12,.92);box-shadow:0 0 40px rgba(29,185,84,.12)">
        <p style="margin:0 0 .75rem;color:#1db954;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase">MUSIC OS / BOOT</p>
        <h1 style="margin:0 0 1rem;font:700 1.35rem/1.3 system-ui,sans-serif">MUSIC OS v1.0 no pudo iniciar</h1>
        <p style="margin:0 0 1.5rem;color:#b7c5ba;font:400 .95rem/1.6 system-ui,sans-serif">El arranque encontró un error recuperable. Recarga la página para intentarlo de nuevo.</p>
        <button type="button" onclick="location.reload()" style="border:0;border-radius:.6rem;padding:.7rem 1rem;background:#1db954;color:#021006;font-weight:700;cursor:pointer">Recargar MUSIC OS</button>
      </section>
    </main>`;
};

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (error.message !== UNAUTHED_ERR_MSG) return;
  try {
    window.location.href = getLoginUrl();
  } catch {
    console.error("[MUSIC OS auth redirect error]", error);
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

try {
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        headers() {
          try {
            const raw = window.sessionStorage.getItem("manus-cookie");
            if (raw) {
              const prefix = `${COOKIE_NAME}=`;
              const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
              const token = pair?.trim().slice(prefix.length);
              if (token) return { Authorization: `Bearer ${token}` };
            }
          } catch {
            // sessionStorage unavailable
          }
          return {};
        },
        fetch(input, init) {
          return globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        },
      }),
    ],
  });

  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("MUSIC OS root element is missing");
  createRoot(rootElement).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>,
  );
} catch (error) {
  showBootstrapFailure(error);
}
