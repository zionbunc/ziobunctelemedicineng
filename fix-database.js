const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://bunmait_db_user:udMUODyy3lrtQ5GQ@cluster0.ahwssg3.mongodb.net/ziobuncTelemedicine?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    console.log('✅ Connected to database.');
    await mongoose.connection.db.collection('doctors').deleteMany({});
    console.log('✅ Fake doctors removed.');
    
    const doctorSchema = new mongoose.Schema({
        name: String,
        specialty: String,
        available: { type: Boolean, default: true }
    });
    const Doctor = mongoose.model('Doctor', doctorSchema);
    await Doctor.create({
        name: 'Babatunde Christiana Bosede',
        specialty: 'Public Health & Pharmacy Technician',
        available: true
    });
    console.log('✅ You have been added as the only professional.');
    process.exit();
})
.catch(err => {
    console.error('❌ Error:', err);
    process.exit();
});
