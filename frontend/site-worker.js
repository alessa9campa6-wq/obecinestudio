// Serve la versione web di CineStudio (export Expo statico) su Freebuff Sites.
// Le rotte dell'app sono gestite lato client, quindi ogni indirizzo sconosciuto
// torna index.html invece di dare 404 (ricarica su /profilo, /project/..., ecc.).
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return response;
    const index = new URL("/index.html", url);
    return env.ASSETS.fetch(new Request(index.toString(), request));
  },
};
