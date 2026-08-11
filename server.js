const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: ["https://ziobunctelemedicineng.vercel.app", "http://localhost:3000"], methods: ["GET", "POST"] } });
const PORT = process.env.PORT || 3000;

// ALLOW YOUR FRONTEND TO FETCH DATA
app.use(cors({ 
    origin: ['https://ziobunctelemedicineng.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bunmait_db_user:udMUODyy3lrtQ5GQ@cluster0.ahwssg3.mongodb.net/ziobuncTelemedicine?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 45000 })
.then(() => console.log('✅ Connected to MongoDB Cloud Database'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const doctorSchema = new mongoose.Schema({ name: String, specialty: String, available: { type: Boolean, default: true } });
const Doctor = mongoose.model('Doctor', doctorSchema);
const bookingSchema = new mongoose.Schema({ fullName: String, email: String, phone: String, doctor: String, datetime: String, type: String, medication: { type: String, default: '' }, roomId: { type: String, unique: true, sparse: true }, createdAt: { type: Date, default: Date.now } });
const Booking = mongoose.model('Booking', bookingSchema);

app.post('/api/book', async (req, res) => {
    try {
        const { fullName, email, phone, doctor, datetime, type } = req.body;
        const roomId = crypto.randomBytes(5).toString('hex');
        const newBooking = new Booking({ fullName, email, phone, doctor, datetime, type, roomId });
        await newBooking.save();
        console.log('✅ Booking SAVED TO CLOUD with Room ID:', roomId);
        res.redirect('https://ziobunctelemedicineng.vercel.app/thank-you.html');
    } catch (err) { console.error(err); res.status(500).send('Error saving booking'); }
});

app.get('/api/bookings', async (req, res) => {
    try { const bookings = await Booking.find().sort({ createdAt: -1 }); res.json(bookings); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch bookings' }); }
});

app.get('/api/doctors', async (req, res) => {
    try { const doctors = await Doctor.find(); res.json(doctors); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch doctors' }); }
});

app.post('/api/toggle-availability', async (req, res) => {
    try {
        const { doctorId } = req.body;
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        doctor.available = !doctor.available;
        await doctor.save();
        res.json({ success: true, available: doctor.available });
    } catch (err) { res.status(500).json({ error: 'Failed to toggle availability' }); }
});

app.post('/api/add-doctor', async (req, res) => {
    try {
        const { name, specialty } = req.body;
        const newDoctor = new Doctor({ name, specialty });
        await newDoctor.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to add doctor' }); }
});

app.post('/api/prescription', async (req, res) => {
    try {
        const { patientName, patientEmail, medication } = req.body;
        const booking = await Booking.findOne({ email: patientEmail }).sort({ createdAt: -1 });
        if (booking) { booking.medication = medication; await booking.save(); }
        const doc = new PDFDocument();
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="prescription_${Date.now()}.pdf"` });
            res.send(pdfData);
        });
        doc.fontSize(25).fillColor('#007bff').text('Ziobunc Telemedicine', 100, 50, { align: 'center' });
        doc.fontSize(10).fillColor('#555').text('Global Healthcare, Anywhere.', { align: 'center' });
        doc.moveDown(); doc.moveDown();
        doc.fontSize(14).fillColor('#333').text('DIGITAL PRESCRIPTION', { align: 'center', underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Patient: ${patientName}`);
        doc.text(`Email: ${patientEmail}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(14).fillColor('#007bff').text('Prescribed Medication:');
        doc.fontSize(12).fillColor('#333').text(medication);
        doc.moveDown(); doc.moveDown();
        doc.fontSize(12).text('_________________________', { align: 'right' });
        doc.text('Doctor\'s Signature', { align: 'right' });
        doc.end();
    } catch (err) { res.status(500).json({ error: 'Failed to generate prescription' }); }
});

app.get('/api/patient-records', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const bookings = await Booking.find({ email: email }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch records' }); }
});

app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'dashboard.html')); });
app.get('/', (req, res) => { res.send('Ziobunc Backend is running on Cloud!'); });

app.get('/professionals', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Professionals</title>
    <style>
        body { font-family: 'Inter', sans-serif; background: #f9fafb; color: #111827; padding: 40px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { text-align: center; font-size: 32px; margin-bottom: 40px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
        .card h3 { margin: 0 0 8px 0; font-size: 18px; }
        .card p { color: #6b7280; margin: 0; font-size: 14px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
        .available { background: #dcfce7; color: #16a34a; }
        .busy { background: #fee2e2; color: #dc2626; }
        .back { text-align: center; margin-top: 40px; }
        .back a { color: #2563eb; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Our Professionals</h1>
        <div class="grid">`;
        doctors.forEach(d => {
            const statusClass = d.available ? 'available' : 'busy';
            const statusText = d.available ? 'Available' : 'Busy';
            html += `
                <div class="card">
                    <h3>${d.name}</h3>
                    <p>${d.specialty}</p>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>`;
        });
        html += `
        </div>
        <div class="back"><a href="/">← Back to Home</a></div>
    </div>
</body>
</html>`;
        res.send(html);
    } catch (err) {
        res.status(500).send('Error loading professionals');
    }
});

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => { socket.join(roomId); socket.to(roomId).emit('user-joined', 'A patient has joined the chat.'); });
    socket.on('chat-message', (data) => { socket.to(data.room).emit('chat-message', { sender: data.sender, message: data.message, timestamp: new Date().toLocaleTimeString() }); });
});

server.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
