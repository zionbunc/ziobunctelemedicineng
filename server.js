const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONNECT TO CLOUD MONGODB
mongoose.connect('mongodb+srv://bunmail_db_user:udMUODyy3lrtQ5GQ@cluster0.ahwssg3.mongodb.net/ziobuncTelemedicine?retryWrites=true&w=majority&appName=Cluster0')
.then(() => {
    console.log('✅ Connected to MongoDB Cloud Database');
})
.catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
});

// DOCTOR SCHEMA
const doctorSchema = new mongoose.Schema({
    name: String,
    specialty: String,
    available: { type: Boolean, default: true }
});
const Doctor = mongoose.model('Doctor', doctorSchema);

// PATIENT BOOKING SCHEMA
const bookingSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    phone: String,
    doctor: String,
    datetime: String,
    type: String,
    createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// SEED DATABASE WITH DOCTORS
async function seedDoctors() {
    try {
        const count = await Doctor.countDocuments();
        if (count === 0) {
            await Doctor.create([
                { name: 'Dr. Adewale', specialty: 'General', available: true },
                { name: 'Dr. Chioma', specialty: 'Pediatrics', available: true },
                { name: 'Dr. Emeka', specialty: 'Dermatology', available: false }
            ]);
            console.log('✅ Sample doctors added to cloud database');
        }
    } catch (err) {
        console.error('❌ Error seeding doctors:', err);
    }
}
seedDoctors();

// SAVE BOOKING TO CLOUD
app.post('/api/book', async (req, res) => {
    try {
        const { fullName, email, phone, doctor, datetime, type } = req.body;
        const newBooking = new Booking({ fullName, email, phone, doctor, datetime, type });
        await newBooking.save();
        console.log('✅ Booking SAVED TO CLOUD:', newBooking);
        res.redirect('https://ziobunctelemedicineng.vercel.app/thank-you.html');
    } catch (err) {
        console.error('❌ Error saving booking:', err);
        res.status(500).send('Error saving booking');
    }
});

// GET ALL BOOKINGS
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// SERVE DASHBOARD
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.send('Ziobunc Backend is running on Cloud!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
