function addEvent() {
    let eventTitle = document.getElementById("eventTitle").value;

    fetch("https://your-backend.onrender.com/add-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: eventTitle })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error("Error:", error));
}
