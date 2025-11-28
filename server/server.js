const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const authRoute = require('./routes/auth');
app.use('/auth', authRoute);
const productsRoute = require('./routes/products');
app.use('/products', productsRoute);

// upload route for admin to upload image files
const uploadRoute = require('./routes/upload');
app.use('/upload', uploadRoute);

const ordersRoute = require('./routes/orders');
app.use('/orders', ordersRoute);

app.listen(3000, () => console.log('Server running on port 3000'));
