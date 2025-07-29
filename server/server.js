import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/Monster', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User/Login Model & Route
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', userSchema);

// Insert default admin user if not exists
(async () => {
  const adminEmail = 'admin@tiffinwala.com';
  const adminPassword = 'admin123';
  const existing = await User.findOne({ username: adminEmail });
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await User.create({ username: adminEmail, password: hash });
    console.log('Default admin user created');
  } else {
    console.log('Admin user already exists');
  }
})();

app.post('/api/login', async (req, res) => {
  console.log('POST /api/login', req.body);
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ success: true, user: { username: user.username } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Client Model & Routes
const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  lunchCost: Number,
  dinnerCost: Number,
  remindersEnabled: Boolean,
  customQuantityEnabled: { type: Boolean, default: false },
  discount: { type: Number, default: 0 } // Discount percentage for the client
});
const Client = mongoose.model('Client', clientSchema);

app.post('/api/clients', async (req, res) => {
  console.log('POST /api/clients', req.body);
  try {
    const client = new Client(req.body);
    await client.save();
    res.json(client);
  } catch (err) {
    console.error('Error saving client:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find();
    console.log('GET /api/clients', clients);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/:id - Update a client
app.put('/api/clients/:id', async (req, res) => {
  console.log('PUT /api/clients/:id', req.params.id, req.body);
  try {
    const updateData = { ...req.body };
    const updated = await Client.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clients/:id - Delete a client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance Model & Routes
const attendanceSchema = new mongoose.Schema({
  clientId: String,
  date: String,
  mealType: String,
  timestamp: String,
  status: String,
  quantity: Number
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

app.post('/api/attendance', async (req, res) => {
  console.log('POST /api/attendance', req.body);
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.find();
    console.log('GET /api/attendance', attendance);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/attendance/:id - Update attendance
app.put('/api/attendance/:id', async (req, res) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/attendance/:id - Delete attendance
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bill Model & Routes
const billSchema = new mongoose.Schema({
  client: {
    _id: String,
    name: String,
    mobile: String,
    lunchCost: Number,
    dinnerCost: Number,
    discount: Number
  },
  month: String,
  lunchDays: Number,
  dinnerDays: Number,
  lunchTotal: Number,
  dinnerTotal: Number,
  discountAmount: Number,
  grandTotal: Number,
  attendanceRecords: [String],
  generatedAt: { type: Date, default: Date.now }
});
const Bill = mongoose.model('Bill', billSchema);

app.post('/api/bills', async (req, res) => {
  console.log('POST /api/bills', req.body);
  try {
    const bill = new Bill(req.body);
    await bill.save();
    res.json(bill);
  } catch (err) {
    console.error('Error saving bill:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bills', async (req, res) => {
  try {
    const bills = await Bill.find();
    console.log('GET /api/bills', bills);
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Print Model & Routes
const printSchema = new mongoose.Schema({
  clientId: String,
  printDate: String,
  details: String
});
const Print = mongoose.model('Print', printSchema);

app.post('/api/prints', async (req, res) => {
  console.log('POST /api/prints', req.body);
  try {
    const print = new Print(req.body);
    await print.save();
    res.json(print);
  } catch (err) {
    console.error('Error saving print:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/prints', async (req, res) => {
  try {
    const prints = await Print.find();
    console.log('GET /api/prints', prints);
    res.json(prints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add/fix GET API to fetch all users (for admin/debug)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Do not return password hash
    console.log('GET /api/users', users);
    res.json(users);
  } catch (err) {
    console.error('Error in GET /api/users:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - Register a new user with hashed password
app.post('/api/users', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });
    res.status(201).json({ success: true, user: { username: user.username } });
  } catch (err) {
    console.error('Error in POST /api/users:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log('Server started on port 5000')); 