import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import { CosmosClient } from "@azure/cosmos";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = client.database("customer-success-db");
const ticketContainer = database.container("ticket-container");
const customerContainer = database.container("customer-container");
const warrantyContainer = database.container("warranty-container"); //check warranty
const adminContainer = database.container("admin-container");
const chatHistoryContainer = database.container("chat-history-container"); //chat history
const technicianContainer = database.container("technician-container");
const sparePartsContainer = database.container("spare-parts-container");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";


const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;
const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;

// ---------------- helpers ----------------
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
  console.error("JWT error:", err.message);
  return res.status(401).json({ error: "Invalid/expired token" });
 
  }
  }   


async function findTicketByAnyId(id) {
  const query = {
    query:
      "SELECT * FROM c WHERE c.id = @id OR c.ticketId = @id",
    parameters: [{ name: "@id", value: id }],
  };
  const { resources } = await ticketContainer.items.query(query).fetchAll();
  return resources?.[0] || null;
}

function detectEmotion(text) {
  const msg = text.toLowerCase();

  if (
    msg.includes("angry") ||
    msg.includes("very bad") ||
    msg.includes("terrible") ||
    msg.includes("already called") ||
    msg.includes("not working again") ||
    msg.includes("complaint")
  ) {
    return "angry";
  }

  if (
    msg.includes("problem") ||
    msg.includes("issue") ||
    msg.includes("not working")
  ) {
    return "frustrated";
  }

  return "neutral";
}


async function sendManagerEmail(ticket) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

      const mailOptions = {
        from: " Technova Support <technova.support@gmail.com>",
        to: "manager@company.com",
        subject: "⚠ High Priority Ticket – Angry Customer",
        html: `
        <h2 style="color:red;">⚠ High Priority Ticket</h2>

        <p><strong>Customer:</strong> ${ticket.customerName}</p>
        <p><strong>Email:</strong> ${ticket.customerEmail}</p>

        <p><strong>Issue:</strong></p>
        <p>${ticket.issue}</p>

        <hr>

        <p><strong>Emotion:</strong> ${ticket.emotion}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>

        <p>Please check the system immediately.</p>
        `
      };

  await transporter.sendMail(mailOptions);
}
/**
 * ✅ IMPORTANT: Cosmos partition key for customer-container might NOT be email.
 * So we do:
 * 1) try direct read with (id=email, pk=email)
 * 2) if fails, fallback to query by email
 */
async function getCustomerByEmail(email) {
  // Attempt direct read (works if pk is /email or /id and both equal email)
  try {
    const { resource } = await customerContainer.item(email, email).read();
    if (resource) return resource;
  } catch {
    // ignore and fallback to query
  }

  // Fallback query (works regardless of partition key)
  const query = {
    query: "SELECT TOP 1 * FROM c WHERE LOWER(c.email) = @email",
    parameters: [{ name: "@email", value: String(email).toLowerCase() }],
  };
  const { resources } = await customerContainer.items.query(query).fetchAll();
  return resources?.[0] || null;
}

/**
 * Create customer in a way that works with different partition keys.
 * We store BOTH id and email as the same value (email),
 * so pk can be /id or /email and still work.
 */
async function createCustomerDoc({ name, email, passwordHash }) {
  const doc = {
    id: email,
    email,
    name,
    passwordHash,
    role: "customer",
    createdAt: new Date().toISOString(),
  };

  try {
    const { resource } = await customerContainer.items.create(doc);
    return resource;

  } catch (e1) {

    console.warn("Create failed, retrying with partitionKey=email", e1.message);

    try {
      const { resource } = await customerContainer.items.create(doc, {
        partitionKey: email,
      });
      return resource;

    } catch (e2) {

      console.warn("Retry failed, trying partitionKey=id", e2.message);

      const { resource } = await customerContainer.items.create(doc, {
        partitionKey: doc.id,
      });

      return resource;
    }
  }
}
// ---------------- routes ----------------
app.get("/ping", (req, res) => res.json({ message: "Backend is working ✅" }));
app.get("/", (req, res) => {
  res.json({ message: "Technova AI Customer Success Guardian Backend Running " });
});
// ✅ CUSTOMER SIGNUP
// body: { name, email, password }
// ---------------- CUSTOMER SIGNUP ----------------

app.post("/api/auth/signup", async (req, res) => {

  try {

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

if (!name || !email || !password) {
  return res.status(400).json({
    error: "Name, email, password required"
  });
}

if (!email.includes("@")) {
  return res.status(400).json({
    error: "Invalid email format"
  });
}

    const existing = await getCustomerByEmail(email);

    if (existing) {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await createCustomerDoc({
      name,
      email,
      passwordHash
    });

    const token = createToken({
      id: created.id,
      email: created.email,
      role: created.role
    });

    res.status(201).json({
      token,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Signup failed"
    });

  }

});

// ✅ CUSTOMER LOGIN
// body: { email, password }
app.post("/api/auth/login", async (req, res) => {

  try {

    const email = String(req.body.email || "").toLowerCase();
    const password = String(req.body.password || "");

    const customer = await getCustomerByEmail(email);

    if (!customer) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const ok = await bcrypt.compare(
      password,
      customer.passwordHash
    );

    if (!ok) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = createToken({
      id: customer.id,
      email: customer.email,
      role: customer.role
    });

    res.json({
      token,
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: customer.role
      }
    });

  } catch (err) {

  console.error("Login error:", err);

  res.status(500).json({
    error: "Login failed"
  });

}

});

app.post("/api/technician/login", async (req, res) => {

  const { email, password } = req.body;

  const query = {
    query: "SELECT * FROM c WHERE c.email = @email",
    parameters: [{ name: "@email", value: email }]
  };

  const { resources } = await technicianContainer.items.query(query).fetchAll();

  if (!resources.length) {
    return res.status(401).json({ error: "Technician not found" });
  }

  const tech = resources[0];

  if (tech.password !== password) {
    return res.status(401).json({ error: "Invalid password" });
  }

  res.json({
    technician: {
      id: tech.id,
      name: tech.name,
      email: tech.email
    }
  });

});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [
        { name: "@email", value: email }
      ]
    };

    const { resources } = await adminContainer.items
      .query(query)
      .fetchAll();

    const admin = resources[0];

    if (!admin) {
      return res.status(401).json({
        error: "Admin not found"
      });
    }

    if (admin.password !== password) {
      return res.status(401).json({
        error: "Invalid password"
      });
    }

    res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server error"
    });
  }
});

// ✅ WHO AM I (test token)
app.get("/api/auth/me", authRequired, async (req, res) => {

  const email = req.user.email;

  const customer = await getCustomerByEmail(email);

  if (!customer) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    user: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: customer.role
    }
  });

});


// ✅ CREATE TICKET
app.post("/api/tickets", async (req, res) => {
  try {
    const newId = Date.now().toString();

    const emotion = detectEmotion(req.body.issue);

    let priority = "Normal";
    if (emotion === "angry") {
      priority = "High";
    }

    const ticket = {
      id: newId,
      ticketId: newId,
      customerName: req.body.customerName || "",
      customerEmail: String(req.body.customerEmail || "").toLowerCase(),
      issue: req.body.issue || "",
      emotion: emotion,
      priority: priority,
      status: "Open",
      createdAt: new Date().toISOString()
    };

    // 1️⃣ Save ticket to Cosmos DB
  await ticketContainer.items.create(ticket);

    // 2️⃣ If customer is angry → send email to manager
    if (emotion === "angry") {
      await sendManagerEmail(ticket);
    }

    // 3️⃣ Return response
    res.json(ticket);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET ALL TICKETS
app.get("/api/tickets", async (req, res) => {
  try {

    const query = {
      query: "SELECT * FROM c ORDER BY c.createdAt DESC"
    };

    const { resources } = await ticketContainer.items
      .query(query)
      .fetchAll();

    res.json(resources);

  } catch (err) {

    res.status(500).json({
      error: err?.message || "Load tickets failed"
    });
  }

});

// ✅ GET MY TICKETS (customer only)
app.get("/api/tickets/my", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const email = String(req.user.email || "").trim().toLowerCase();

    const query = {
      query:
        "SELECT * FROM c WHERE LOWER(c.customerEmail) = @email ORDER BY c.createdAt DESC",
      parameters: [{ name: "@email", value: email }],
    };

    const { resources } = await ticketContainer.items.query(query).fetchAll();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Load my tickets failed" });
  }
});

// ✅ GET ONE
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const ticket = await findTicketByAnyId(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Load ticket failed" });
  }
});

// ✅ UPDATE STATUS
app.put("/api/tickets/:id/status", async (req, res) => {

  try {

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing status" });
    }

    const existing = await findTicketByAnyId(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const partitionKey = existing.ticketId || existing.id;

    const updatedTicket = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await ticketContainer
      .item(existing.id, partitionKey)
      .replace(updatedTicket);

    res.json(resource);

  } catch (err) {

    res.status(500).json({
      error: err?.message || "Update status failed"
    });

  }

});
//  Viki updated
// ==============================
// SUPPORT SERVICE (Self-Fix Bot)
// ==============================
app.post("/support/troubleshoot", (req, res) => {
  try {
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({ error: "Issue description required" });
    }

    // Simple demo logic (can expand later)
    if (issue.toLowerCase().includes("noise")) {
      return res.json({
        canSelfFix: true,
        steps: [
          "Turn off power supply",
          "Tighten mounting screws",
          "Check blade alignment",
        ],
      });
    }

    res.json({
      canSelfFix: false,
      message: "Issue requires technician visit",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==============================
// DISPATCH SERVICE
// ==============================
app.post("/dispatch/assign", async (req, res) => {
  try {
    const { ticketId, skill } = req.body;

    // Validate input
    if (!ticketId || !skill) {
      return res.status(400).json({
        error: "ticketId and skill are required"
      });
    }

    // Query technician database
    const querySpec = {
      query: "SELECT * FROM c WHERE c.skill = @skill",
      parameters: [
        {
          name: "@skill",
          value: skill
        }
      ]
    };

    const { resources } = await technicianContainer.items
      .query(querySpec)
      .fetchAll();

    // If no technician available
    if (!resources || resources.length === 0) {
      return res.json({
        ticketId,
        skill,
        status: "no_technician_available",
        message: "No technician found with required skill"
      });
    }

    // Assign first technician
    const technician = resources[0];

    res.json({
      ticketId,
      technicianName: technician.name,
      technicianPhone: technician.phone,
      skill: technician.skill,
      status: "assigned"
    });

  } catch (error) {
    console.error("Dispatch Error:", error);

    res.status(500).json({
      error: "Dispatch service failed"
    });
  }
});
// ==============================
// STOCK SERVICE (Spare Parts)
// ==============================

app.post("/stock/check", async (req, res) => {

  try {

    const { partName } = req.body;

    if (!partName) {
      return res.status(400).json({
        error: "partName required"
      });
    }

    const query = {
      query: "SELECT * FROM c WHERE LOWER(c.partName) = @partName",
      parameters: [
        {
          name: "@partName",
          value: partName.toLowerCase()
        }
      ]
    };

    const { resources } = await sparePartsContainer.items
      .query(query)
      .fetchAll();

    if (resources.length === 0) {
      return res.json({
        available: false,
        message: "Spare part not found"
      });
    }

    const part = resources[0];

    res.json({
      partName: part.partName,
      stock: part.stock,
      available: part.stock > 0
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});
// ==============================
// WARRANTY SERVICE
// ==============================
app.post("/check-warranty", async (req, res) => {
  try {
    const { serialNumber } = req.body;

    if (!serialNumber) {
      return res.status(400).json({ error: "serialNumber is required" });
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.serialNumber = @serialNumber",
      parameters: [
        {
          name: "@serialNumber",
          value: serialNumber
        }
      ]
    };

    const { resources } = await warrantyContainer.items
      .query(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      return res.json({
        serialNumber: serialNumber,
        inWarranty: false,
        status: "not_found",
        message: "Warranty record not found"
      });
    }

    const warranty = resources[0];

    res.json({
      serialNumber: warranty.serialNumber,
      inWarranty: warranty.warrantyValid,
      expiryDate: warranty.warrantyExpiryDate,
      status: "found"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
// ==============================
// TECHNICIAN SERVICE
// ==============================
app.get("/technician/available", (req, res) => {
  try {
    const { location } = req.query;

    // For demo, return static technicians
    const technicians = [
      {
        id: "TECH-001",
        name: "Arun Kumar",
        location: "Kuala Lumpur",
        status: "AVAILABLE"
      },
      {
        id: "TECH-002",
        name: "Ravi Das",
        location: "Selangor",
        status: "AVAILABLE"
      }
    ];

    if (location) {
      const filtered = technicians.filter(
        (t) => t.location.toLowerCase() === location.toLowerCase()
      );
      return res.json(filtered);
    }

    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/technician/complete", async (req,res)=>{
 const { ticketId } = req.body;
})

// ==============================
// QUOTE SERVICE
// ==============================
app.post("/quote/generate", (req, res) => {
  try {
    const { serialNumber, issueDescription } = req.body;

    if (!serialNumber || !issueDescription) {
      return res.status(400).json({
        error: "serialNumber and issueDescription required"
      });
    }

    // Simple demo pricing logic
    const repairCost = 180; // Flat demo price

    res.json({
      quoteId: "Q-" + Date.now(),
      serialNumber,
      estimatedRepairCost: repairCost,
      currency: "MYR",
      message: "Quotation generated successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// CHAT HISTORY SERVICE
// ==============================
app.post("/chat", async (req, res) => {
  try {

    const { userId, message } = req.body;

    // Save user message
    await chatHistoryContainer.items.create({
      id: Date.now().toString(),
      userId,
      message,
      role: "user",
      timestamp: new Date().toISOString()
    });

    // Get previous history
    const query = {
      query: "SELECT * FROM c WHERE c.userId=@userId ORDER BY c.timestamp",
      parameters: [{ name: "@userId", value: userId }]
    };

    const { resources } = await chatHistoryContainer.items.query(query).fetchAll();

    const messages = resources.map(m => ({
      role: m.role,
      content: m.message
    }));

    // Send to Foundry
    const response = await axios.post(
      FOUNDRY_ENDPOINT,
      { messages },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": FOUNDRY_API_KEY
        }
      }
    );

    const aiMessage = response.data.choices[0].message.content;

    // Save AI message
    await chatHistoryContainer.items.create({
      id: Date.now().toString(),
      userId,
      message: aiMessage,
      role: "assistant",
      timestamp: new Date().toISOString()
    });

    res.json({ reply: aiMessage });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.post("/chat/history", async (req, res) => {
  try {

    const { userId, message, role } = req.body;

    const chat = {
      id: Date.now().toString(),
      userId,
      message,
      role,
      timestamp: new Date().toISOString()
    };

    await chatHistoryContainer.items.create(chat);

    res.json(chat);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save chat" });
  }
});

app.get("/chat/history/:userId", async (req, res) => {
  try {

    const { userId } = req.params;

    const query = {
      query: "SELECT * FROM c WHERE c.userId=@userId ORDER BY c.timestamp",
      parameters: [{ name: "@userId", value: userId }]
    };

    const { resources } = await chatHistoryContainer.items.query(query).fetchAll();

    res.json(resources);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
