const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", e => console.error("JSDOM Error Event:", e));
  virtualConsole.on("error", e => console.error("Console Error:", e));
  virtualConsole.on("warn", e => console.warn("Console Warn:", e));

  try {
    const dom = await JSDOM.fromURL('http://localhost:5173/chatbot?from=website&query=Tell%20me%20about%20Karma&history=%5B%7B%22role%22%3A%22user%22%2C%22text%22%3A%22Tell%20me%20about%20Karma%22%7D%5D', {
      runScripts: "dangerously",
      resources: "usable",
      virtualConsole
    });

    console.log("Loading started... waiting 4 seconds");
    setTimeout(() => {
      console.log("HTML:", dom.window.document.body.innerHTML.substring(0, 500));
      process.exit(0);
    }, 4000);
  } catch (e) {
    console.error("JSDOM Error:", e);
  }
})();
