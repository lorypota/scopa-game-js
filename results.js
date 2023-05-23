const urlParams = new URLSearchParams(window.location.search);
const results = urlParams.get('results');

document.getElementById("results").innerHTML = results;