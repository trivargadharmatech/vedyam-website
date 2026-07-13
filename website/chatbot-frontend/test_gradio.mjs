import { Client } from "@gradio/client";

async function run() {
  console.log("Connecting to Gradio space...");
  const client = await Client.connect("vijayyh/VedyamChatBot1.0.0");
  console.log("Connected!");

  console.log("Sending query...");
  // Find the exact API name. Gradio default chat is /chat
  const result = await client.predict("/chat", [
      "Who is Krishna?", 
      [] // Empty history
  ]);

  console.log("Result:", result.data);
}

run().catch(console.error);
