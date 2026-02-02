const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB bağlantısı
mongoose.connect('mongodb://127.0.0.1:27017/projectz', { useNewUrlParser: true, useUnifiedTopology: true });

// Kullanıcı modeli
const UserSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    birthdate: String,
    password: String,
    verified: { type: Boolean, default: false },
    verificationCode: String
});
const User = mongoose.model('User', UserSchema);

// Eposta göndermek için nodemailer (Gmail örneği)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seninmail@gmail.com',
        pass: 'gmail_app_password'
    }
});

// Kayıt endpoint
app.post('/register', async (req, res) => {
    const { name, username, email, birthdate, password } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000); // 6 haneli kod

    const newUser = new User({ name, username, email, birthdate, password, verificationCode: code });
    await newUser.save();

    // Mail gönder
    await transporter.sendMail({
        from: 'seninmail@gmail.com',
        to: email,
        subject: 'Project Z - Doğrulama Kodu',
        text: `Doğrulama kodunuz: ${code}`
    });

    res.json({ message: 'Kayıt başarılı. E-posta doğrulama kodu gönderildi.' });
});

// Kod doğrulama
app.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    if (user.verificationCode == code) {
        user.verified = true;
        await user.save();
        res.json({ message: 'Doğrulama başarılı.' });
    } else {
        res.status(400).json({ message: 'Kod yanlış.' });
    }
});

app.listen(3000, () => console.log('Server 3000 portunda çalışıyor.'));
