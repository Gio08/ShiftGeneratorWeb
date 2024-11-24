function updateShiftDays() {
    const monthYear = document.getElementById('month').value;
    const month = new Date(monthYear).getMonth() + 1;
    const year = new Date(monthYear).getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    let exceptionsHtml = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 2 || dayOfWeek === 6) {
            const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
            const dayString = dayOfWeek === 2 ? "Tuesday" : "Saturday";
            exceptionsHtml += `<div>
                <label for="exception_${formattedDate}">${dayString} ${formattedDate}:</label>
                <textarea id="exception_${formattedDate}" name="exception_${formattedDate}" rows="3" cols="50"></textarea>
                <label for="skip_${formattedDate}">Skip:</label>
                <input type="checkbox" id="skip_${formattedDate}" name="skip_${formattedDate}">
            </div>`;
        }
    }

    document.getElementById('exceptions-list').innerHTML = exceptionsHtml;
    document.getElementById('shifts-exceptions').style.display = 'block';
}

function generateShifts() {
    const monthYear = document.getElementById('month').value;
    const month = new Date(monthYear).getMonth() + 1;
    const year = new Date(monthYear).getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    const acusticaCount = parseInt(document.getElementById('acustica-count').value); // Get the number of people for Acustica
    const acustica = document.getElementById('acustica').value.trim().split('\n');
    const microfonisti = document.getElementById('microfonisti').value.trim().split('\n');
    const uscieri = document.getElementById('uscieri').value.trim().split('\n');

    const shiftCount = {
        acustica: initShiftCount(acustica),
        microfonisti: initShiftCount(microfonisti),
        uscieri: initShiftCount(uscieri)
    };

    const shifts = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 2 || dayOfWeek === 6) {
            const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
            const dayString = dayOfWeek === 2 ? "Tuesday" : "Saturday";
            if (!document.getElementById(`skip_${formattedDate}`).checked) {
                const exceptions = new Set(document.getElementById(`exception_${formattedDate}`).value.trim().split('\n').filter(Boolean));
                const alreadyAssigned = new Set();

                // Use acusticaCount for the number of people in the Acustica group
                const acusticaAssigned = balancedAssignRandom(acustica, shiftCount.acustica, exceptions, alreadyAssigned, acusticaCount);
                const microfonistiAssigned = balancedAssignRandom(microfonisti, shiftCount.microfonisti, exceptions, alreadyAssigned, 3);
                const uscieriAssigned = balancedAssignRandom(uscieri, shiftCount.uscieri, exceptions, alreadyAssigned, 3);

                shifts.push({
                    date: formattedDate,
                    day: dayString,
                    acustica: acusticaAssigned.join(', '),
                    microfonisti: microfonistiAssigned.join(', '),
                    uscieri: uscieriAssigned.join(', ')
                });
            }
        }
    }

    displayShifts(shifts);
    displayShiftSummary(shiftCount);
}

function initShiftCount(members) {
    const counts = {};
    members.forEach(member => counts[member] = 0);
    return counts;
}

function balancedAssignRandom(group, shiftCounts, exceptions, alreadyAssigned, count) {
    let selected = [];
    let possible = group.filter(name => !exceptions.has(name) && !alreadyAssigned.has(name));
    shuffleArray(possible);
    possible.sort((a, b) => shiftCounts[a] - shiftCounts[b]);

    for (let i = 0; i < count && possible.length > 0; i++) {
        selected.push(possible[i]);
        shiftCounts[possible[i]]++;
        alreadyAssigned.add(possible[i]);
    }
    return selected;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function displayShifts(shifts) {
    const output = document.getElementById('shifts-output');
    output.innerHTML = '<h3>Assigned Shifts</h3>';
    shifts.forEach(shift => {
        output.innerHTML += `<p>${shift.day}, ${shift.date}<br>Acustica: ${shift.acustica}<br>Microfonisti: ${shift.microfonisti}<br>Uscieri: ${shift.uscieri}</p><hr>`;
    });
}

function displayShiftSummary(shiftCount) {
    const summaryOutput = document.createElement('div');
    summaryOutput.innerHTML = '<h3>Shift Summary</h3>';
    Object.keys(shiftCount).forEach(group => {
        summaryOutput.innerHTML += `<h4>${group.charAt(0).toUpperCase() + group.slice(1)}</h4>`;
        Object.keys(shiftCount[group]).forEach(member => {
            summaryOutput.innerHTML += `<p>${member}: ${shiftCount[group][member]} times</p>`;
        });
    });
    document.getElementById('shifts-output').appendChild(summaryOutput);
}
