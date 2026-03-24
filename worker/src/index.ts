export interface Env {
  REMOVEBG_API_KEY: string;
}

function json(status: number, obj: any) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST" || url.pathname !== "/api/remove-bg") {
      return json(404, { error: "Not found" });
    }

    if (!env.REMOVEBG_API_KEY) {
      return json(500, { error: "Server not configured: missing REMOVEBG_API_KEY" });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json(400, { error: "Expected multipart/form-data" });
    }

    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return json(400, { error: "Missing file field: image" });
    }

    if (file.size > 10 * 1024 * 1024) {
      return json(413, { error: "Image too large (max 10MB)" });
    }

    const rbForm = new FormData();
    rbForm.set("image_file", file, file.name || "image");
    rbForm.set("size", "auto");

    const rbResp = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": env.REMOVEBG_API_KEY,
      },
      body: rbForm,
    });

    if (!rbResp.ok) {
      let text = "";
      try {
        text = await rbResp.text();
      } catch {}
      return json(rbResp.status, { error: "remove.bg failed", detail: text.slice(0, 2000) });
    }

    const out = await rbResp.arrayBuffer();
    return new Response(out, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
