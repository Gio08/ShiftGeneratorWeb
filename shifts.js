// Update group member textareas based on group configuration
function updateGroupsMembers() {
    const acusticaCount = parseInt(document.getElementById('acustica-count').value);
    const microfonistiCount = parseInt(document.getElementById('microfonisti-count').value);
    const uscieriCount = parseInt(document.getElementById('uscieri-count').value);

    const groupsContent = document.getElementById('groups-members-content');
    groupsContent.innerHTML = ''; // Clear previous textareas

    if (acusticaCount > 0) {
        groupsContent.innerHTML += `
            <div>
                <label for="acustica">Acustica:</label>
                <textarea id="acustica" rows="4" cols="50"></textarea>
            </div>`;
    }
    if (microfonistiCount > 0) {
        groupsContent.innerHTML += `
            <div>
                <label for="microfonisti">Microfonisti:</label>
                <textarea id="microfonisti" rows="4" cols="50"></textarea>
            </div>`;
    }
    if (uscieriCount > 0) {
        groupsContent.innerHTML += `
            <div>
                <label for="uscieri">Uscieri:</label>
                <textarea id="uscieri" rows="4" cols="50"></textarea>
            </div>`;
    }
}

// Update the exceptions list using the selected month and 2 picked days
function updateShiftDays() {
    const monthYear = document.getElementById('month').value;

    // Extract year and month safely (e.g. "2025-05" → 2025, 5)
    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr); // 1–12

    const selectedOptions = Array.from(document.getElementById('days').selectedOptions);
    const selectedDays = selectedOptions.map(option => parseInt(option.value));

    // Require exactly 2 days to be selected
    if (selectedDays.length !== 2) {
        document.getElementById('exceptions-list').innerHTML = '<p style="color: red;">Please select exactly 2 days!</p>';
        document.getElementById('shifts-exceptions').style.display = 'block';
        return;
    }

    const daysInMonth = new Date(year, month, 0).getDate(); // number of days in the selected month
    let exceptionsHtml = '';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();

        if (selectedDays.includes(dayOfWeek)) {
            // ✅ Fixed: avoid UTC shift by manually formatting the date
            const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayString = date.toLocaleDateString('en-US', { weekday: 'long' });

            exceptionsHtml += `<div>
                <label for="exception_${formattedDate}">${dayString} ${formattedDate}:</label>
                <textarea id="exception_${formattedDate}" rows="3" cols="50"></textarea>
                <label for="skip_${formattedDate}">Skip:</label>
                <input type="checkbox" id="skip_${formattedDate}">
            </div>`;
        }
    }

    document.getElementById('exceptions-list').innerHTML = exceptionsHtml;
    document.getElementById('shifts-exceptions').style.display = 'block';
}

// Generate shifts for the selected month, days, and group configuration
function generateShifts() {
    const acusticaCount = parseInt(document.getElementById('acustica-count').value);
    const microfonistiCount = parseInt(document.getElementById('microfonisti-count').value);
    const uscieriCount = parseInt(document.getElementById('uscieri-count').value);

    const acustica = acusticaCount > 0 ? document.getElementById('acustica').value.trim().split('\n') : [];
    const microfonisti = microfonistiCount > 0 ? document.getElementById('microfonisti').value.trim().split('\n') : [];
    const uscieri = uscieriCount > 0 ? document.getElementById('uscieri').value.trim().split('\n') : [];

    const shiftCount = {
        acustica: initShiftCount(acustica),
        microfonisti: initShiftCount(microfonisti),
        uscieri: initShiftCount(uscieri)
    };

    const monthYear = document.getElementById('month').value;
    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr); // 1–12
    const daysInMonth = new Date(year, month, 0).getDate();

    const selectedOptions = Array.from(document.getElementById('days').selectedOptions);
    const selectedDays = selectedOptions.map(option => parseInt(option.value));

    if (selectedDays.length !== 2) {
        alert('Please select exactly 2 days!');
        return;
    }

    const shifts = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();

        if (selectedDays.includes(dayOfWeek)) {
            const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayString = date.toLocaleDateString('en-US', { weekday: 'long' });

            if (!document.getElementById(`skip_${formattedDate}`).checked) {
                const exceptions = new Set(document.getElementById(`exception_${formattedDate}`).value.trim().split('\n').filter(Boolean));
                const alreadyAssigned = new Set();

                const acusticaAssigned = acusticaCount > 0 ? balancedAssignRandom(acustica, shiftCount.acustica, exceptions, alreadyAssigned, acusticaCount) : [];
                const microfonistiAssigned = microfonistiCount > 0 ? balancedAssignRandom(microfonisti, shiftCount.microfonisti, exceptions, alreadyAssigned, microfonistiCount) : [];
                const uscieriAssigned = uscieriCount > 0 ? balancedAssignRandom(uscieri, shiftCount.uscieri, exceptions, alreadyAssigned, uscieriCount) : [];

                shifts.push({
                    date: formattedDate,
                    day: dayString,
                    acustica: acusticaAssigned,
                    microfonisti: microfonistiAssigned,
                    uscieri: uscieriAssigned
                });
            }
        }
    }

    displayShifts(shifts, shiftCount, { acusticaCount, microfonistiCount, uscieriCount });
}

// Create a shift count object for each member
function initShiftCount(members) {
    const counts = {};
    members.forEach(member => counts[member] = 0);
    return counts;
}

// Assign people to a shift fairly and randomly, avoiding conflicts and exceptions
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

// Shuffle array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Display all assigned shifts
function displayShifts(shifts, shiftCount, groupCounts) {
    const output = document.getElementById('shifts-output');
    output.innerHTML = '<h3>Assigned Shifts</h3>';

    shifts.forEach(shift => {
        output.innerHTML += `<p>${shift.day}, ${shift.date}<br>`;
        if (groupCounts.acusticaCount > 0) output.innerHTML += `Acustica: ${shift.acustica.join(', ')}<br>`;
        if (groupCounts.microfonistiCount > 0) output.innerHTML += `Microfonisti: ${shift.microfonisti.join(', ')}<br>`;
        if (groupCounts.uscieriCount > 0) output.innerHTML += `Uscieri: ${shift.uscieri.join(', ')}<br>`;
        output.innerHTML += '</p><hr>';
    });

    displayShiftSummary(shiftCount, groupCounts);
}

// Display summary of how many shifts each person did
function displayShiftSummary(shiftCount, groupCounts) {
    const summaryOutput = document.createElement('div');
    summaryOutput.innerHTML = '<h3>Shift Summary</h3>';

    if (groupCounts.acusticaCount > 0) {
        summaryOutput.innerHTML += '<h4>Acustica</h4>';
        Object.keys(shiftCount.acustica).forEach(member => {
            summaryOutput.innerHTML += `<p>${member}: ${shiftCount.acustica[member]} times</p>`;
        });
    }

    if (groupCounts.microfonistiCount > 0) {
        summaryOutput.innerHTML += '<h4>Microfonisti</h4>';
        Object.keys(shiftCount.microfonisti).forEach(member => {
            summaryOutput.innerHTML += `<p>${member}: ${shiftCount.microfonisti[member]} times</p>`;
        });
    }

    if (groupCounts.uscieriCount > 0) {
        summaryOutput.innerHTML += '<h4>Uscieri</h4>';
        Object.keys(shiftCount.uscieri).forEach(member => {
            summaryOutput.innerHTML += `<p>${member}: ${shiftCount.uscieri[member]} times</p>`;
        });
    }

    document.getElementById('shifts-output').appendChild(summaryOutput);
}