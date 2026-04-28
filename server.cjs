require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const bodyParser = require('body-parser');
const path      = require('path');
const axios     = require('axios');
const formData  = require('form-data');
const fs        = require('fs');

const app  = express();
const port = process.env.PORT || 3001;
const DROPBOX_SIGN_KEY = process.env.DROPBOX_SIGN_KEY;

app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// ── MongoDB Connection ────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB.'))
    .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });

// ── Schema & Model ────────────────────────────────────────────────────────────
const proposalSchema = new mongoose.Schema({
    locationName:    String,
    clientName:      String,
    clientEmail:     String,
    clientPhone:     String,
    packageType:     String,
    listPrice:       Number,
    agreementValue:  Number,
    agreementLength: Number,
    paymentTerms:    String,
    firstPaymentDate: String,
    isRevised:       Boolean,
    isMultiLocation: Boolean,
    locationCount:   Number,
    isPromo:         Boolean,
    promoMonths:     Number,
    isDiscount:      Boolean,
    discountAmt:     Number,
    discountType:    String,
    isHubAndSpoke:   Boolean,
    hubPrice:        Number,
    spokePrice:      Number,
    proposalDate:    String,
    locations:       [String],   // embedded — no join table needed
    createdAt:       { type: Date, default: Date.now }
}, { versionKey: false });

const Proposal = mongoose.model('Proposal', proposalSchema);

// ── Helper: map Mongoose doc → plain object with numeric id ───────────────────
function serialize(doc) {
    const obj = doc.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    return obj;
}

// ── GET all proposals ─────────────────────────────────────────────────────────
app.get('/api/proposals', async (req, res) => {
    try {
        const docs = await Proposal.find().sort({ createdAt: -1 });
        res.json({ message: 'success', data: docs.map(serialize) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── GET a specific proposal ───────────────────────────────────────────────────
app.get('/api/proposals/:id', async (req, res) => {
    try {
        const doc = await Proposal.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Proposal not found' });
        res.json({ message: 'success', data: serialize(doc) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── POST a new proposal ───────────────────────────────────────────────────────
app.post('/api/proposals', async (req, res) => {
    try {
        const doc = await Proposal.create(req.body);
        res.json({ message: 'success', data: { id: doc._id.toString() } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── PUT (update) a proposal ───────────────────────────────────────────────────
app.put('/api/proposals/:id', async (req, res) => {
    try {
        const doc = await Proposal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: 'Proposal not found' });
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── DELETE a proposal ─────────────────────────────────────────────────────────
app.delete('/api/proposals/:id', async (req, res) => {
    try {
        const result = await Proposal.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'Proposal not found' });
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── Signing (Dropbox Sign) ────────────────────────────────────────────────────
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/sign', upload.single('file'), async (req, res) => {
    try {
        const { clientName, clientEmail, title } = req.body;
        const filePath = req.file.path;

        const form = new formData();
        form.append('test_mode', 1);
        form.append('title', title || 'Agreement');
        form.append('subject', 'Please sign your BevSpot Proposal');
        form.append('message', 'Please review and sign this proposal.');
        form.append('signers[0][email_address]', clientEmail);
        form.append('signers[0][name]', clientName);
        form.append('files[0]', fs.createReadStream(filePath));

        const response = await axios.post(
            'https://api.hellosign.com/v3/signature_request/send',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Basic ${Buffer.from(DROPBOX_SIGN_KEY + ':').toString('base64')}`
                }
            }
        );

        fs.unlinkSync(filePath);
        res.json({ message: 'success', data: response.data });
    } catch (err) {
        console.error('Dropbox Sign Error:', err.response ? err.response.data : err.message);
        res.status(500).json({
            error: 'Failed to send for signing',
            details: err.response ? err.response.data : err.message
        });
    }
});

// ── SPA catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
