// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const dealerRoutes = require('./routes/dealer');
const farmerRoutes = require('./routes/farmer');
const farmerProfileRoutes = require('./routes/farmerProfile');
const dealerProfileRoutes = require('./routes/dealerProfile');
const shopRoutes = require('./routes/shopRoutes');
const deliveryRoutes = require('./routes/delivery');
const { authMiddleware } = require('./middleware/auth');
const aiAdvisoryRoutes = require('./routes/aiAdvisoryRoutes');
const carbonCreditRoutes = require('./routes/carbonCreditRoutes');
const organicFarmingRoutes = require('./routes/organicFarmingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const job = require('./lib/corn');
app.use(express.json());

// Connect MongoDB

mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.log("❌ Connection error:", err));

job.start();

// Routes
app.use('/auth', authRoutes);
app.use('/admin', authMiddleware, adminRoutes);
app.use('/dealer', authMiddleware, dealerRoutes);
app.use('/farmer', authMiddleware, farmerRoutes);
app.use('/farmer', authMiddleware, farmerProfileRoutes);
app.use('/dealer', authMiddleware, dealerProfileRoutes);
app.use('/shops', authMiddleware, shopRoutes);
app.use('/delivery', authMiddleware, deliveryRoutes);
app.use('/ai', authMiddleware, aiAdvisoryRoutes);
app.use('/carbon-credits', authMiddleware, carbonCreditRoutes);
app.use('/organic-farming', authMiddleware, organicFarmingRoutes);
app.use('/notifications', authMiddleware, notificationRoutes);

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});


app.get("/", (req, res) => {
  res.json({
    message: "Welcome to AgroSetuFarmFix API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/auth",
      admin: "/admin",
      dealer: "/dealer",
      farmer: "/farmer",
      delivery: "/delivery",
      aiAdvisory: "/ai",
      carbonCredits: "/carbon-credits",
      organicFarming: "/organic-farming",
      notifications: "/notifications",
      health: "/health"
    }
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`AgroSetuFarmFix backend running on port ${process.env.PORT || 3000}`);
});



