const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Ziobunc Telemedicine Backend is running!');
});

app.post('/api/book', (req, res) => {
    console.log('✅ Booking received:', req.body);
    
    // THIS IS THE FIX: Send the patient to your live success URL
    res.redirect('https://ziobunctelemedicineng.vercel.app/thank-you.html');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
