let webLink = "https://sgu-calendar.onrender.com";

function login() {
    window.location.href = webLink + "/login";
}


function addEvent() {
    let eventTitle = document.getElementById("eventTitle").value;
    let eventStart = document.getElementById("eventStart").value;
    let eventEnd = document.getElementById("eventEnd").value;
    let storedToken = localStorage.getItem("oauth_token");  // Retrieve token

    if (!storedToken) {
        alert("Please log in first!");
        return;
    }

    let eventData = {
        title: eventTitle,
        start: eventStart,
        end: eventEnd
    };

    fetch(webLink + "/add-event", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        alert("Event added successfully: " + data.event_link);
    })
    .catch(error => console.error("Error:", error));
}
