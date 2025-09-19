const multer = require ('multer');
const supabaseStorage = multer.memoryStorage();
const upload = multer({ storage: supabaseStorage });
module.exports = multer({ storage: supabaseStorage });


