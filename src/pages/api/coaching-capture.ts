export const prerender = false;

export const POST = async ({ request }) => {
  const data = await request.json();

  // NOTE FOR RAINERS: You must paste your Make.com Webhook 2 URL here!
  const MAKE_WEBHOOK_2 = "https://hook.eu1.make.com/YOUR_NEW_WEBHOOK_URL_HERE";

  try {
    const response = await fetch(MAKE_WEBHOOK_2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Pipe failure");

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error" }), { status: 500 });
  }
};
