let webLink = "https://sgu-calendar.onrender.com";
let startTime = [
    "07:00", "07:50", "09:00", "09:50", "10:40", 
    "13:00", "13:50", "15:00", "15:50", "16:40", "17:40", "18:30", "19:20"
]
let endTime = [
    "07:50", "08:40", "09:50", "10:40", "11:30", 
    "13:50", "14:40", "15:50", "16:40", "17:30", "18:30", "19:20", "20:10"
]
let dayOfWeek = [
    "MO", "TU", "WE", "TH", "FR", "SA", "SU"
]

const CLIENT_ID = "257937309503-8102k6ntknn262kme876mb0r9l5lafka.apps.googleusercontent.com";
const REDIRECT_URI = "https://denbachieu.github.io/SGU-Calendar-Frontend";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPE}`;

function login() {
    window.location.href = AUTH_URL;
}

function getAccessToken() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return hashParams.get("oauth_token") || hashParams.get("access_token");
}

function getTokenFromURL() {
    const accessToken = getAccessToken();
    if (accessToken) {
        localStorage.setItem("oauth_token", accessToken);
        alert("Authentication successful! Token stored.");
    } else {
        alert("Failed to retrieve access token.");
    }
}

function extractData(input) {
    let day = input[0].trim();
    let start = input[1].trim();
    let time = input[2].trim();
    let room = input[3].trim();
    let teacher = input[4].trim();
    let pattern = /[0-9]{2}\/[0-9]{2}\/[0-9]{2} đến [0-9]{2}\/[0-9]{2}\/[0-9]{2}/;
    let a = input[5].search(pattern);
    let range = input[5].slice(a, a + 21).trim();
    return [day,start,time,room,teacher,range];
}

async function addEventToGoogle(
    summary, place, desc, start, end, rule, colorId
) {
    let storedToken = localStorage.getItem("oauth_token");  // Retrieve token
    const calendarId = localStorage.getItem("calendarId");
    eventData = {
        "summary": summary,
        "location": place,
        "description": desc,
        "start": {  
            "dateTime": start,
            "timeZone": "Asia/Ho_Chi_Minh"
        },
        "end": {
            "dateTime": end,
            "timeZone": "Asia/Ho_Chi_Minh"
        },
        "recurrence": [rule],
        "reminders": {
            "useDefault": true,
        },
        "colorId": colorId
    }

    console.log("Event Data Being Sent:", eventData);

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${storedToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
    });

    if (response.ok) {
        alert("Event added successfully!");
    } else {
        alert("Failed to add event. Please check authentication.");
    }

    /*fetch(webLink + "/add-event", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify({event:eventData})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Event added successfully:", data);
        alert("Event added successfully");
    })
    .catch(error => {
        console.error("Error Adding Event:", error)
        alert("Event failed to be added");
    });*/
}

function getDesc(code,group,credit,classCode,room,teacher) {
    let output = "Mã MH: " + code + "\n";
    output += "Nhóm tổ: " + group + "\n";
    output += "Số tín chỉ: " + credit + "\n";
    output += "Lớp: " + classCode + "\n";
    output += "Phòng: " + room + "\n";
    output += "Giảng viên: " + teacher;
    return output;
}

function getDate(input) {
    let pattern = /[0-9]{2}\/[0-9]{2}\/[0-9]{2}/;
    let a = input.search(pattern);
    let b = input.slice(a, a + 8).trim();
    let day = b.slice(0, 2);
    let month = b.slice(3, 5);
    let year = b.slice(6, 8);
    return [day, month, year];
}

function addEvent() {
    let input = document.getElementById("input").value;
    let storedToken = localStorage.getItem("oauth_token");  // Retrieve token

    if (input.indexOf("THỜI KHÓA BIỂU DẠNG HỌC KỲ") == -1) {
        alert("Invalid input format. Please check the input and try again.");
        return;
    }

    if (!storedToken) {
        alert("Please log in first!");
        login();
        return;
    }

    let name
    let i = input.search(/\sHọc kỳ [0-9]+\s/);
    if (i != -1) {
        name = input.slice(i + 1, i + 10).trim();
    }

    //Create new calendar
    fetch("https://www.googleapis.com/calendar/v3/calendars", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${storedToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            summary: name,
            timeZone: "Asia/Ho_Chi_Minh"
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("New calendar created!", data);
        localStorage.setItem("calendarId", data.id); // Store calendar ID for later use
    });
    
    
    i = input.search(/\s[0-9]{6}\s/);
    if (i != -1) {
        input = input.slice(i);
    }
    while (i != -1) {
        let infos = input.split("\t");
        let code = infos[0].trim();
        let name = infos[1].trim();
        let group = infos[2].trim();
        let credit = infos[3].trim();
        let classCode = infos[4].trim();
        let color = (Math.floor(Math.random() * 11) + 1).toString();
        /*console.log("Mã MH: " + code);
        console.log("Tên: " + name);
        console.log("Nhóm: " + group);
        console.log("Số tín: " + credit);
        console.log("Lớp: " + classCode);*/

        let [day,start,time,room,teacher,range] = extractData(infos.slice(5));
        let [daya, montha, yeara] = getDate(range);
        let [dayb, monthb, yearb] = getDate(range.slice(10));
        let startDate = "20" + yeara + "-" + montha + "-" + daya + "T" + startTime[Number(start) - 1] + ":00";
        let endDate = "20" + yeara + "-" + montha + "-" + daya + "T" + endTime[Number(start) + Number(time) - 2] + ":00";
        addEventToGoogle(
            summary = name,
            place = room,
            desc = getDesc(code,group,credit,classCode,room,teacher),
            start = startDate,
            end = endDate,
            rule = "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=" + 
            dayOfWeek[Number(day) - 2] + 
            ";UNTIL=20" + yearb + monthb + dayb + "T235959Z",
            colorId = color
        );

        let j = input.indexOf(range);
        input = input.slice(j + 21);
        j = input.search(/\s[0-9]\s/);
        while (j >= 0 && j <= 3) {
            infos = input.split("\t");
            [day,start,time,room,teacher,range] = extractData(infos);
            [daya, montha, yeara] = getDate(range);
            [dayb, monthb, yearb] = getDate(range.slice(10));
            startDate = "20" + yeara + "-" + montha + "-" + daya + "T" + startTime[Number(start) - 1] + ":00";
            endDate = "20" + yeara + "-" + montha + "-" + daya + "T" + endTime[Number(start) + Number(time) - 2] + ":00";
            addEventToGoogle(
                summary = name,
                place = room,
                desc = getDesc(code,group,credit,classCode,room,teacher),
                start = startDate,
                end = endDate,
                rule = "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=" + 
                dayOfWeek[Number(day) - 2] + 
                ";UNTIL=20" + yearb + monthb + dayb + "T235959Z",
                colorId = color
            );

            j = input.indexOf(range);
            input = input.slice(j + 21);
            j = input.search(/\s[0-9]\s/);
        }
        i = input.search(/\s[0-9]{6}\s/);
    }
    console.log("Finished");
}

window.onload = getTokenFromURL;