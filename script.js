async function load() {
  const symbol = "AAPL";

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

  const r = await fetch(url);
  const data = await r.json();

  console.log(data);

  document.getElementById("output").innerText =
    JSON.stringify(data, null, 2);
}

load();
