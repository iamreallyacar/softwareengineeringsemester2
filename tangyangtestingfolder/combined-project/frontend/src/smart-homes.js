document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('You must be logged in to view this page.');
        window.location.href = 'index.html';
        return;
    }

    const smartHomesList = document.getElementById('smart-homes-list');
    const createSmartHomeForm = document.getElementById('create-smart-home-form');

    // Fetch and display smart homes
    async function fetchSmartHomes() {
        try {
            const response = await fetch(`http://localhost:5000/api/smart-homes?userId=${userId}`);
            const smartHomes = await response.json();
            smartHomesList.innerHTML = '';
            smartHomes.forEach(home => {
                const li = document.createElement('li');
                li.textContent = home.name;
                smartHomesList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching smart homes:', error);
        }
    }

    // Handle smart home creation
    createSmartHomeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const homeName = document.getElementById('home-name').value;

        try {
            const response = await fetch('http://localhost:5000/api/smart-homes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: homeName, creatorId: userId })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Smart home created successfully');
                fetchSmartHomes();
            } else {
                alert('Smart home creation failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    fetchSmartHomes();
});