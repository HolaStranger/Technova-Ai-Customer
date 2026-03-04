// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { CosmosClient } from "@azure/cosmos";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

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

/**
 * ✅ IMPORTANT:
 * Cosmos partition key for customer-container might NOT be email.
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
app.get("/auth/me", authRequired, (req, res) => res.json({ user: req.user }));

// ✅ CREATE TICKET
app.post("/tickets", async (req, res) => {
  try {
    const newId = Date.now().toString();

    const ticket = {
      id: newId,
      ticketId: newId,
      customerName: req.body.customerName || "",
      customerEmail: String(req.body.customerEmail || "").toLowerCase(),
      issue: req.body.issue || "",
      status: req.body.status || "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body,
    };

    const { resource } = await ticketContainer.items.create(ticket);
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Create ticket failed" });
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
app.get("/tickets/my", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const email = String(req.user.email || "").toLowerCase();

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
app.get("/tickets/:id", async (req, res) => {
  try {
    const ticket = await findTicketByAnyId(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Load ticket failed" });
  }
});

// ✅ UPDATE STATUS
app.put("/tickets/:id/status", async (req, res) => {

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
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: "ticketId required" });
    }

    const ticket = await findTicketByAnyId(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const pk = ticket.ticketId || ticket.id;

    const updatedTicket = {
      ...ticket,
      status: "Assigned",
      technicianId: "TECH-001",
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await ticketContainer
      .item(ticket.id, pk)
      .replace(updatedTicket);

    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    const { resources } = await container.items
      .query(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      return res.status(404).json({
        message: "Warranty record not found"
      });
    }

    const warranty = resources[0];

    res.json({
      serialNumber: warranty.serialNumber,
      inWarranty: warranty.warrantyValid,
      expiryDate: warranty.warrantyExpiryDate
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


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
