const express = require("express");
const Property = require("../models/property");
const { isAuthenticated, isOwner } = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
// simple multer disk storage (for production use S3/Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "public", "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

const router = express.Router();

// LIST properties (with search & pagination)
router.get("/", async (req, res) => {
  try {
    const {
      q,
      city,
      category,
      minPrice,
      maxPrice,
      page = 1,
      viewAll, // only for owner toggle
    } = req.query;

    const role = req.session?.role;
    const userId = req.session?.userId;

    const filter = {};
    const hasFilter = q || city || category || minPrice || maxPrice;

    // 🧩 Role-based visibility rules
    if (role === "owner" && !viewAll) {
      // Owner sees only their own listings
      filter.ownerId = userId;
    } else if (role === "renter") {
      // Renter sees only available houses
      filter.status = "available";
    } else if (!role) {
      // Visitor (not logged in) sees only approved (non-pending) properties
      filter.status = { $ne: "pending" };
    }

    // 🧩 Filters (apply on top)
    if (category) filter.category = category;
    if (city) filter["location.city"] = city;
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);

    // 🧩 Text search
    let query = Property.find(filter);
    if (q) {
      query = query.find({ $text: { $search: q } });
    }

    // 🧩 Pagination
    const limit = 12;
    const skip = (Number(page) - 1) * limit;

    const total = await Property.countDocuments(filter);
    const properties = await query
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.render("properties/list", {
      properties,
      total,
      page: Number(page),
      limit,
      currentUserRole: role,
      currentUserId: userId,
      hasFilter,
      q: q || "",
      city: city || "",
      category: category || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      viewAll: viewAll || "",
    });
  } catch (err) {
    console.error("Error loading properties:", err);
    res.status(500).send("Server error");
  }
});


// Show edit form - owner only
router.get('/:id/edit', isAuthenticated, isOwner, async (req, res) => {
  const prop = await Property.findById(req.params.id).lean();
  if (!prop) return res.status(404).send('Not found');
  if (String(prop.ownerId) !== String(req.session.userId)) return res.status(403).send('Not allowed');
  res.render('properties/edit', { property: prop, csrfToken: req.csrfToken() });
});

// Update property (owner)
router.put('/:id/edit', isAuthenticated, isOwner, upload.array('images', 8), async (req, res) => {
  const prop = await Property.findById(req.params.id);
  if (!prop) return res.status(404).send('Not found');
  if (String(prop.ownerId) !== String(req.session.userId)) return res.status(403).send('Not allowed');
    const { title, description, category, price, city, state, address, fullLocation, bedrooms, bathrooms, amenities, rentType, featured } = req.body;
  prop.title = title;
  prop.description = description;
  prop.category = category;
  prop.price = Number(price);
  prop.rentType = rentType || 'perMonth';
  prop.bedrooms = Number(bedrooms || 1);
  prop.bathrooms = Number(bathrooms || 1);
  prop.amenities = amenities ? amenities.split(',').map(a => a.trim()) : [];
    prop.location = { city, state, address, fullLocation };
  if (req.files && req.files.length) {
    prop.images = req.files.map(f => '/uploads/' + path.basename(f.path));
  }
  prop.featured = !!featured;
  await prop.save();
  res.redirect('/' + prop._id);
});






// Show add form - owner only
router.get("/add", isAuthenticated, isOwner, (req, res) => {
  res.render("properties/add");
});

// Add property (owner)
router.post( "/add",
  isAuthenticated,
  isOwner,
  upload.array("images", 8),
  async (req, res) => {
  try {
    const images = (req.files || []).map(f => "/uploads/" + path.basename(f.path));
    const { title, description, category, price, city, state, address, fullLocation, bedrooms, bathrooms, amenities, rentType } = req.body;

    const prop = new Property({
      ownerId: req.session.userId,
      title,
      description,
      category,
      price: Number(price),
      bedrooms: Number(bedrooms || 1),
      bathrooms: Number(bathrooms || 1),
      amenities: amenities ? amenities.split(",").map(a => a.trim()) : [],
      location: {
        city,
        state,
        address,
        fullLocation
      },
      images,
  status: "pending",
  rentType: rentType || "perMonth"
    });
    await prop.save();
    res.redirect("/" );
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving property");
  }
});

// Property detail

router.get("/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      req.session.message = "Please log in or sign up to view property details.";
      return res.redirect("/auth/login?redirect=/properties/" + req.params.id + "&signup=1");
    }
    const prop = await Property.findById(req.params.id).lean();
    if (!prop) return res.status(404).send("Not found");
    res.render("properties/details", { property: prop,  });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Owner update status or delete (basic)
router.post("/:id/status", isAuthenticated, isOwner, async (req, res) => {
  try {
    const { status } = req.body;
  const prop = await Property.findById(req.params.id).lean();
    if (!prop) return res.status(404).send("Not found");
    if (!prop.ownerId.equals(req.session.userId)) return res.status(403).send("Not allowed");
    prop.status = status;
    await prop.save();
    res.redirect("/" + prop._id);
  } catch (err) { console.error(err); res.status(500).send("Server error"); }
});

router.delete("/:id", isAuthenticated, isOwner, async (req, res) => {
  try {
  const prop = await Property.findById(req.params.id).lean();
    if (!prop) return res.status(404).send("Not found");
    if (!prop.ownerId.equals(req.session.userId)) return res.status(403).send("Not allowed");
    await prop.remove();
    res.redirect("/");
  } catch (err) { console.error(err); res.status(500).send("Server error"); }
});



module.exports = router;
