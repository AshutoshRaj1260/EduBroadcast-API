const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const handleFileUpload = require('../middlewares/multer');

// ----- Teacher Routes -----
// Upload content (restricted to teacher)
router.post('/upload', 
    authenticate, 
    authorize(['teacher']), 
    handleFileUpload, 
    contentController.uploadContent
);

// Get own content status (teacher)
router.get('/my-content', 
    authenticate, 
    authorize(['teacher']), 
    contentController.getMyContent
);

// ----- Principal Routes -----
// View all content
router.get('/all', 
    authenticate, 
    authorize(['principal']), 
    contentController.getAllContent
);

// View pending content
router.get('/pending', 
    authenticate, 
    authorize(['principal']), 
    contentController.getPendingContent
);

// Approve content
router.put('/:id/approve', 
    authenticate, 
    authorize(['principal']), 
    contentController.approveContent
);

// Reject content
router.put('/:id/reject', 
    authenticate, 
    authorize(['principal']), 
    contentController.rejectContent
);

module.exports = router;
