const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const formData = require('form-data');
const fs = require('fs');

const app = express();
const port = 3001;
const DROPBOX_SIGN_KEY = 'a12854a28332838ade3ade491162760bf787c6f5bfb155a4d6715a9fe5cd5fdc';

app.use(cors());
app.use(bodyParser.json());

const dbPath = path.resolve(__dirname, 'proposals.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS proposals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            locationName TEXT,
            clientName TEXT,
            clientEmail TEXT,
            clientPhone TEXT,
            packageType TEXT,
            listPrice REAL,
            agreementValue REAL,
            agreementLength INTEGER,
            paymentTerms TEXT,
            firstPaymentDate TEXT,
            isRevised BOOLEAN,
            isMultiLocation BOOLEAN,
            locationCount INTEGER,
            isPromo BOOLEAN,
            promoMonths INTEGER,
            isDiscount BOOLEAN,
            discountAmt REAL,
            discountType TEXT,
            isHubAndSpoke BOOLEAN,
            hubPrice REAL,
            spokePrice REAL,
            proposalDate TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS proposal_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proposalId INTEGER,
            name TEXT,
            FOREIGN KEY(proposalId) REFERENCES proposals(id)
        )`);
    }
});

// GET all proposals
app.get('/api/proposals', (req, res) => {
    db.all("SELECT * FROM proposals ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// GET a specific proposal
app.get('/api/proposals/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM proposals WHERE id = ?", [id], (err, proposal) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!proposal) {
            res.status(404).json({ "error": "Proposal not found" });
            return;
        }
        db.all("SELECT name FROM proposal_locations WHERE proposalId = ?", [id], (err, locations) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            proposal.locations = locations.map(l => l.name);
            res.json({
                "message": "success",
                "data": proposal
            });
        });
    });
});

// POST a new proposal
app.post('/api/proposals', (req, res) => {
    const data = req.body;
    const sql = `INSERT INTO proposals (
        locationName, clientName, clientEmail, clientPhone, packageType, 
        listPrice, agreementValue, agreementLength, paymentTerms, firstPaymentDate, 
        isRevised, isMultiLocation, locationCount, isPromo, promoMonths, 
        isDiscount, discountAmt, discountType, isHubAndSpoke, hubPrice, spokePrice, proposalDate
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    
    const params = [
        data.locationName, data.clientName, data.clientEmail, data.clientPhone, data.packageType,
        data.listPrice, data.agreementValue, data.agreementLength, data.paymentTerms, data.firstPaymentDate,
        data.isRevised ? 1 : 0, data.isMultiLocation ? 1 : 0, data.locationCount, data.isPromo ? 1 : 0, data.promoMonths,
        data.isDiscount ? 1 : 0, data.discountAmt, data.discountType, data.isHubAndSpoke ? 1 : 0, data.hubPrice, data.spokePrice, data.proposalDate
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const proposalId = this.lastID;
        
        // Insert locations
        if (data.locations && data.locations.length > 0) {
            const locSql = "INSERT INTO proposal_locations (proposalId, name) VALUES (?, ?)";
            const stmt = db.prepare(locSql);
            data.locations.forEach(name => {
                stmt.run(proposalId, name);
            });
            stmt.finalize();
        }

        res.json({
            "message": "success",
            "data": { id: proposalId }
        });
    });
});

// PUT (update) a proposal
app.put('/api/proposals/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const sql = `UPDATE proposals SET 
        locationName = ?, clientName = ?, clientEmail = ?, clientPhone = ?, packageType = ?, 
        listPrice = ?, agreementValue = ?, agreementLength = ?, paymentTerms = ?, firstPaymentDate = ?, 
        isRevised = ?, isMultiLocation = ?, locationCount = ?, isPromo = ?, promoMonths = ?, 
        isDiscount = ?, discountAmt = ?, discountType = ?, isHubAndSpoke = ?, hubPrice = ?, spokePrice = ?, proposalDate = ?
        WHERE id = ?`;
    
    const params = [
        data.locationName, data.clientName, data.clientEmail, data.clientPhone, data.packageType,
        data.listPrice, data.agreementValue, data.agreementLength, data.paymentTerms, data.firstPaymentDate,
        data.isRevised ? 1 : 0, data.isMultiLocation ? 1 : 0, data.locationCount, data.isPromo ? 1 : 0, data.promoMonths,
        data.isDiscount ? 1 : 0, data.discountAmt, data.discountType, data.isHubAndSpoke ? 1 : 0, data.hubPrice, data.spokePrice, data.proposalDate,
        id
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        // Simplest way to update locations: delete all and re-insert
        db.run("DELETE FROM proposal_locations WHERE proposalId = ?", [id], (err) => {
            if (data.locations && data.locations.length > 0) {
                const locSql = "INSERT INTO proposal_locations (proposalId, name) VALUES (?, ?)";
                const stmt = db.prepare(locSql);
                data.locations.forEach(name => {
                    stmt.run(id, name);
                });
                stmt.finalize();
            }
            res.json({
                "message": "success"
            });
        });
    });
});

// DELETE a proposal
app.delete('/api/proposals/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM proposals WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        db.run("DELETE FROM proposal_locations WHERE proposalId = ?", [id], (err) => {
            res.json({ "message": "deleted", "changes": this.changes });
        });
    });
});

// SIGNING (Dropbox Sign)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/sign', upload.single('file'), async (req, res) => {
    try {
        const { clientName, clientEmail, title } = req.body;
        const filePath = req.file.path;

        const form = new formData();
        form.append('test_mode', 1);
        form.append('clientId', DROPBOX_SIGN_KEY); // Note: Key usage varies by SDK/API version
        form.append('title', title || 'Agreement');
        form.append('subject', 'Please sign your BevSpot Proposal');
        form.append('message', 'Please review and sign this proposal.');
        form.append('signers[0][email_address]', clientEmail);
        form.append('signers[0][name]', clientName);
        form.append('files[0]', fs.createReadStream(filePath));

        const response = await axios.post('https://api.hellosign.com/v3/signature_request/send', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Basic ${Buffer.from(DROPBOX_SIGN_KEY + ':').toString('base64')}`
            }
        });

        // Cleanup
        fs.unlinkSync(filePath);

        res.json({ message: 'success', data: response.data });
    } catch (err) {
        console.error('Dropbox Sign Error:', err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Failed to send for signing', details: err.response ? err.response.data : err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
