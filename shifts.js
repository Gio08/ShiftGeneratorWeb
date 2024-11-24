// Function to update the list of shift days (Tuesdays and Saturdays) based on the selected month and year
function updateShiftDays() {
    const monthYear = document.getElementById('month').value; // Get selected month and year
    const month = new Date(monthYear).getMonth() + 1; // Extract month
    const year = new Date(monthYear).getFullYear(); // Extract year
    const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the selected month

    let exceptionsHtml = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
        if (dayOfWeek === 2 || dayOfWeek === 6) { // Check for Tuesday (2) or Saturday (6)
            const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
            const dayString = dayOfWeek === 2 ? "Tuesday" : "Saturday";
            // Create HTML for each shift with an exception textarea and a "skip" checkbox
            exceptionsHtml += `<div>
                <label for="exception_${formattedDate}">${dayString} ${formattedDate}:</label>
                <textarea id="exception_${formattedDate}" name="exception_${formattedDate}" rows="3" cols="50"></textarea>
                <label for="skip_${formattedDate}">Skip:</label>
                <input type="checkbox" id="skip_${formattedDate}" name="skip_${formattedDate}">
            </div>`;
        }
    }

    // Update the exceptions section with dynamically generated HTML
    document.getElementById('exceptions-list').innerHTML = exceptionsHtml;
    document.getElementById('shifts-exceptions').style.display = 'block'; // Show the exceptions section
}

// Function to generate shifts for the selected month
function generateShifts() {
    const monthYear = document.getElementById('month').value; // Get selected month and year
    const month = new Date(monthYear).getMonth() + 1; // Extract month
    const year = new Date(monthYear).getFullYear(); // Extract year
    const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the selected month

    // Get group members
    const acustica = document.getElementById('acustica').value.trim().split('\n');
    const microfonisti = document.getElementById('microfonisti').value.trim().split('\n');
    const uscieri = document.getElementById('uscieri').value.trim().split('\n');

    // Initialize shift counters for fair distribution
    const shiftCount = {
        acustica: initShiftCount(acustica),
        microfonisti: initShiftCount(microfonisti),
        uscieri: initShiftCount(uscieri)
    };

    const shifts = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // Get the day of the week
        if (dayOfWeek === 2 || dayOfWeek === 6) { // Check for Tuesday or Saturday
            const formattedDate = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
            const dayString = dayOfWeek === 2 ? "Tuesday" : "Saturday";

            // Skip the shift if the "skip" checkbox is checked
            if (!document.getElementById(`skip_${formattedDate}`).checked) {
                const exceptions = new Set(document.getElementById(`exception_${formattedDate}`).value.trim().split('\n').filter(Boolean)); // Get exceptions
                const alreadyAssigned = new Set(); // Track members already assigned to avoid overlaps

                // Assign members to each group, considering exceptions
                const acusticaAssigned = balancedAssignRandom(acustica, shiftCount.acustica, exceptions, alreadyAssigned, 2);
                const microfonistiAssigned = balancedAssignRandom(microfonisti, shiftCount.microfonisti, exceptions, alreadyAssigned, 3);
                const uscieriAssigned = balancedAssignRandom(uscieri, shiftCount.uscieri, exceptions, alreadyAssigned, 3);

                // Add the assigned shift to the list
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

    // Display the generated shifts and the summary of turn counts
    displayShifts(shifts);
    displayShiftSummary(shiftCount);
}

// Initialize a counter for each member to track their assigned shifts
function initShiftCount(members) {
    const counts = {};
    members.forEach(member => counts[member] = 0);
    return counts;
}

// Assign members to a group considering exceptions and fair distribution
function balancedAssignRandom(group, shiftCounts, exceptions, alreadyAssigned, count) {
    let selected = [];
    let possible = group.filter(name => !exceptions.has(name) && !alreadyAssigned.has(name)); // Filter based on exceptions and already assigned members
    shuffleArray(possible); // Shuffle the list to ensure randomness
    possible.sort((a, b) => shiftCounts[a] - shiftCounts[b]); // Sort by the least number of shifts

    for (let i = 0; i < count && possible.length > 0; i++) {
        selected.push(possible[i]);
        shiftCounts[possible[i]]++;
        alreadyAssigned.add(possible[i]); // Mark the member as already assigned for this shift
    }
    return selected;
}

// Shuffle an array to randomize its elements
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

// Display the assigned shifts in the output section
function displayShifts(shifts) {
    const output = document.getElementById('shifts-output');
    output.innerHTML = '<h3>Assigned Shifts</h3>';
    shifts.forEach(shift => {
        output.innerHTML += `<p>${shift.day}, ${shift.date}<br>Acustica: ${shift.acustica}<br>Microfonisti: ${shift.microfonisti}<br>Uscieri: ${shift.uscieri}</p><hr>`;
    });
}

// Display a summary of shifts for each group and member
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
