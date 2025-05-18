let isFetching = false;
let currentData = [];
let isPollingActive = false; // Start with polling inactive
let pollingInterval = null;

// Function to scroll to the specific message
function scrollToMessage() {
    const hash = window.location.hash.substring(1); // Get the hash without the #
    if (hash) {
        const messageElement = document.getElementById(`message-${hash}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth' });
            // Add highlight class to the message
            messageElement.classList.add('highlight');
            // Remove the highlight class after 2 seconds
            setTimeout(() => {
                messageElement.classList.remove('highlight');
            }, 2000); // Adjust the duration as needed
        }
    }
}

async function fetchHtmlContent(pubhtmlUrl) {
    // Add a timestamp to the URL to prevent caching
    const urlWithTimestamp = `${pubhtmlUrl}?t=${new Date().getTime()}`;
    const response = await fetch(urlWithTimestamp);
    const html = await response.text();
    return html;
}

function parseHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tr');
    
    const data = Array.from(rows).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        return {
            timestamp: cells[0]?.innerText.trim() || '',
            message: cells[1]?.innerText.trim() || '',
            signature: cells[2]?.innerText.trim() || ''
        };
    });

    return data;
}

// Add this function to detect and convert URLs to links
function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

function displayMessages(data) {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = ''; // Clear existing messages
    data.forEach((entry, index) => {
        const chatWrapper = document.createElement('div');
        chatWrapper.className = 'chat-wrapper';  // Add wrapper for styling

        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble';
        const messageId = `${index + 1}`; // Numeric ID
        chatBubble.id = `message-${messageId}`;

        // Add wire
        const wire = document.createElement('div');
        wire.className = 'wire';
        chatBubble.appendChild(wire);

        // Add Christmas lights container
        const lightsContainer = document.createElement('div');
        lightsContainer.className = 'lights';
        for (let i = 0; i < 8; i++) {
            const light = document.createElement('div');
            light.className = 'light';
            lightsContainer.appendChild(light);
        }
        chatBubble.appendChild(lightsContainer);

        const chatTimestamp = document.createElement('div');
        chatTimestamp.className = 'timestamp';
        chatTimestamp.textContent = entry.timestamp;

        const chatMessage = document.createElement('div');
        chatMessage.className = 'message';
        chatMessage.innerHTML = linkify(entry.message); // Use innerHTML and linkify here

        const chatSignature = document.createElement('div');
        chatSignature.className = 'signature';
        chatSignature.textContent = `- ${entry.signature}`;

        // Create share button
        const shareButton = document.createElement('button');
        shareButton.className = 'share-button';
        shareButton.innerHTML = '🔗';
        shareButton.addEventListener('click', () => shareChatBubble(chatWrapper, messageId));

        chatBubble.appendChild(chatTimestamp);
        chatBubble.appendChild(chatMessage);
        chatBubble.appendChild(chatSignature);

        chatWrapper.appendChild(chatBubble);
        chatWrapper.appendChild(shareButton);  // Place share button next to the chat bubble
        chatContainer.appendChild(chatWrapper);
    });

    // Scroll to the message if URL hash is present
    scrollToMessage();
}

async function fetchDataAndUpdate() {
    if (isFetching || !isPollingActive) return; // Add polling status check
    isFetching = true;

    try {
        const pubhtmlUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQazrkD8DxsLDMhQ4X78vjlIjq1wos7C-0dge7NDG0EBkJ7jhePsJYXCGUvMV79GaNcAa1hJYS_M-5Z/pubhtml';
        const html = await fetchHtmlContent(pubhtmlUrl);
        const newData = parseHtml(html);
        
        // Update the display only if new data is different
        if (JSON.stringify(newData) !== JSON.stringify(currentData)) {
            currentData = newData;
            displayMessages(newData);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        isFetching = false;
    }
}

// Add event listener for the load messages button
document.getElementById('loadMessagesBtn').addEventListener('click', function() {
    // Hide the button
    this.style.display = 'none';
    
    // Start polling
    isPollingActive = true;
    
    // Initial fetch
    fetchDataAndUpdate();
    
    // Set up interval
    pollingInterval = setInterval(() => {
        if (isPollingActive) {
            fetchDataAndUpdate();
        }
    }, 30000);
});

// Toggle form visibility (updated)
document.getElementById('toggleFormButton').addEventListener('click', () => {
    const formContainer = document.getElementById('formContainer');
    const cloudContainer = document.getElementById('cloudContainer');
    
    if (formContainer.classList.contains('hidden')) {
        formContainer.classList.remove('hidden');
        document.getElementById('toggleFormButton').textContent = 'Close Form';
        
        // Close cloud container if open
        if (!cloudContainer.classList.contains('hidden')) {
            cloudContainer.classList.add('hidden');
            document.getElementById('toggleCloudButton').textContent = 'فتح السحابة';
        }
        
        // Pause polling only if it was active
        if (isPollingActive) {
            isPollingActive = false;
        }
    } else {
        formContainer.classList.add('hidden');
        document.getElementById('toggleFormButton').textContent = 'Open Form';
        
        // Resume polling only if it was active before
        if (pollingInterval !== null) {
            isPollingActive = true;
            fetchDataAndUpdate(); // Immediately fetch data when resuming
        }
    }
});

// Toggle cloud container
document.getElementById('toggleCloudButton').addEventListener('click', () => {
    const cloudContainer = document.getElementById('cloudContainer');
    const formContainer = document.getElementById('formContainer');
    
    if (cloudContainer.classList.contains('hidden')) {
        cloudContainer.classList.remove('hidden');
        document.getElementById('toggleCloudButton').textContent = 'إغلاق السحابة';
        
        // Close form container if open
        if (!formContainer.classList.contains('hidden')) {
            formContainer.classList.add('hidden');
            document.getElementById('toggleFormButton').textContent = 'Open Form';
        }
        
        // Pause polling if active
        if (isPollingActive) {
            isPollingActive = false;
        }
    } else {
        cloudContainer.classList.add('hidden');
        document.getElementById('toggleCloudButton').textContent = 'فتح السحابة';
        
        // Resume polling if was active
        if (pollingInterval !== null) {
            isPollingActive = true;
            fetchDataAndUpdate();
        }
    }
});

// Listen for hash changes to navigate to the specific message
window.addEventListener('hashchange', scrollToMessage);

// Add scroll event
document.getElementById('scrollToBottomButton').addEventListener('click', () => {
    document.getElementById('bottom-of-page').scrollIntoView({ behavior: 'smooth' });
});

// Function to share chat bubble
async function shareChatBubble(chatWrapper, messageId) {
    const shareButton = chatWrapper.querySelector('.share-button');
    shareButton.style.display = 'none';  // Hide share button

    // Check if options already exist, remove them if they do
    const existingOptions = chatWrapper.querySelector('.share-options');
    if (existingOptions) {
        chatWrapper.removeChild(existingOptions);
        shareButton.style.display = 'block';
        return;
    }

    // Capture screenshot with background color
    const canvas = await html2canvas(chatWrapper, { backgroundColor: '#e4e0d7' });
    const imgData = canvas.toDataURL("image/png");

    shareButton.style.display = 'block';  // Show share button again

    const urlWithoutHash = window.location.href.split('#')[0];
    const fullMessageText = chatWrapper.querySelector('.message').textContent;
    const snippetLength = 100;  // Adjust based on desired snippet size
    const snippetText = fullMessageText.length > snippetLength ? fullMessageText.substring(0, snippetLength) + '...' : fullMessageText;
    const shareText = `${snippetText} —  ممكن تكتب رد هنا!\n`; // Arabic text and long dash

    const shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(urlWithoutHash + '#' + messageId)}`;

    // Create download button with photo emoji 📸
    const downloadButton = document.createElement('button');
    downloadButton.className = 'emoji-button';
    downloadButton.innerHTML = '📸';  // Photo emoji
    downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `message-${messageId}.png`;
        link.click();
    });

    // Create share button with Twitter emoji 🐦
    const twitterButton = document.createElement('button');
    twitterButton.className = 'emoji-button';
    twitterButton.innerHTML = '🐦';  // Twitter emoji
    twitterButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = shareLink;
        link.target = '_blank';
        link.click();
    });

    // Display options
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'share-options';  // Add class for styling
    optionsContainer.appendChild(downloadButton);
    optionsContainer.appendChild(twitterButton);

    chatWrapper.appendChild(optionsContainer);
}
