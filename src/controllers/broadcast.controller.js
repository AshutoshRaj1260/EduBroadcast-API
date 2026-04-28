const db = require("../utils/db");

// Get currently active synchronized broadcast content for a teacher
async function getLiveContent(req, res) {
  let exactLocalTime = new Date();
  try {
    const { teacherIdParam } = req.params;
    const { subject } = req.query;

    let teacherId = teacherIdParam.replace("teacher-", "");
    teacherId = parseInt(teacherId, 10);

    if (isNaN(teacherId)) {
      return res.status(400).json({
        message:
          "Invalid teacher identifier format. Expected format: teacher-{id} or simply {id}",
      });
    }

    // Retrieve approved and actively scheduled content
    let query = `
            SELECT c.id, c.title, c.description, c.subject, c.file_path, c.file_type, 
                   c.start_time, c.end_time, cs.rotation_order, cs.duration
            FROM Content c
            JOIN ContentSchedule cs ON c.id = cs.content_id
            WHERE c.uploaded_by = ? 
              AND c.status = 'approved'
              AND c.start_time IS NOT NULL 
              AND c.end_time IS NOT NULL
              AND c.start_time <= ?
              AND c.end_time >= ?
        `;

    const queryParams = [teacherId, exactLocalTime, exactLocalTime];

    // Conditional filtering subject-wise if subject query param is provided
    if (subject) {
      query += ` AND c.subject = ?`;
      queryParams.push(subject);
    }

    query += ` ORDER BY c.subject, cs.rotation_order ASC`;

    const [contentItems] = await db.query(query, queryParams);

    if (contentItems.length === 0) {
      return res.status(200).json({
        message: "No content to display",
      });
    }

    // Group active content by subject
    const groupedBySubject = contentItems.reduce((acc, curr) => {
      if (!acc[curr.subject]) acc[curr.subject] = [];
      acc[curr.subject].push(curr);
      return acc;
    }, {});

    const activeBroadcasts = [];
    const currentTimeMs = Date.now();

    // Calculate currently active rotation item per subject
    for (const subj in groupedBySubject) {
      const items = groupedBySubject[subj];

      const scheduleStartTimeMs = new Date(items[0].start_time).getTime();

      const elapsedMinutes = Math.floor(
        (currentTimeMs - scheduleStartTimeMs) / (1000 * 60),
      );

      const totalCycleDuration = items.reduce(
        (sum, item) => sum + item.duration,
        0,
      );

      if (totalCycleDuration === 0) continue;

      const cyclePosition = elapsedMinutes % totalCycleDuration;
      let cumulative = 0;

      for (const item of items) {
        if (
          cyclePosition >= cumulative &&
          cyclePosition < cumulative + item.duration
        ) {
          activeBroadcasts.push({
            id: item.id,
            title: item.title,
            description: item.description,
            subject: item.subject,
            file_path: item.file_path,
            file_type: item.file_type,
            active_until_minutes: cumulative + item.duration - cyclePosition,
          });
          break;
        }
        cumulative += item.duration;
      }
    }

    if (activeBroadcasts.length === 0) {
      return res.status(200).json({
        message: "No content available",
      });
    }

    res.status(200).json({
      activeBroadcasts,
    });
  } catch (error) {
    console.error("Broadcast rotation error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

module.exports = {
  getLiveContent,
};
