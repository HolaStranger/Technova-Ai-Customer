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

const PORT = 5000;

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = client.database("customer-success-db");
const ticketContainer = database.container("ticket-container");
const customerContainer = database.container("customer-container"); // ✅ NEW

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// -------------------- helpers --------------------
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
  } catch (e) {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}

async function findTicketByAnyId(id) {
  const query = {
    query:
      "SELECT * FROM c WHERE c.id = @id OR c.ticketId = @id OFFSET 0 LIMIT 1",
    parameters: [{ name: "@id", value: id }],
  };
  const { resources } = await ticketContainer.items.query(query).fetchAll();
  return resources?.[0] || null;
}

// -------------------- routes --------------------
app.get("/ping", (req, res) => {
  res.json({ message: "Backend is working ✅" });
});

/**
 * ✅ CUSTOMER SIGNUP
 * body: { name, email, password }
 */
app.post("/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, password required" });
    }

    // check existing by email (partition key = email)
    const existing = await customerContainer
      .item(email, email)
      .read()
      .catch(() => null);
    if (existing?.resource) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const customer = {
      id: email, // keep simple: id = email
      email, // partition key
      name,
      passwordHash, // ✅ hashed, not plain
      role: "customer",
      createdAt: new Date().toISOString(),
    };

    await customerContainer.items.create(customer);

    const token = createToken({
      id: customer.id,
      email: customer.email,
      role: "customer",
    });

    res.status(201).json({
      token,
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ CUSTOMER LOGIN
 * body: { email, password }
 */
app.post("/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email & password required" });
    }

    const { resource } = await customerContainer
      .item(email, email)
      .read()
      .catch(() => ({ resource: null }));
    if (!resource)
      return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, resource.passwordHash || "");
    if (!ok)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = createToken({
      id: resource.id,
      email: resource.email,
      role: "customer",
    });

    res.json({
      token,
      user: {
        id: resource.id,
        name: resource.name,
        email: resource.email,
        role: resource.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ WHO AM I (test token)
 */
app.get("/auth/me", authRequired, async (req, res) => {
  res.json({ user: req.user });
});

/**
 * ✅ CREATE TICKET
 * - if customer is logged in, save customerEmail + customerId
 */
app.post("/tickets", async (req, res) => {
  try {
    const newId = Date.now().toString();

    const ticket = {
      id: newId,
      ticketId: newId, // partition key used by your container
      customerName: req.body.customerName || "",
      customerEmail: (req.body.customerEmail || "").toLowerCase(), // ✅ link ticket to customer
      issue: req.body.issue || "",
      status: req.body.status || "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body,
    };

    const { resource } = await ticketContainer.items.create(ticket);
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ GET TICKETS
 * - admin/technician can call without token (demo)
 * - customers should call /tickets/my (below)
 */
app.get("/tickets", async (req, res) => {
  try {
    const query = "SELECT * FROM c ORDER BY c.createdAt DESC";
    const { resources } = await ticketContainer.items.query(query).fetchAll();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ GET MY TICKETS (CUSTOMER ONLY)
 */
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ GET ONE TICKET
 */
app.get("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await findTicketByAnyId(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ UPDATE TICKET STATUS
 * PUT /tickets/:id/status
 * body: { status }
 */
app.put("/tickets/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: "Missing status" });

    const existing = await findTicketByAnyId(id);
    if (!existing) return res.status(404).json({ error: "Ticket not found" });

    const pk = existing.ticketId;
    if (!pk) {
      return res.status(409).json({
        error:
          "This ticket is missing ticketId (partition key). Please recreate/migrate this ticket.",
      });
    }

    const updatedTicket = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await ticketContainer
      .item(existing.id, pk)
      .replace(updatedTicket);
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`),
);
