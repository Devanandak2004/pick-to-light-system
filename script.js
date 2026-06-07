let partsData = [];

// Load saved scan history
let scanHistory = JSON.parse(localStorage.getItem("scanHistory")) || [];

// Load JSON data
fetch("parts.json")
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        partsData = data;
        console.log("Parts Loaded");
        updateHistoryTable();
    })
    .catch(function(error) {
        console.error("Error loading JSON:", error);
    });

// Manual Search
function findPart() {
    var enteredPart = document.getElementById("partInput").value.trim();
    searchPart(enteredPart);
}

// Search Function
function searchPart(partNumber) {
    var result = partsData.find(function(item) {
        return item.part.trim() === partNumber.trim();
    });

    if (result) {
        document.getElementById("result").innerHTML =
            "<h3>Part Found</h3>" +
            "Part Number: " + result.part + "<br>" +
            "Location: " + result.location + "<br>" +
            "Min Qty: " + result.min + "<br>" +
            "Max Qty: " + result.max + "<br>" +
            "LED Number: " + result.led;

        // Trigger ESP32 LED
        fetch("http://10.190.110.228/led" + result.led)
            .then(function(response) {
                return response.text();
            })
            .then(function(data) {
                console.log("ESP32 Response:", data);
            })
            .catch(function(error) {
                console.error("ESP32 Communication Error:", error);
            });

        scanHistory.push({
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            part: result.part,
            location: result.location
        });

        localStorage.setItem("scanHistory", JSON.stringify(scanHistory));
        updateHistoryTable();
    } else {
        document.getElementById("result").innerHTML =
            "<h3>Part Not Found</h3>";
    }
}

// Update History Table
function updateHistoryTable() {
    var table = document.getElementById("historyTable");

    table.innerHTML =
        "<tr>" +
        "<th>Date</th>" +
        "<th>Time</th>" +
        "<th>Part Number</th>" +
        "<th>Location</th>" +
        "</tr>";

    scanHistory.forEach(function(scan) {
        table.innerHTML +=
            "<tr>" +
            "<td>" + scan.date + "</td>" +
            "<td>" + scan.time + "</td>" +
            "<td>" + scan.part + "</td>" +
            "<td>" + scan.location + "</td>" +
            "</tr>";
    });
}

function checkESP32Status() {

    fetch("http://10.190.110.228/status")

    .then(function(response) {

        document.getElementById(
                "statusDot"
            ).style.background =
            "#19a857";

        document.getElementById(
                "statusText"
            ).innerHTML =
            "Connected";

    })

    .catch(function(error) {

        document.getElementById(
                "statusDot"
            ).style.background =
            "red";

        document.getElementById(
                "statusText"
            ).innerHTML =
            "Disconnected";

    });

}

// Export CSV
function exportHistory() {
    var csv = "Date,Time,Part Number,Location\n";

    scanHistory.forEach(function(scan) {
        csv += scan.date + "," + scan.time + "," + scan.part + "," + scan.location + "\n";
    });

    var blob = new Blob([csv], { type: "text/csv" });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");

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
    if (typeof html5QrcodeScanner !== "undefined" && html5QrcodeScanner) {
        try {
            html5QrcodeScanner.clear();
        } catch (e) {}
    }

    document.getElementById("partInput").value = decodedText;
    searchPart(decodedText);

    document.getElementById("scanStatus").innerHTML =
        "<h3 style='color:green'>✓ Scan Complete</h3>";
}

// Restart Scanner
function restartScanner() {
    document.getElementById("scanStatus").innerHTML = "";

    if (typeof html5QrcodeScanner !== "undefined" && html5QrcodeScanner) {
        try {
            html5QrcodeScanner.clear();
        } catch (e) {}
    }

    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
}

// Start Scanner
let html5QrcodeScanner = null;

// Initialize scanner on load
document.addEventListener("DOMContentLoaded", function() {
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
    setInterval(
        checkESP32Status,
        5000
    );

    checkESP32Status();
});