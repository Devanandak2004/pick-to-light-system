let partsData = [];

// Load saved scan history
let scanHistory =
    JSON.parse(localStorage.getItem("scanHistory")) || [];

// Load JSON data
fetch('parts.json')
    .then(response => response.json())
    .then(data => {
        partsData = data;
        console.log("Parts Loaded");
        updateHistoryTable();
    })
    .catch(error => {
        console.error("Error loading JSON:", error);
    });

// Manual Search
function findPart() {
    const enteredPart = document.getElementById("partInput").value.trim();
    searchPart(enteredPart);
}

// Search Function
function searchPart(partNumber) {
    const result = partsData.find(
        item => item.part.trim() === partNumber.trim()
    );

    if (result) {
        document.getElementById("result").innerHTML = `
            <h3>Part Found</h3>
            Part Number: ${result.part} <br>
            Location: ${result.location} <br>
            Min Qty: ${result.min} <br>
            Max Qty: ${result.max} <br>
            LED Number: ${result.led}
        `;

        scanHistory.push({
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            part: result.part,
            location: result.location
        });

        localStorage.setItem("scanHistory", JSON.stringify(scanHistory));
        updateHistoryTable();
    } else {
        document.getElementById("result").innerHTML = "<h3>Part Not Found</h3>";
    }
}

// Update History Table
function updateHistoryTable() {
    let table = document.getElementById("historyTable");

    table.innerHTML =
        `<tr>
           <th>Date</th>
           <th>Time</th>
           <th>Part Number</th>
           <th>Location</th>
         </tr>`;

    scanHistory.forEach(scan => {
        table.innerHTML +=
            `<tr>
               <td>${scan.date}</td>
               <td>${scan.time}</td>
               <td>${scan.part}</td>
               <td>${scan.location}</td>
             </tr>`;
    });
}

// Export CSV
function exportHistory() {
    let csv = "Date,Time,Part Number,Location\n";

    scanHistory.forEach(scan => {
        csv += `${scan.date},${scan.time},${scan.part},${scan.location}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "PickToLightHistory.csv";
    a.click();

    window.URL.revokeObjectURL(url);
}

// Clear History
function clearHistory() {
    if (confirm("Delete all scan history?")) {
        scanHistory = [];

        localStorage.removeItem("scanHistory");

        updateHistoryTable();
    }
}

// QR Scan Success
function onScanSuccess(decodedText) {
    // Stop scanner after first successful scan
    if (typeof html5QrcodeScanner !== 'undefined' && html5QrcodeScanner) {
        try { html5QrcodeScanner.clear(); } catch (e) { /* ignore */ }
    }

    document.getElementById("partInput").value = decodedText;
    searchPart(decodedText);
    document.getElementById("scanStatus").innerHTML = "<h3 style='color:green'>✓ Scan Complete</h3>";
}

// Restart Scanner
function restartScanner() {
    document.getElementById("scanStatus").innerHTML = "";

    if (typeof html5QrcodeScanner !== 'undefined' && html5QrcodeScanner) {
        try { html5QrcodeScanner.clear(); } catch (e) { /* ignore */ }
    }

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: 250 }
    );

    html5QrcodeScanner.render(onScanSuccess);
}

// Start Scanner
let html5QrcodeScanner = null;

// Initialize scanner on load
document.addEventListener('DOMContentLoaded', () => {
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
});