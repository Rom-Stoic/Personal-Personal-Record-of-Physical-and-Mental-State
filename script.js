document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('data-form');
    const dateInput = document.getElementById('date');

    // --- NEW: Function to reset the form to its initial HTML state ---
    function resetForm() {
        form.reset(); // This clears text/number inputs and resets radio buttons to their HTML 'checked' state.
    }

    // --- NEW: Function to populate the form with data from the server ---
    function populateForm(data) {
        // First, reset the form to clear any previous state and set defaults
        resetForm();
        
        // Go through each key-value pair in the fetched data
        for (const [key, value] of Object.entries(data)) {
            // Skip null or undefined values, let the default hold
            if (value === null || value === undefined) {
                continue;
            }

            const element = form.elements[key];
            if (element) {
                // Check if the element is a RadioNodeList (a group of radio buttons)
                if (element instanceof RadioNodeList) {
                    // Find the specific radio button in the group that matches the value
                    // Use String(value) to handle numeric values like 0, 1 from the backend
                    const radioToSelect = Array.from(element).find(radio => radio.value == value);
                    if (radioToSelect) {
                        radioToSelect.checked = true;
                    }
                } else {
                    // For all other input types (text, number, date, textarea)
                    // Special handling for the date field to set it correctly
                    if (element.type === 'date' && value) {
                        // ================== FIX START ==================
                        // The value from the backend is a string like 'YYYY/MM/DD'.
                        // The date input requires the format 'YYYY-MM-DD'.
                        // We can simply replace the slashes with dashes.
                        // This completely avoids timezone conversion issues.
                        element.value = value.toString().replace(/\//g, '-');
                        // =================== FIX END ===================
                    } else {
                        element.value = value;
                    }
                }
            }
        }
    }

    // --- NEW: Function to fetch data for a given date and display it ---
    async function fetchAndDisplayData(dateString) {
        if (!dateString) return;

        try {
            const response = await fetch(`/get_data?date=${dateString}`);
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            if (Object.keys(data).length > 0) {
                console.log('Data found, populating form:', data);
                populateForm(data);
            } else {
                console.log('No data for this date, resetting form.');
                // Reset the form but keep the newly selected date
                const currentDate = dateInput.value;
                resetForm();
                dateInput.value = currentDate;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showMessage(`无法加载数据: ${error.message}`, true);
        }
    }

    // --- MODIFIED: Setup date input and add event listener ---
    if (dateInput) {
        // Set initial date to today
        dateInput.valueAsDate = new Date();
        // Add event listener for when the user changes the date
        dateInput.addEventListener('change', () => {
            fetchAndDisplayData(dateInput.value);
        });
        // Fetch data for today when the page first loads
        fetchAndDisplayData(dateInput.value);
    }
    
    // --- MODIFIED: Form submission logic ---
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(form);
        // A simpler way to convert FormData to a plain object
        const data = Object.fromEntries(formData.entries());

        if (!data['日期']) {
            showMessage('错误：日期为必填项！', true);
            return;
        }

        // Now, the 'data' object contains the complete picture for the day
        // (a mix of previously saved data and new edits), preventing the overwrite issue.
        try {
            const response = await fetch('/save_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('数据已成功保存！');
            } else {
                throw new Error(result.error || '保存失败');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(`保存数据时出错: ${error.message}`, true);
        }
    }

    // Attach the modified submit handler
    form.addEventListener('submit', handleFormSubmit);

    // --- UNCHANGED: SRT Modal Logic and Message Modal ---
    const srtModal = document.getElementById('srt-modal');
    const startSrtBtn = document.getElementById('start-srt-btn');
    const srtStartTrialsBtn = document.getElementById('srt-start-trials');
    const srtTestArea = document.getElementById('srt-test-area');
    const srtInstructions = document.getElementById('srt-instructions');
    const srtStimulus = document.getElementById('srt-stimulus');
    const srtFeedback = document.getElementById('srt-feedback');
    const srtInput = document.getElementById('srt');

    let reactionTimes = [];
    const totalTrials = 5;
    let currentTrial = 0;
    let trialStartTime;
    let waitingForClick = false;

    startSrtBtn.addEventListener('click', () => {
        srtModal.style.display = 'flex';
        resetSrtTest();
    });

    srtStartTrialsBtn.addEventListener('click', () => {
        srtInstructions.style.display = 'none';
        srtTestArea.style.display = 'flex';
        runSrtTrial();
    });

    function resetSrtTest() {
        reactionTimes = [];
        currentTrial = 0;
        waitingForClick = false;
        srtInstructions.style.display = 'block';
        srtTestArea.style.display = 'none';
        srtStimulus.style.backgroundColor = 'transparent';
        srtStimulus.textContent = '';
        srtInput.value = '';
    }

    function runSrtTrial() {
        if (currentTrial >= totalTrials) {
            finishSrtTest();
            return;
        }
        currentTrial++;
        waitingForClick = false;
        srtFeedback.textContent = `第 ${currentTrial} / ${totalTrials} 次`;
        srtStimulus.style.backgroundColor = 'transparent';
        srtStimulus.textContent = '+';

        const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds
        setTimeout(() => {
            srtStimulus.textContent = '';
            srtStimulus.style.backgroundColor = 'var(--primary-color)';
            trialStartTime = performance.now();
            waitingForClick = true;
        }, randomDelay);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && srtModal.style.display === 'flex' && waitingForClick) {
            e.preventDefault();
            const reactionTime = performance.now() - trialStartTime;
            reactionTimes.push(reactionTime);
            waitingForClick = false;
            srtFeedback.textContent = `反应时: ${reactionTime.toFixed(2)} ms`;
            
            setTimeout(runSrtTrial, 1000);
        }
    });

    function finishSrtTest() {
        const sum = reactionTimes.reduce((a, b) => a + b, 0);
        const avg = sum / reactionTimes.length;
        srtInput.value = avg.toFixed(2);
        srtModal.style.display = 'none';
        showMessage(`测试完成！您的平均反应时为 ${avg.toFixed(2)} ms。`);
    }

    const messageModal = document.getElementById('message-modal');
    const messageText = document.getElementById('message-text');
    const messageOkBtn = document.getElementById('message-ok-btn');

    function showMessage(message, isError = false) {
        messageText.textContent = message;
        messageText.style.color = isError ? 'var(--error-color)' : 'var(--text-color)';
        messageModal.style.display = 'flex';
    }

    messageOkBtn.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });
});
