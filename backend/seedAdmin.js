require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('./models/user');

mongoose.connect(process.env.DB).then(async () => {
    try {
        const existing = await User.findOne({ email: 'admin@deb.com' });
        if (existing) {
            console.log("Admin already exists!");
            if(existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
                console.log("Role updated to admin.");
            }
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash('Admin@123', salt);
            await new User({
                firstName: 'Super', 
                lastName: 'Admin', 
                email: 'admin@deb.com', 
                password: hashPassword, 
                role: 'admin',
                isVerified: true
            }).save();
            console.log("Admin created successfully!");
        }
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
});
