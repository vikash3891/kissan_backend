import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyPermission } from '../middlewares/role.middleware.js';
import { PERMISSIONS } from '../utils/roles.js';
import { upload } from '../middlewares/multer.middleware.js';
import { getStoreDetails, updateStoreDetails, uploadStoreMedia, deleteStoreMedia, getAuditHistory } from '../controllers/store.controller.js';

const router = express.Router();
router.use(verifyJWT);

router.get('/', verifyPermission(PERMISSIONS.STORES_VIEW, PERMISSIONS.SETTINGS_VIEW), getStoreDetails);
router.put('/', verifyPermission(PERMISSIONS.STORES_MANAGE, PERMISSIONS.SETTINGS_UPDATE), updateStoreDetails);
router.post('/media/:type', verifyPermission(PERMISSIONS.STORES_MANAGE), upload.single('image'), uploadStoreMedia);
router.delete('/media/:type', verifyPermission(PERMISSIONS.STORES_MANAGE), deleteStoreMedia);
router.get('/audit', verifyPermission(PERMISSIONS.STORES_VIEW), getAuditHistory);

export default router;
