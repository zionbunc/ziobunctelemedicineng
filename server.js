const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const PDFDocument = require('pdfkit');
const cors = require('cors'); // <--- THIS IS THE FIX
const app = express();
const PORT = process.env.PORT || 3000;

// ALLOW YOUR WEBSITE TO FETCH DATA (CORS FIX)
app.use(cors({
    origin: 'https://ziobunctelemedicineng.vercel.app'
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONNECT TO CLOUD MONGODB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bunmait_db_user:udMUODyy3lrtQ5GQ@cluster0.ahwssg3.mongodb.net/ziobuncTelemedicine?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
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

// SEED DATABASE
async function seedDoctors() {
    try {
        const count = await Doctor.countDocuments();
        if (count === 0) {
            await Doctor.create([
                { name: 'Dr. Adewale', specialty: 'General', available: false },
                { name: 'Dr. Chioma', specialty: 'Pediatrics', available: false },
                { name: 'Dr. Emeka', specialty: 'Dermatology', available: true }
            ]);
            console.log('✅ Sample doctors added to cloud database');
        }
    } catch (err) {
        console.error('❌ Error seeding doctors:', err);
    }
}
seedDoctors();

// SAVE BOOKING
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

// GET ALL DOCTORS
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

// TOGGLE DOCTOR AVAILABILITY
app.post('/api/toggle-availability', async (req, res) => {
    try {
        const { doctorId } = req.body;
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        doctor.available = !doctor.available;
        await doctor.save();
        res.json({ success: true, available: doctor.available });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle availability' });
    }
});

// PRESCRIPTION GENERATION
app.post('/api/prescription', async (req, res) => {
    try {
        const { patientName, patientEmail, medication } = req.body;

        const doc = new PDFDocument();
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="prescription_${Date.now()}.pdf"`
            });
            res.send(pdfData);
        });

        doc.fontSize(25).fillColor('#007bff').text('Ziobunc Telemedicine', 100, 50, { align: 'center' });
        doc.fontSize(10).fillColor('#555').text('Global Healthcare, Anywhere.', { align: 'center' });
        doc.moveDown();
        doc.moveDown();

        doc.fontSize(14).fillColor('#333').text('DIGITAL PRESCRIPTION', { align: 'center', underline: true });
        doc.moveDown();

        doc.fontSize(12).text(`Patient: ${patientName}`);
        doc.text(`Email: ${patientEmail}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        doc.fontSize(14).fillColor('#007bff').text('Prescribed Medication:');
        doc.fontSize(12).fillColor('#333').text(medication);
        doc.moveDown();
        doc.moveDown();

        doc.fontSize(12).text('_________________________', { align: 'right' });
        doc.text('Doctor\'s Signature', { align: 'right' });

        doc.end();

    } catch (err) {
        console.error('❌ Error generating prescription:', err);
        res.status(500).json({ error: 'Failed to generate prescription' });
    }
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.send('Ziobunc Backend is running on Cloud!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
