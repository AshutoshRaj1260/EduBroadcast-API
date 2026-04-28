const db = require("../utils/db");

// Upload new content (Teacher)
async function uploadContent(req, res) {
  try {
    const { title, subject, description, start_time, end_time, duration } =
      req.body;
    const file = req.file;

    if (!title || !subject || !file) {
      return res.status(400).json({
        message: "Validation Error: Title, Subject, and File are required.",
      });
    }

    const filePath = file.path;
    const fileType = file.mimetype;
    const fileSize = file.size;
    const uploadedBy = req.user.id;

    // Insert metadata into Content table
    const [contentResult] = await db.query(
      `INSERT INTO Content 
            (title, description, subject, file_path, file_type, file_size, uploaded_by, status, start_time, end_time, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        title,
        description || null,
        subject,
        filePath,
        fileType,
        fileSize,
        uploadedBy,
        start_time || null,
        end_time || null,
        new Date(),
      ],
    );

    const contentId = contentResult.insertId;

    // Retrieve or create subject slot
    let slotId;
    const [existingSlots] = await db.query(
      "SELECT id FROM ContentSlots WHERE subject = ?",
      [subject],
    );

    if (existingSlots.length > 0) {
      slotId = existingSlots[0].id;
    } else {
      const [slotResult] = await db.query(
        "INSERT INTO ContentSlots (subject) VALUES (?)",
        [subject],
      );
      slotId = slotResult.insertId;
    }

    // Determine rotation order and schedule
    const [orderResult] = await db.query(
      "SELECT IFNULL(MAX(rotation_order), 0) as maxOrder FROM ContentSchedule WHERE slot_id = ?",
      [slotId],
    );

    const nextRotationOrder = orderResult[0].maxOrder + 1;
    const slotDuration = duration ? parseInt(duration) : 5;

    await db.query(
      `INSERT INTO ContentSchedule (content_id, slot_id, rotation_order, duration) VALUES (?, ?, ?, ?)`,
      [contentId, slotId, nextRotationOrder, slotDuration],
    );

    res.status(201).json({
      message: "Content successfully uploaded and pending approval.",
      contentId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

// Get teacher's uploaded content
async function getMyContent(req, res) {
  try {
    const [contents] = await db.query(
      "SELECT id, title, subject, status, rejection_reason, start_time, end_time FROM Content WHERE uploaded_by = ?",
      [req.user.id],
    );

    res.status(200).json({
      message: "Successfully fetched your content.",
      data: contents,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed fetching personal content.",
      error: error.message,
    });
  }
}

// Get all system content (Principal)
async function getAllContent(req, res) {
  try {
    const [contents] = await db.query(`
            SELECT c.*, u.name as teacher_name 
            FROM Content c 
            JOIN Users u ON c.uploaded_by = u.id
            ORDER BY c.created_at DESC
        `);
    res.status(200).json({
      message: "Successfully fetched all content.",
      data: contents,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed fetching all global content.",
      error: error.message,
    });
  }
}

// Get pending content for review (Principal)
async function getPendingContent(req, res) {
  try {
    const [contents] = await db.query(`
            SELECT c.*, u.name as teacher_name 
            FROM Content c 
            JOIN Users u ON c.uploaded_by = u.id
            WHERE c.status = 'pending'
            ORDER BY c.created_at DESC
        `);
    res.json(contents);
  } catch (error) {
    res.status(500).json({
      message: "Failed fetching pending queue.",
      error: error.message,
    });
  }
}

// Approve content (Principal)
async function approveContent(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE Content SET status = 'approved', approved_by = ?, approved_at = ?, rejection_reason = ? WHERE id = ?`,
      [req.user.id, new Date(), null, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Content not found.",
      });
    }

    res.status(200).json({
      message: "Content approved.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error approving content.", error: error.message });
  }
}

// Reject content with reason (Principal)
async function rejectContent(req, res) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        message: "Rejection reason is required.",
      });
    }

    const [result] = await db.query(
      `UPDATE Content SET status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = ? WHERE id = ?`,
      [rejection_reason, null, null, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Content not found." });
    }

    res.json({
      message: "Content rejected.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting content.",
      error: error.message,
    });
  }
}

module.exports = {
  uploadContent,
  getMyContent,

  getAllContent,
  getPendingContent,
  approveContent,
  rejectContent,
};
