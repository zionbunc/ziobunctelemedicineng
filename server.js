const express = require('express');
const app = express();
const PORT = 3000;

// This is CRITICAL: It allows the server to read form data from your HTML
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.send('Ziobunc Telemedicine Backend is running!');
});

// Booking endpoint
app.post('/api/book', (req, res) => {
    console.log('✅ Booking received:', req.body);
    res.json({ message: 'Booking received successfully!' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
