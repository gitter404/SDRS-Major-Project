require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const User = require('./models/User'), Resource = require('./models/Resource'), Incident = require('./models/Incident');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Resource.deleteMany({}), Incident.deleteMany({})]);
  await User.create({ name: 'Admin', email: 'admin@sdrs.com', password: await bcrypt.hash('admin123', 10), role: 'authority', phone: '9000000000' });
  const cit = await User.create({ name: 'Citizen', email: 'citizen@sdrs.com', password: await bcrypt.hash('citizen123', 10), phone: '9111111111' });
  const P = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });
  await Resource.insertMany([
    { name: 'IGMC Hospital', type: 'Hospital', phone: '1010', capacity: 50, location: P(77.1734, 31.1048) },
    { name: 'Shimla Fire Station', type: 'Fire Brigade', phone: '101', location: P(77.1700, 31.1030) },
    { name: 'NDRF Team Alpha', type: 'Rescue Team', phone: '1020', location: P(77.1850, 31.1100) },
    { name: 'Volunteer Group 1', type: 'Volunteer', phone: '1030', location: P(77.1600, 31.0990) },
    { name: 'Community Shelter', type: 'Shelter', phone: '1040', capacity: 200, location: P(77.1900, 31.1150) },
  ]);
  const base = { reportedBy: cit._id, reporterName: cit.name, reporterPhone: cit.phone, statusHistory: [{ status: 'Reported', changedBy: cit._id }] };
  await Incident.insertMany([
    { ...base, description: 'Person unconscious and bleeding heavily near mall road', category: 'Medical', priority: 9, location: P(77.1722, 31.1041) },
    { ...base, description: 'Fire in a building, people trapped on second floor', category: 'Fire', priority: 10, location: P(77.1760, 31.1070) },
    { ...base, description: 'Landslide, family needs shelter', category: 'Shelter', priority: 6, location: P(77.1800, 31.1120) },
  ]);
  console.log('Seeded. Admin: admin@sdrs.com / admin123 | Citizen: citizen@sdrs.com / citizen123');
  process.exit(0);
})();
