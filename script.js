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
const REDIRECT_URI = "https://denbachieu.github.io/SGU-Calendar/";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPE}`;

function login() {
    window.location.href = AUTH_URL;
}

function getTokenFromURL() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const storedToken = hashParams.get("oauth_token") || hashParams.get("access_token");
    if (storedToken) {
        localStorage.setItem("oauth_token", storedToken);
        addEvent(true);
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
    let storedToken = localStorage.getItem("oauth_token");
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

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${storedToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
    });

    if (response.ok) {
        return true;
    } else {
        return false;
    }
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
    let pattern = /([0-9]{2})\/([0-9]{2})\/([0-9]{2}) .+ ([0-9]{2})\/([0-9]{2})\/([0-9]{2})/;
    let match = input.match(pattern);
    if (!match) {
        console.error("Invalid date format:", input);
        return [0, 0, 0, 0, 0, 0];
    }
    else {
        return [
            match[1], match[2], match[3],
            match[4], match[5], match[6]
        ]
    }
}

function resetButton() {
    let button = document.getElementById("add-button");
    button.textContent = "Add to Google Calendar";
    button.disabled = false;
}

async function addEvent(logged = false) {
    let inputer = document.getElementById("input");
    let input = inputer.value;
    let button = document.getElementById("add-button");
    button.textContent = "Adding...";
    button.disabled = true;

    let storedToken = localStorage.getItem("oauth_token");

    if (!logged) {
        localStorage.setItem("input", input);
        login();
        resetButton();
        return;
    }
    else if (input != null || input == "") {
        //Get the saved input if there is no input in the text area
        input = localStorage.getItem("input");
        inputer.value = input;
    }

    if (input == null || input.indexOf("THỜI KHÓA BIỂU DẠNG HỌC KỲ") == -1) {
        alert("Invalid input format. Please check the input and try again.");
        resetButton();
        return;
    }

    let name = "SGU Calendar";
    let match = input.match(/\s(Học kỳ [0-9]+)\s/);
    if (match) {
        name =  match[1].trim();
    }

    //Create new calendar
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
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

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("calendarId", data.id);
    } else {
        alert("Failed to create calendar. Check authentication or permissions.");
        resetButton();
        return;
    }

    let lines = input.split("\n");
    let i = 0;
    for (i = 0; i < lines.length; i++) {
        let j = lines[i].search(/^\s*[0-9]{6}\s/);
        if (j != -1) {
            break;
        }
    }

    let success = true;
    while (i < lines.length && lines[i].search(/^\s*[0-9]{6}\s/) != -1) {
        let infos = lines[i].split("\t");
        let code = infos[0].trim();
        let name = infos[1].trim();
        let group = infos[2].trim();
        let credit = infos[3].trim();
        let classCode = infos[4].trim();
        let color = (Math.floor(Math.random() * 11) + 1).toString();

        let [day,start,time,room,teacher,range] = extractData(infos.slice(5));
        let [daya, montha, yeara, dayb, monthb, yearb] = getDate(range);
        let startDate = "20" + yeara + "-" + montha + "-" + daya + "T" + startTime[Number(start) - 1] + ":00";
        let endDate = "20" + yeara + "-" + montha + "-" + daya + "T" + endTime[Number(start) + Number(time) - 2] + ":00";
        let result = addEventToGoogle(
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
        if (!result) {
            success = false;
        }

        i++;
        while (lines[i].search(/^\s*[0-9]\s/) != -1) {
            infos = lines[i].split("\t");
            [day,start,time,room,teacher,range] = extractData(infos);
            [daya, montha, yeara, dayb, monthb, yearb] = getDate(range);
            startDate = "20" + yeara + "-" + montha + "-" + daya + "T" + startTime[Number(start) - 1] + ":00";
            endDate = "20" + yeara + "-" + montha + "-" + daya + "T" + endTime[Number(start) + Number(time) - 2] + ":00";
            let result = addEventToGoogle(
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
            if (!result) {
                success = false;
            }

            i++;
        }
    }
    resetButton();
    localStorage.setItem("input", "");
    if (success) {
        alert("Events added to calendar successfully!");
    }
    else {
        alert("Events failed to be added to calendar!");
    }
    console.log("Finished");
}

/*async function addEvent() {
    let input = document.getElementById("input").value;
    let storedToken = localStorage.getItem("oauth_token");  // Retrieve token

    if (input.indexOf("THỜI KHÓA BIỂU DẠNG HỌC KỲ") == -1) {
        alert("Invalid input format. Please check the input and try again.");
        return;
    }

    if (!storedToken) {
        login();
        addEvent();
        return;
    }

    let name = "SGU Calendar";
    let match = input.match(/\s(Học kỳ [0-9]+)\s/);
    if (match) {
        name =  match[1].trim();
    }

    //Create new calendar
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
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

    const data = await response.json();

    if (response.ok) {
        console.log("Calendar created successfully!", data);
        localStorage.setItem("calendarId", data.id);
    } else {
        console.error("Error creating calendar:", data);
        alert("Failed to create calendar. Check authentication or permissions.");
        return;
    }
    
    let i = input.search(/\s[0-9]{6}\s/);
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

        let [day,start,time,room,teacher,range] = extractData(infos.slice(5));
        let [daya, montha, yeara, dayb, monthb, yearb] = getDate(range);
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
        input = input.slice(j + range.length + 1);
        j = input.search(/\s[0-9]\s/);
        while (j >= 0 && j <= 3) {
            infos = input.split("\t");
            [day,start,time,room,teacher,range] = extractData(infos);
            [daya, montha, yeara, dayb, monthb, yearb] = getDate(range);
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
            input = input.slice(j + range.length + 1);
            j = input.search(/\s[0-9]\s/);
        }
        i = input.search(/\s[0-9]{6}\s/);
    }
    console.log("Finished");
    alert("Events added to calendar successfully!");
}*/

window.onload = getTokenFromURL;