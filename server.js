const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

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

// GENERATE PRESCRIPTION PDF
app.post('/api/prescription', async (req, res) => {
    try {
        const { patientName, patientEmail, medication } = req.body;
        const fileName = `prescription_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);

        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(filePath));

        // Branded Header
        doc.fontSize(25).fillColor('#007bff').text('Ziobunc Telemedicine', 100, 50, { align: 'center' });
        doc.fontSize(10).fillColor('#555').text('Global Healthcare, Anywhere.', { align: 'center' });
        
        doc.moveDown();
        doc.moveDown();

        // Prescription Content
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

        // Wait for PDF to finish writing
        doc.on('finish', () => {
            // Send the file to the client
            res.json({ url: `https://ziobunc-backend.onrender.com/${fileName}` });
        });

    } catch (err) {
        console.error('❌ Error generating prescription:', err);
        res.status(500).json({ error: 'Failed to generate prescription' });
    }
});

// SERVE STATIC FILES (for PDF download)
app.use(express.static(__dirname));

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
