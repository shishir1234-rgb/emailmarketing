import express from 'express';
import { createTransport } from 'nodemailer';
import csv from 'csv-parser';
import { createReadStream, readFileSync } from 'fs';
import { render } from 'ejs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)); // Define __dirname using import.meta.url

const app = express();
const port = 3000;

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Route to trigger email sending
app.post('/send-emails', async (req, res) => {
    try {
        await sendEmailsFromCSV('contacts.csv');
        res.send('Emails are being sent');
    } catch (error) {
        console.error('An error occurred:', error.message);
        res.status(500).send('An error occurred: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

async function sendEmailsFromCSV(filePath) {
    const results = [];

    // Read the CSV file and push each row to results array
    return new Promise((resolve, reject) => {
        createReadStream(join(__dirname, filePath))
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    for (const contact of results) {
                        await sendEmail(contact.gmail, contact.name, contact.username, contact.subject);
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function sendEmail(email, name, username, subject) {
    // Create a Nodemailer transporter using Gmail
    let transporter = createTransport({
        service: 'gmail',
        auth: {
            user: 'gautamshiv170@gmail.com', // Replace with your Gmail email
            pass: 'wodp knjm mjcr rmii' // Replace with your Gmail password or app-specific password
        }
    });

    console.log("name",name);
    console.log("username",username);

    // Load and render the HTML template
    const templatePath = join(__dirname, './public/template.html');
    const template = readFileSync(templatePath, 'utf8');
    const html = render(template, { name, username });

    // Define email options
    let mailOptions = {
        from: 'gautamshiv170@gmail.com', // Replace with your Gmail email
        to: email,
        subject: subject,
        html: html
    };

    // Send email and return a promise to handle success or failure
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                reject(error);
            } else {
                console.log('Email sent:', info.response);
                resolve(info.response);
            }
        });
    });
}
