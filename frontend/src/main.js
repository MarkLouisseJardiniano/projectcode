const API_URL = import.meta.env.VITE_API_URL;

document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email })
        });

        const responseData = await response.json();

        if (response.ok) {
            document.getElementById('response-message').innerText = 'Submission successful!';
            document.getElementById('response-message').classList.add('text-green-500');
        } else {
            document.getElementById('response-message').innerText = 'Something went wrong. Please try again.';
            document.getElementById('response-message').classList.add('text-red-500');
        }

    } catch (error) {
        document.getElementById('response-message').innerText = 'Network error. Please try again later.';
        document.getElementById('response-message').classList.add('text-red-500');
    }

    document.getElementById('signup-form').reset();
});
