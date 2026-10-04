require('dotenv').config();
const express=require('express');
const dns=require('node:dns');
dns.setServers(['8.8.8.8','1.1.1.1']);
const cors=require('cors');
const mongoose=require('mongoose');
const app=express();
const helmet=require('helmet');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/api/health',(req,res)=>{
  res.json({status:'ok'})
})
app.use('/api/auth',require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/recurring', require('./routes/recurringRoutes'));
app.use('/api/summary', require('./routes/summaryRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(require('./middleware/error'));

const PORT=process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
  console.log('MongoDB connected');
  app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`))
})
.catch((err)=>{
  console.error('MongoDB connection error:', err);
  process.exit(1);
})