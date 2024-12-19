import React, { useEffect, useState } from 'react';

const SmartHomes = () => {
    const [smartHomes, setSmartHomes] = useState([]);
    const [homeName, setHomeName] = useState('');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchSmartHomes();
    }, []);

    const fetchSmartHomes = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/smart-homes?userId=${userId}`);
            const data = await response.json();
            setSmartHomes(data);
        } catch (error) {
            console.error('Error fetching smart homes:', error);
        }
    };

    const handleCreateSmartHome = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/smart-homes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: homeName, creatorId: userId })
            });

            if (response.ok) {
                alert('Smart home created successfully');
                setHomeName('');
                fetchSmartHomes();
            } else {
                const data = await response.json();
                alert('Smart home creation failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="smart-homes-container">
            <h1>Smart Homes</h1>
            <ul>
                {smartHomes.map(home => (
                    <li key={home.id}>{home.name}</li>
                ))}
            </ul>
            <form onSubmit={handleCreateSmartHome}>
                <input
                    type="text"
                    value={homeName}
                    onChange={(e) => setHomeName(e.target.value)}
                    placeholder="Home Name"
                    required
                />
                <button type="submit">Create Smart Home</button>
            </form>
        </div>
    );
};

export default SmartHomes;